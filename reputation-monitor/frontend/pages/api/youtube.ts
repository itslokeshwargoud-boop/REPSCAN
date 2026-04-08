import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateYouTubeProofUrl,
  logProofRejection,
} from "@/lib/proofValidation";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  description: string;
  proofUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeApiResponse {
  status: "ok" | "error" | "partial_data";
  videos: YouTubeVideo[];
  totalResults: number;
  reason?: string;
  query: string;
}

/** Structured JSON envelope required by the dashboard contract */
interface StructuredResponse {
  success: boolean;
  data: YouTubeVideo[];
  error?: string;
  totalResults: number;
  query: string;
}

/** Build both legacy and structured response from shared fields */
function buildResponse(
  res: NextApiResponse,
  statusCode: number,
  fields: { status: YouTubeApiResponse["status"]; videos: YouTubeVideo[]; totalResults: number; reason?: string; query: string }
) {
  const legacy: YouTubeApiResponse = {
    status: fields.status,
    videos: fields.videos,
    totalResults: fields.totalResults,
    reason: fields.reason,
    query: fields.query,
  };
  const structured: StructuredResponse = {
    success: fields.status !== "error",
    data: fields.videos,
    error: fields.reason,
    totalResults: fields.totalResults,
    query: fields.query,
  };
  return res.status(statusCode).json({ ...legacy, ...structured });
}

// ---------------------------------------------------------------------------
// Core YouTube fetch logic — shared between /api/youtube and /api/metrics
// ---------------------------------------------------------------------------

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  totalResults: number;
  error?: string;
}

/**
 * Fetch YouTube videos for a query string.
 * Reads YOUTUBE_API_KEY from process.env. Never throws.
 */
export async function fetchYouTubeVideos(query: string): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { videos: [], totalResults: 0, error: "YouTube API key not configured" };
  }

  if (!query.trim()) {
    return { videos: [], totalResults: 0, error: "Missing query" };
  }

  try {
    // 15-second timeout for all YouTube API calls
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Step 1: Search for videos (max 12 results)
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "12");
    searchUrl.searchParams.set("key", apiKey);

    const searchRes = await fetch(searchUrl.toString(), { signal: controller.signal });
    const searchData = await searchRes.json() as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          publishedAt: string;
          description: string;
          thumbnails?: {
            medium?: { url: string };
            default?: { url: string };
          };
        };
      }>;
      pageInfo?: { totalResults: number };
      error?: { message: string };
    };

    if (!searchRes.ok || !searchData.items) {
      clearTimeout(timeout);
      return {
        videos: [],
        totalResults: 0,
        error: searchData.error?.message ?? "YouTube search failed",
      };
    }

    const validItems = searchData.items.filter((item) => !!item.id?.videoId);
    const videoIds = validItems.map((item) => item.id.videoId);
    const totalResults = searchData.pageInfo?.totalResults ?? 0;

    if (videoIds.length === 0) {
      clearTimeout(timeout);
      return { videos: [], totalResults: 0 };
    }

    // Step 2: Fetch statistics for each video
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "statistics");
    statsUrl.searchParams.set("id", videoIds.join(","));
    statsUrl.searchParams.set("key", apiKey);

    const statsRes = await fetch(statsUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    const statsData = await statsRes.json() as {
      items?: Array<{
        id: string;
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }>;
    };

    const statsMap: Record<string, { viewCount?: string; likeCount?: string; commentCount?: string }> = {};
    if (statsData.items) {
      for (const item of statsData.items) {
        statsMap[item.id] = item.statistics;
      }
    }

    // Build response — only include items with a valid videoId (ensures a proof URL exists)
    const videos: YouTubeVideo[] = validItems
      .map((item) => {
        const videoId = item.id.videoId;
        const stats = statsMap[videoId] ?? {};
        const proofUrl = `https://www.youtube.com/watch?v=${videoId}`;
        return {
          id: videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl:
            item.snippet.thumbnails?.medium?.url ??
            item.snippet.thumbnails?.default?.url ??
            "",
          description: item.snippet.description,
          proofUrl,
          viewCount: parseInt(stats.viewCount ?? "0", 10),
          likeCount: parseInt(stats.likeCount ?? "0", 10),
          commentCount: parseInt(stats.commentCount ?? "0", 10),
        };
      })
      .filter((v) => {
        const result = validateYouTubeProofUrl(v.proofUrl);
        if (result.status === "invalid") {
          logProofRejection("youtube-api", v.proofUrl, result);
          return false;
        }
        return true;
      });

    return { videos, totalResults };
  } catch (err) {
    const message = err instanceof Error
      ? (err.name === "AbortError" ? "Request timed out" : err.message)
      : "Unknown error";
    return { videos: [], totalResults: 0, error: message };
  }
}

// ---------------------------------------------------------------------------
// API Route Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query) {
    return buildResponse(res, 400, {
      status: "error",
      videos: [],
      totalResults: 0,
      reason: "Missing query parameter",
      query,
    });
  }

  const result = await fetchYouTubeVideos(query);

  if (result.error) {
    return buildResponse(res, 200, {
      status: "error",
      videos: result.videos,
      totalResults: result.totalResults,
      reason: result.error,
      query,
    });
  }

  return buildResponse(res, 200, {
    status: "ok",
    videos: result.videos,
    totalResults: result.totalResults,
    query,
  });
}
