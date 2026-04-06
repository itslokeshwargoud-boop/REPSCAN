/**
 * Real API layer — fetches live data from YouTube + Twitter API routes
 * and transforms it into the ClientData shape used by the dashboard components.
 *
 * NEVER crashes. All errors surface as partial data with status flags.
 */

import type {
  ClientId,
  ClientData,
  RHIMetric,
  RHIScore,
  InsightAlert,
  TrendDataPoint,
} from "./mockData";
import type { YouTubeApiResponse, YouTubeVideo } from "../pages/api/youtube";
import type { TwitterApiResponse, Tweet } from "../pages/api/twitter";

// ---------------------------------------------------------------------------
// Client configuration — maps ClientId to a search query
// ---------------------------------------------------------------------------

export const CLIENT_QUERIES: Record<ClientId, string> = {
  rana: "RANA hospitals",
  kims: "KIMS hospital",
  peddi: "Peddi group",
};

export const CLIENT_NAMES: Record<ClientId, string> = {
  rana: "RANA",
  kims: "KIMS",
  peddi: "PEDDI",
};

// ---------------------------------------------------------------------------
// Fetch helpers — never throw, always return a typed result
// ---------------------------------------------------------------------------

async function fetchYouTube(query: string): Promise<YouTubeApiResponse> {
  try {
    const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as YouTubeApiResponse;
  } catch (err) {
    return {
      status: "error",
      videos: [],
      totalResults: 0,
      reason: err instanceof Error ? err.message : "Unknown error",
      query,
    };
  }
}

async function fetchTwitter(query: string): Promise<TwitterApiResponse> {
  try {
    const res = await fetch(`/api/twitter?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TwitterApiResponse;
  } catch (err) {
    return {
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: err instanceof Error ? err.message : "Unknown error",
      query,
    };
  }
}

// ---------------------------------------------------------------------------
// Metric computation helpers
// ---------------------------------------------------------------------------

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeMetrics(
  videos: YouTubeVideo[],
  tweets: Tweet[]
): RHIMetric[] {
  // --- Sentiment (from tweets: positive signals / total signals)
  const totalTweetEngagement = tweets.reduce(
    (sum, t) => sum + t.likeCount + t.retweetCount + t.quoteCount + t.replyCount,
    0
  );
  const positiveEngagement = tweets.reduce(
    (sum, t) => sum + t.likeCount + t.retweetCount + t.quoteCount,
    0
  );
  const sentimentRaw =
    totalTweetEngagement > 0
      ? (positiveEngagement / totalTweetEngagement) * 100
      : 50;
  const sentiment = clamp(Math.round(sentimentRaw), 0, 100);

  // --- Media Presence (YouTube video count, normalised to /100)
  const mediaPresence = clamp(Math.round((videos.length / 10) * 100), 0, 100);

  // --- Engagement Rate (avg YouTube likes/views %, capped at 10%)
  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const engagementRaw =
    totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
  const engagementRate = clamp(parseFloat(engagementRaw.toFixed(2)), 0, 10);

  // --- Social Reach (total YouTube views, in millions, /100 scale)
  const reachMill = totalViews / 1_000_000;
  const socialReachScore = clamp(Math.round(Math.min(reachMill, 100)), 0, 100);

  // --- Twitter Presence (tweet count, normalized /100)
  const twitterPresence = clamp(Math.round((tweets.length / 10) * 100), 0, 100);

  // --- Response Rate (reply ratio from tweets)
  const totalTweets = tweets.length;
  const totalReplies = tweets.reduce((s, t) => s + t.replyCount, 0);
  const responseRateRaw =
    totalTweets > 0 ? Math.min((totalReplies / totalTweets) * 10, 100) : 0;
  const responseRate = clamp(Math.round(responseRateRaw), 0, 100);

  // --- Content Quality (avg YouTube likes per video, normalized to /100)
  const avgLikes = videos.length > 0 ? totalLikes / videos.length : 0;
  const contentQualityScore = clamp(Math.round(Math.min(avgLikes / 1000, 100)), 0, 100);

  // --- Brand Awareness (composite: avg impressions per tweet, normalized)
  const avgImpressions =
    tweets.length > 0
      ? tweets.reduce((s, t) => s + t.impressionCount, 0) / tweets.length
      : 0;
  const awarenessScore = clamp(
    Math.round(Math.min(avgImpressions / 10_000, 100)),
    0,
    100
  );

  function statusFor(value: number, good: number, attention: number): "good" | "attention" | "risky" {
    if (value >= good) return "good";
    if (value >= attention) return "attention";
    return "risky";
  }

  const metrics: RHIMetric[] = [
    {
      key: "sentiment",
      label: "Public Opinion",
      technicalLabel: "Sentiment Index",
      value: sentiment,
      displayValue: `${sentiment}%`,
      change: sentiment - 70,
      changeLabel: `${sentiment >= 70 ? "+" : ""}${(sentiment - 70).toFixed(1)}%`,
      weight: 0.20,
      status: statusFor(sentiment, 70, 50),
      tooltip: "Ratio of positive interactions (likes, retweets) to total tweet engagement. Computed from live Twitter data.",
      unit: "%",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "media",
      label: "Media Presence",
      technicalLabel: "Media Coverage",
      value: mediaPresence,
      displayValue: `${mediaPresence}/100`,
      change: mediaPresence - 60,
      changeLabel: `${mediaPresence >= 60 ? "+" : ""}${(mediaPresence - 60).toFixed(1)}`,
      weight: 0.15,
      status: statusFor(mediaPresence, 70, 40),
      tooltip: "Number of YouTube videos found for this brand, normalised to a /100 scale. Computed from live YouTube data.",
      unit: "/100",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "engagement",
      label: "Engagement Rate",
      technicalLabel: "Audience Engagement",
      value: engagementRate,
      displayValue: `${engagementRate}%`,
      change: engagementRate - 3,
      changeLabel: `${engagementRate >= 3 ? "+" : ""}${(engagementRate - 3).toFixed(2)}%`,
      weight: 0.15,
      status: statusFor(engagementRate, 3, 1),
      tooltip: "Average YouTube likes divided by total views. Higher means the audience is actively engaging with content.",
      unit: "%",
      higherIsBetter: true,
      displayMax: 10,
    },
    {
      key: "reach",
      label: "Social Reach",
      technicalLabel: "Total View Count",
      value: socialReachScore,
      displayValue: formatLargeNumber(totalViews),
      change: socialReachScore - 50,
      changeLabel: `${socialReachScore >= 50 ? "+" : ""}${(socialReachScore - 50).toFixed(0)}`,
      weight: 0.15,
      status: statusFor(socialReachScore, 50, 20),
      tooltip: "Total YouTube view count across all found videos. Reflects how far the brand's video content has spread.",
      unit: "views",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "twitter",
      label: "Twitter Activity",
      technicalLabel: "Twitter Presence",
      value: twitterPresence,
      displayValue: `${twitterPresence}/100`,
      change: twitterPresence - 50,
      changeLabel: `${twitterPresence >= 50 ? "+" : ""}${(twitterPresence - 50).toFixed(0)}`,
      weight: 0.10,
      status: statusFor(twitterPresence, 70, 40),
      tooltip: "Recent tweet volume for this brand on Twitter/X, normalised to /100. Reflects how actively people are tweeting about the brand.",
      unit: "/100",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "response",
      label: "Response Rate",
      technicalLabel: "Audience Response",
      value: responseRate,
      displayValue: `${responseRate}/100`,
      change: responseRate - 50,
      changeLabel: `${responseRate >= 50 ? "+" : ""}${(responseRate - 50).toFixed(0)}`,
      weight: 0.10,
      status: statusFor(responseRate, 60, 30),
      tooltip: "Ratio of replies to tweets, indicating how much conversation the brand generates. Computed from live Twitter data.",
      unit: "/100",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "quality",
      label: "Content Quality",
      technicalLabel: "Avg Likes per Video",
      value: contentQualityScore,
      displayValue: `${contentQualityScore}/100`,
      change: contentQualityScore - 50,
      changeLabel: `${contentQualityScore >= 50 ? "+" : ""}${(contentQualityScore - 50).toFixed(0)}`,
      weight: 0.10,
      status: statusFor(contentQualityScore, 50, 20),
      tooltip: "Average number of likes per YouTube video (capped at 100K for normalisation). High score means content resonates strongly.",
      unit: "/100",
      higherIsBetter: true,
      displayMax: 100,
    },
    {
      key: "awareness",
      label: "Brand Awareness",
      technicalLabel: "Avg Tweet Impressions",
      value: awarenessScore,
      displayValue: `${awarenessScore}/100`,
      change: awarenessScore - 50,
      changeLabel: `${awarenessScore >= 50 ? "+" : ""}${(awarenessScore - 50).toFixed(0)}`,
      weight: 0.05,
      status: statusFor(awarenessScore, 50, 20),
      tooltip: "Average Twitter impression count per tweet (normalised). Reflects how many people see the brand's mentions.",
      unit: "/100",
      higherIsBetter: true,
      displayMax: 100,
    },
  ];

  return metrics;
}

function computeRHI(metrics: RHIMetric[]): RHIScore {
  const score = parseFloat(
    metrics
      .reduce((sum, m) => sum + (m.value / m.displayMax) * 100 * m.weight, 0)
      .toFixed(1)
  );
  const clamped = clamp(score, 0, 100);
  const trend = parseFloat((clamped - 70).toFixed(1));
  const status: "good" | "attention" | "risky" =
    clamped >= 70 ? "good" : clamped >= 50 ? "attention" : "risky";

  return {
    score: clamped,
    trend,
    trendLabel: `${trend >= 0 ? "+" : ""}${trend}%`,
    status,
    summary:
      status === "good"
        ? "Your online reputation is strong. Engagement is healthy and media coverage is positive."
        : status === "attention"
        ? "Your reputation needs attention. Some metrics are below target — review engagement and sentiment."
        : "Your online reputation is at risk. Immediate action is needed to improve key metrics.",
  };
}

/** Build trend data from real video publication dates */
function computeTrendData(videos: YouTubeVideo[], tweets: Tweet[]): TrendDataPoint[] {
  // Group YouTube videos by month to build a real timeline
  const monthMap: Record<string, { likes: number; views: number; count: number }> = {};

  for (const video of videos) {
    const d = new Date(video.publishedAt);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) monthMap[key] = { likes: 0, views: 0, count: 0 };
    monthMap[key].likes += video.likeCount;
    monthMap[key].views += video.viewCount;
    monthMap[key].count += 1;
  }

  // Sort months and take up to 7
  const sortedKeys = Object.keys(monthMap).sort().slice(-7);

  if (sortedKeys.length === 0) {
    // Fallback: produce a single data point for "now"
    const now = new Date();
    return [
      {
        date: now.toLocaleString("default", { month: "short" }),
        engagement: 0,
        sentiment: 50,
        mediaPresence: 0,
      },
    ];
  }

  const tweetPositiveRatio =
    tweets.length > 0
      ? (tweets.reduce((s, t) => s + t.likeCount + t.retweetCount, 0) /
          Math.max(tweets.reduce((s, t) => s + t.likeCount + t.retweetCount + t.replyCount + t.quoteCount, 0), 1)) *
        100
      : 50;

  return sortedKeys.map((key) => {
    const bucket = monthMap[key];
    const engagementRate =
      bucket.views > 0
        ? clamp(parseFloat(((bucket.likes / bucket.views) * 100).toFixed(2)), 0, 10)
        : 0;
    const date = new Date(`${key}-01`);
    return {
      date: date.toLocaleString("default", { month: "short" }),
      engagement: engagementRate,
      sentiment: clamp(Math.round(tweetPositiveRatio), 0, 100),
      mediaPresence: clamp(bucket.count * 10, 0, 100),
    };
  });
}

function computeInsights(
  videos: YouTubeVideo[],
  tweets: Tweet[],
  clientId: ClientId,
  clientName: string
): InsightAlert[] {
  const insights: InsightAlert[] = [];

  // Top YouTube video
  const topVideo = videos.reduce<YouTubeVideo | null>(
    (best, v) => (!best || v.viewCount > best.viewCount ? v : best),
    null
  );
  if (topVideo) {
    insights.push({
      id: `yt-top-${topVideo.id}`,
      type: "positive",
      message: `Top YouTube video: "${topVideo.title.slice(0, 60)}..."`,
      detail: `${formatLargeNumber(topVideo.viewCount)} views · ${formatLargeNumber(topVideo.likeCount)} likes · Source: ${topVideo.proofUrl}`,
      timestamp: new Date(topVideo.publishedAt).toLocaleDateString(),
    });
  }

  // Top tweet
  const topTweet = tweets.reduce<Tweet | null>(
    (best, t) => (!best || t.likeCount > best.likeCount ? t : best),
    null
  );
  if (topTweet) {
    insights.push({
      id: `tw-top-${topTweet.id}`,
      type: topTweet.likeCount > 5 ? "positive" : "neutral",
      message: `Most-liked tweet about ${clientName}: ${topTweet.text.slice(0, 80)}...`,
      detail: `${topTweet.likeCount} likes · ${topTweet.retweetCount} retweets · Source: ${topTweet.proofUrl}`,
      timestamp: topTweet.createdAt ? new Date(topTweet.createdAt).toLocaleDateString() : "Recent",
    });
  }

  // Warning if no data
  if (videos.length === 0 && tweets.length === 0) {
    insights.push({
      id: "no-data",
      type: "warning",
      message: `No live data found for ${clientName}`,
      detail: "YouTube and Twitter returned no results for this brand. Try a different search query.",
      timestamp: new Date().toLocaleDateString(),
    });
  }

  // Overall engagement note
  if (videos.length > 0) {
    const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
    insights.push({
      id: "yt-reach",
      type: "neutral",
      message: `${videos.length} YouTube videos found with ${formatLargeNumber(totalViews)} total views`,
      detail: `Search query: "${CLIENT_QUERIES[clientId]}" · All videos include direct YouTube proof links.`,
      timestamp: new Date().toLocaleDateString(),
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RealApiResponse {
  data: ClientData | null;
  status: "ok" | "partial_data" | "error";
  reason?: string;
  youtubeData: YouTubeApiResponse;
  twitterData: TwitterApiResponse;
}

export async function fetchClientDashboard(clientId: ClientId): Promise<RealApiResponse> {
  const query = CLIENT_QUERIES[clientId];
  const clientName = CLIENT_NAMES[clientId];

  // Fetch both APIs in parallel — never throws
  const [youtubeData, twitterData] = await Promise.all([
    fetchYouTube(query),
    fetchTwitter(query),
  ]);

  const videos = youtubeData.videos;
  const tweets = twitterData.tweets;

  const metrics = computeMetrics(videos, tweets);
  const rhi = computeRHI(metrics);
  const trendData = computeTrendData(videos, tweets);
  const insights = computeInsights(videos, tweets, clientId, clientName);

  const overallStatus =
    youtubeData.status === "ok" && twitterData.status === "ok"
      ? "ok"
      : youtubeData.status === "error" && twitterData.status === "error"
      ? "error"
      : "partial_data";

  const data: ClientData = {
    clientId,
    clientName,
    rhi,
    metrics,
    trendData,
    insights,
    apiStatus: {
      status: overallStatus,
      reason:
        youtubeData.status === "error" || twitterData.status === "error"
          ? "api_error"
          : undefined,
      tweetsFetched: tweets.length,
      youtubeFetched: videos.length,
    },
  };

  return { data, status: overallStatus, youtubeData, twitterData };
}

/** Compute a mini summary for the client-switcher cards */
export function computeClientSummary(clientId: ClientId, clientData: ClientData) {
  return {
    clientId,
    clientName: clientData.clientName,
    score: clientData.rhi.score,
    trend: clientData.rhi.trend,
    trendLabel: clientData.rhi.trendLabel,
    status: clientData.rhi.status,
  };
}
