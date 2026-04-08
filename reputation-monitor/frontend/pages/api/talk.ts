/**
 * /api/talk — Aggregates YouTube comments ("talk items") across all videos
 * for a given keyword, performs sentiment analysis, and returns paginated results.
 *
 * Query parameters:
 *   keyword   (required)  — search keyword to find videos
 *   page      (optional)  — page number, default 1
 *   limit     (optional)  — items per page, default 50
 *   sentiment (optional)  — filter: "positive" | "negative" | "neutral"
 *   search    (optional)  — text search within talk items
 *   sort      (optional)  — "newest" (default) | "oldest"
 *
 * Response envelope:
 *   { success, data: { items, total, page, limit, totalPages, sentimentCounts, totalTalkItems }, error? }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchYouTubeVideos } from "./youtube";
import type { YouTubeVideo } from "./youtube";
import {
  getDb,
  upsertTalkItems,
  queryTalkItems,
  getVideoFetchStatus,
  upsertVideoFetchStatus,
  getTotalCachedItems,
  type TalkItemRow,
  type TalkQueryResult,
} from "@/lib/db/talkCache";
import { analyzeSentimentBatch, type SentimentLabel } from "@/lib/sentiment";
import {
  validateYouTubeCommentProofUrl,
  logProofRejection,
} from "@/lib/proofValidation";

// ---------------------------------------------------------------------------
// YouTube Comment Thread fetching
// ---------------------------------------------------------------------------

interface YtComment {
  commentId: string;
  text: string;
  author: string;
  publishedAt: string;
  videoId: string;
}

interface CommentThreadPage {
  comments: YtComment[];
  nextPageToken: string | null;
}

/**
 * Fetch one page of comment threads for a video.
 * Uses the YouTube Data API v3 commentThreads.list endpoint.
 */
async function fetchCommentPage(
  videoId: string,
  apiKey: string,
  pageToken?: string | null
): Promise<CommentThreadPage> {
  const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", "100");
  url.searchParams.set("textFormat", "plainText");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", apiKey);
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg =
        (errData as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
      console.warn(`Comment fetch failed for ${videoId}: ${msg}`);
      return { comments: [], nextPageToken: null };
    }

    const data = (await res.json()) as {
      items?: Array<{
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              textDisplay: string;
              authorDisplayName: string;
              publishedAt: string;
            };
          };
        };
      }>;
      nextPageToken?: string;
    };

    const comments: YtComment[] = (data.items ?? []).map((item) => ({
      commentId: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      author: item.snippet.topLevelComment.snippet.authorDisplayName ?? "",
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt ?? "",
      videoId,
    }));

    return {
      comments,
      nextPageToken: data.nextPageToken ?? null,
    };
  } catch (err) {
    clearTimeout(timeout);
    console.warn(`Comment fetch error for ${videoId}:`, err instanceof Error ? err.message : err);
    return { comments: [], nextPageToken: null };
  }
}

// ---------------------------------------------------------------------------
// Core aggregation logic
// ---------------------------------------------------------------------------

/** Max comment pages to fetch per video (100 per page × 5 = 500 per video) */
const MAX_PAGES_PER_VIDEO = 5;

/** Max total talk items to fetch across all videos in one request cycle */
const MAX_ITEMS_TARGET = 6000;

/** Batch size for sentiment analysis */
const SENTIMENT_BATCH_SIZE = 32;

/**
 * Fetch and cache talk items for all videos matching the keyword.
 * Skips videos that have already been fully fetched.
 */
async function aggregateTalkItems(
  keyword: string,
  videos: YouTubeVideo[]
): Promise<{ fetched: number; errors: string[] }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { fetched: 0, errors: ["YouTube API key not configured"] };
  }

  let totalFetched = getTotalCachedItems(keyword);
  const errors: string[] = [];
  const newComments: Array<YtComment & { videoTitle: string; channelTitle: string }> = [];

  for (const video of videos) {
    if (totalFetched >= MAX_ITEMS_TARGET) break;

    const status = getVideoFetchStatus(video.id, keyword);

    // Skip already fully-fetched videos
    if (status?.fullyFetched) continue;

    let pageToken: string | null = status?.nextPageToken ?? null;
    let pagesFetched = status ? Math.ceil(status.totalFetched / 100) : 0;
    let videoItemsFetched = status?.totalFetched ?? 0;

    while (pagesFetched < MAX_PAGES_PER_VIDEO && totalFetched < MAX_ITEMS_TARGET) {
      const page = await fetchCommentPage(video.id, apiKey, pageToken);

      if (page.comments.length === 0) {
        // No more comments or error — mark as fully fetched
        upsertVideoFetchStatus({
          videoId: video.id,
          keyword,
          nextPageToken: null,
          totalFetched: videoItemsFetched,
          lastFetchedAt: new Date().toISOString(),
          fullyFetched: 1,
        });
        break;
      }

      for (const c of page.comments) {
        newComments.push({
          ...c,
          videoTitle: video.title,
          channelTitle: video.channelTitle,
        });
      }

      videoItemsFetched += page.comments.length;
      totalFetched += page.comments.length;
      pagesFetched++;
      pageToken = page.nextPageToken;

      if (!pageToken) {
        upsertVideoFetchStatus({
          videoId: video.id,
          keyword,
          nextPageToken: null,
          totalFetched: videoItemsFetched,
          lastFetchedAt: new Date().toISOString(),
          fullyFetched: 1,
        });
        break;
      }

      // Save progress
      upsertVideoFetchStatus({
        videoId: video.id,
        keyword,
        nextPageToken: pageToken,
        totalFetched: videoItemsFetched,
        lastFetchedAt: new Date().toISOString(),
        fullyFetched: 0,
      });
    }
  }

  // Run sentiment analysis on new comments in batches
  if (newComments.length > 0) {
    const talkRows: TalkItemRow[] = [];

    for (let i = 0; i < newComments.length; i += SENTIMENT_BATCH_SIZE) {
      const batch = newComments.slice(i, i + SENTIMENT_BATCH_SIZE);
      const texts = batch.map((c) => c.text);

      let sentiments: SentimentLabel[];
      try {
        sentiments = await analyzeSentimentBatch(texts);
      } catch {
        // If sentiment analysis fails entirely, default to neutral
        sentiments = texts.map(() => "neutral" as SentimentLabel);
      }

      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        // Build proof URL: direct link to comment on YouTube
        const proofUrl = `https://www.youtube.com/watch?v=${c.videoId}&lc=${c.commentId}`;

        // Validate proof URL at ingestion time
        const proofResult = validateYouTubeCommentProofUrl(proofUrl);
        if (proofResult.status === "invalid") {
          logProofRejection("talk-api-ingest", proofUrl, proofResult);
          // Skip invalid proofs to prevent bad data from entering the cache
          continue;
        }

        talkRows.push({
          commentId: c.commentId,
          videoId: c.videoId,
          text: c.text,
          author: c.author,
          publishedAt: c.publishedAt,
          videoTitle: c.videoTitle,
          channelTitle: c.channelTitle,
          sentiment: sentiments[j],
          proofUrl,
          keyword,
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    upsertTalkItems(talkRows);
  }

  return { fetched: newComments.length, errors };
}

// ---------------------------------------------------------------------------
// API Response types
// ---------------------------------------------------------------------------

export interface TalkItem {
  commentId: string;
  text: string;
  author: string;
  publishedAt: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  sentiment: SentimentLabel;
  proofUrl: string;
}

export interface TalkApiResponse {
  success: boolean;
  data: {
    items: TalkItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sentimentCounts: { positive: number; negative: number; neutral: number };
    totalTalkItems: number;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TalkApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
        totalTalkItems: 0,
      },
      error: "Method not allowed",
    });
  }

  const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim() : "";
  if (!keyword) {
    return res.status(400).json({
      success: false,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
        totalTalkItems: 0,
      },
      error: "Missing keyword parameter",
    });
  }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
  const sentiment = (["positive", "negative", "neutral"] as const).includes(
    req.query.sentiment as "positive" | "negative" | "neutral"
  )
    ? (req.query.sentiment as SentimentLabel)
    : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const sort = req.query.sort === "oldest" ? "oldest" : "newest";

  // Cache headers
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  try {
    // Ensure DB is initialized
    getDb();

    // Check if we need to fetch new comments
    const cachedCount = getTotalCachedItems(keyword);

    if (cachedCount === 0) {
      // First time: fetch videos and their comments
      const videoResult = await fetchYouTubeVideos(keyword);

      if (videoResult.error && videoResult.videos.length === 0) {
        return res.status(200).json({
          success: false,
          data: {
            items: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
            sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
            totalTalkItems: 0,
          },
          error: videoResult.error,
        });
      }

      // Aggregate talk items from all videos
      const aggResult = await aggregateTalkItems(keyword, videoResult.videos);
      if (aggResult.errors.length > 0) {
        console.warn("Talk aggregation warnings:", aggResult.errors);
      }
    }

    // Query cached items with filters
    const result: TalkQueryResult = queryTalkItems({
      keyword,
      sentiment,
      search,
      sort: sort as "newest" | "oldest",
      page,
      limit,
    });

    // Map to API response format — guarantee proof URL present
    const items: TalkItem[] = result.items
      .filter((item) => !!item.proofUrl)
      .map((item) => ({
        commentId: item.commentId,
        text: item.text,
        author: item.author,
        publishedAt: item.publishedAt,
        videoId: item.videoId,
        videoTitle: item.videoTitle,
        channelTitle: item.channelTitle,
        sentiment: item.sentiment,
        proofUrl: item.proofUrl,
      }));

    return res.status(200).json({
      success: true,
      data: {
        items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        sentimentCounts: result.sentimentCounts,
        totalTalkItems: getTotalCachedItems(keyword),
      },
    });
  } catch (err) {
    console.error("Talk API error:", err);
    return res.status(500).json({
      success: false,
      data: {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
        totalTalkItems: 0,
      },
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
