/**
 * /api/mood-map — Analyzes the emotional journey of a YouTube video.
 *
 * Query parameters:
 *   video_url        (required)  — YouTube link or direct video URL
 *   keyword_context  (optional)  — celebrity / brand / movie / hospital name
 *
 * Response envelope:
 *   { success, data: MoodMapReport, error? }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchYouTubeVideos } from "./youtube";
import {
  generateMoodMapReport,
  type MoodMapReport,
  type TranscriptSegment,
} from "@/lib/moodMap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoodMapApiResponse {
  success: boolean;
  data: MoodMapReport | null;
  error?: string;
}

// ---------------------------------------------------------------------------
// YouTube helpers
// ---------------------------------------------------------------------------

/**
 * Extract video ID from a YouTube URL.
 * Supports standard watch URLs, short URLs, and embed URLs.
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Already a plain video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  try {
    const parsed = new URL(url);

    // Strict hostname check to prevent substring bypass (e.g. notyoutube.com)
    const validHosts = ["www.youtube.com", "youtube.com", "m.youtube.com"];

    if (
      validHosts.includes(parsed.hostname) &&
      parsed.searchParams.has("v")
    ) {
      return parsed.searchParams.get("v");
    }

    // youtu.be/xxx
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    // youtube.com/embed/xxx
    if (
      validHosts.includes(parsed.hostname) &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return parsed.pathname.split("/")[2] || null;
    }
  } catch {
    // Not a valid URL — return null
  }

  return null;
}

/**
 * Fetch comment texts for a given video via the YouTube Data API.
 * Returns an array of comment text strings.
 */
async function fetchVideoComments(
  videoId: string,
  maxComments: number = 100
): Promise<string[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = new URL(
    "https://www.googleapis.com/youtube/v3/commentThreads"
  );
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", String(Math.min(maxComments, 100)));
  url.searchParams.set("textFormat", "plainText");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = (await res.json()) as {
      items?: Array<{
        snippet: {
          topLevelComment: {
            snippet: { textDisplay: string };
          };
        };
      }>;
    };

    return (data.items ?? []).map(
      (item) => item.snippet.topLevelComment.snippet.textDisplay
    );
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * Fetch video metadata (title, duration estimate from stats) using the
 * YouTube Data API videos endpoint.
 */
async function fetchVideoDetails(
  videoId: string
): Promise<{
  title: string;
  durationSeconds: number;
  description: string;
} | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = (await res.json()) as {
      items?: Array<{
        snippet: { title: string; description: string };
        contentDetails: { duration: string };
      }>;
    };

    const item = data.items?.[0];
    if (!item) return null;

    // Parse ISO 8601 duration (PT#H#M#S)
    const durationStr = item.contentDetails.duration;
    const durationSeconds = parseIsoDuration(durationStr);

    return {
      title: item.snippet.title,
      durationSeconds,
      description: item.snippet.description,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Parse ISO 8601 duration string (e.g. PT1H2M30S) to seconds.
 */
export function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Build pseudo-transcript segments from comments + description.
 * Since we don't have actual audio transcript in the MVP, we synthesize
 * time-distributed transcript segments from available text data.
 */
function buildPseudoTranscript(
  comments: string[],
  description: string,
  durationSeconds: number,
  segmentSize: number
): TranscriptSegment[] {
  const allText: string[] = [];

  // Use video description as opening context
  if (description.trim()) {
    allText.push(description.trim());
  }

  // Add comments
  allText.push(...comments);

  if (allText.length === 0) return [];

  const numSegments = Math.max(1, Math.ceil(durationSeconds / segmentSize));
  const textsPerSegment = Math.max(1, Math.ceil(allText.length / numSegments));

  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentSize;
    const endTime = Math.min((i + 1) * segmentSize, durationSeconds);
    const startIdx = i * textsPerSegment;
    const endIdx = Math.min(startIdx + textsPerSegment, allText.length);
    const text = allText.slice(startIdx, endIdx).join(" ");

    if (text.trim()) {
      segments.push({ startTime, endTime, text });
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MoodMapApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      data: null,
      error: "Method not allowed",
    });
  }

  const videoUrl =
    typeof req.query.video_url === "string"
      ? req.query.video_url.trim()
      : "";
  const keywordContext =
    typeof req.query.keyword_context === "string"
      ? req.query.keyword_context.trim()
      : "";

  if (!videoUrl) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Missing video_url parameter",
    });
  }

  // Cache headers
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=120"
  );

  try {
    const videoId = extractVideoId(videoUrl);

    let videoTitle = "Unknown";
    let durationSeconds = 0;
    let description = "";
    let comments: string[] = [];

    if (videoId) {
      // Fetch video details and comments in parallel
      const [details, commentTexts] = await Promise.all([
        fetchVideoDetails(videoId),
        fetchVideoComments(videoId),
      ]);

      if (details) {
        videoTitle = details.title;
        durationSeconds = details.durationSeconds;
        description = details.description;
      }

      comments = commentTexts;
    } else {
      // If no video ID could be extracted, try searching by keyword
      if (keywordContext) {
        const searchResult = await fetchYouTubeVideos(keywordContext);
        if (searchResult.videos.length > 0) {
          const video = searchResult.videos[0];
          videoTitle = video.title;
          durationSeconds = 120; // Estimate for search results
          comments = [];
        }
      }
    }

    // Build pseudo-transcript from available data
    const segmentSize = 10;
    if (durationSeconds === 0) {
      durationSeconds = Math.max(
        segmentSize,
        comments.length * segmentSize
      );
    }

    const transcriptSegments = buildPseudoTranscript(
      comments,
      description,
      durationSeconds,
      segmentSize
    );

    const report = generateMoodMapReport({
      videoUrl,
      videoTitle,
      keywordContext: keywordContext || undefined,
      transcriptSegments:
        transcriptSegments.length > 0 ? transcriptSegments : undefined,
      comments: comments.length > 0 ? comments : undefined,
      durationSeconds,
      segmentSize,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("MoodMap API error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
