import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<YouTubeApiResponse>
) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query) {
    return res.status(400).json({
      status: "error",
      videos: [],
      totalResults: 0,
      reason: "Missing query parameter",
      query,
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: "error",
      videos: [],
      totalResults: 0,
      reason: "YouTube API key not configured",
      query,
    });
  }

  try {
    // Step 1: Search for videos
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
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
      return res.json({
        status: "error",
        videos: [],
        totalResults: 0,
        reason: searchData.error?.message ?? "YouTube search failed",
        query,
      });
    }

    const validItems = searchData.items.filter((item) => !!item.id?.videoId);
    const videoIds = validItems.map((item) => item.id.videoId);
    const totalResults = searchData.pageInfo?.totalResults ?? 0;

    if (videoIds.length === 0) {
      return res.json({ status: "ok", videos: [], totalResults: 0, query });
    }

    // Step 2: Fetch statistics for each video
    const statsUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`;

    const statsRes = await fetch(statsUrl);
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
    const videos: YouTubeVideo[] = validItems.map((item) => {
      const videoId = item.id.videoId;
      const stats = statsMap[videoId] ?? {};
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
        proofUrl: `https://www.youtube.com/watch?v=${videoId}`,
        viewCount: parseInt(stats.viewCount ?? "0", 10),
        likeCount: parseInt(stats.likeCount ?? "0", 10),
        commentCount: parseInt(stats.commentCount ?? "0", 10),
      };
    });

    return res.json({ status: "ok", videos, totalResults, query });
  } catch (err) {
    return res.json({
      status: "error",
      videos: [],
      totalResults: 0,
      reason: err instanceof Error ? err.message : "Unknown error",
      query,
    });
  }
}
