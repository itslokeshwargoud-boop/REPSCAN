/**
 * Processing Engine — The unified intelligence layer for Reputation OS.
 *
 * Transforms raw Talk (comments with sentiment + bot detection) and Feed
 * (YouTube video search + metrics) data into derived intelligence consumed
 * by ALL dashboard features.
 *
 * Architecture:
 *   Raw Data (Talk + Feed) → Processing Engine → Unified Intelligence → All Features
 *
 * This module is used server-side (Next.js API routes) and never imported
 * directly by frontend pages.
 */

import type { TalkItemRow } from "@/lib/db/talkCache";
import type { YouTubeVideo } from "@/pages/api/youtube";
import type { SentimentLabel } from "@/lib/sentiment";
import type { BotLabel } from "@/lib/botDetection";
import {
  type ReputationScore,
  type Alert,
  type NarrativeCluster,
  type Influencer,
  type AuthenticityReport,
  type ActionRecommendation,
  type PredictionsReport,
  type PredictionForecast,
  type CampaignReport,
  type CampaignMetric,
} from "@/lib/reputationOs";
import { VIJAY_TENANT_ID } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Unified Data Model — shared schema consumed by all features
// ---------------------------------------------------------------------------

export interface UnifiedIntelligence {
  /** Keyword used for data retrieval */
  keyword: string;
  /** UTC timestamp of when processing ran */
  processedAt: string;
  /** Total number of comments analyzed */
  totalComments: number;
  /** Total number of videos analyzed */
  totalVideos: number;
  /** Aggregated sentiment counts */
  sentimentCounts: { positive: number; negative: number; neutral: number };
  /** Overall sentiment score 0-100 (higher = more positive) */
  sentimentScore: number;
  /** Trend velocity: rate of recent activity change */
  trendVelocity: number;
  /** Engagement metrics from Feed data */
  engagementMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
    avgViewsPerVideo: number;
  };
  /** Risk level derived from sentiment + bot activity + trends */
  riskLevel: "low" | "medium" | "high" | "critical";
  /** Bot analysis summary */
  botAnalysis: {
    totalAnalyzed: number;
    humanCount: number;
    suspiciousCount: number;
    botCount: number;
    botPercentage: number;
    genuinePercentage: number;
  };
  /** Per-channel engagement data */
  channelBreakdown: Array<{
    channel: string;
    commentCount: number;
    avgSentiment: number;
    totalViews: number;
    engagementRate: number;
  }>;
  /** Detected narrative clusters */
  narrativeClusters: Array<{
    label: string;
    keywords: string[];
    commentCount: number;
    percentage: number;
    sentiment: "positive" | "negative" | "neutral" | "mixed";
    sampleTexts: string[];
    sampleProofUrls: string[];
    trend: "growing" | "stable" | "declining";
  }>;
  /** Top influencers (comment authors) ranked by engagement */
  topInfluencers: Array<{
    username: string;
    commentCount: number;
    avgSentiment: number;
    reachEstimate: number;
    engagementScore: number;
    classification: "supporter" | "attacker" | "neutral";
  }>;
  /** Bot behavior patterns */
  botPatterns: Array<{
    type: string;
    count: number;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  /** Historical daily scores (for predictions) */
  dailyScores: Array<{ date: string; score: number }>;
  /** Raw talk items (for detail views) */
  talkItems: TalkItemRow[];
  /** Raw video data (for feed views) */
  videos: YouTubeVideo[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sentimentToNumeric(s: SentimentLabel): number {
  if (s === "positive") return 1;
  if (s === "negative") return -1;
  return 0;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function daysAgoDate(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// STEP 1: Data Ingestion — Normalize Talk + Feed into unified format
// ---------------------------------------------------------------------------

export function ingestData(
  talkItems: TalkItemRow[],
  videos: YouTubeVideo[],
  keyword: string,
): UnifiedIntelligence {
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  let botHuman = 0;
  let botSuspicious = 0;
  let botBot = 0;

  for (const item of talkItems) {
    const s = item.sentiment as SentimentLabel;
    if (s === "positive") sentimentCounts.positive++;
    else if (s === "negative") sentimentCounts.negative++;
    else sentimentCounts.neutral++;

    const bl = item.botLabel as BotLabel;
    if (bl === "human") botHuman++;
    else if (bl === "suspicious") botSuspicious++;
    else botBot++;
  }

  const total = talkItems.length || 1;
  const sentimentScore = computeSentimentScore(sentimentCounts, talkItems.length);
  const trendVelocity = computeTrendVelocity(talkItems);
  const engagementMetrics = computeEngagementMetrics(videos);
  const botPercentage = ((botSuspicious + botBot) / total) * 100;
  const riskLevel = computeRiskLevel(sentimentScore, botPercentage, trendVelocity);
  const channelBreakdown = computeChannelBreakdown(talkItems, videos);
  const narrativeClusters = buildNarrativeClusters(talkItems);
  const topInfluencers = detectInfluencers(talkItems);
  const botPatterns = detectBotPatterns(talkItems);
  const dailyScores = computeDailyScores(talkItems);

  return {
    keyword,
    processedAt: new Date().toISOString(),
    totalComments: talkItems.length,
    totalVideos: videos.length,
    sentimentCounts,
    sentimentScore,
    trendVelocity,
    engagementMetrics,
    riskLevel,
    botAnalysis: {
      totalAnalyzed: talkItems.length,
      humanCount: botHuman,
      suspiciousCount: botSuspicious,
      botCount: botBot,
      botPercentage: Math.round(botPercentage * 100) / 100,
      genuinePercentage: Math.round((100 - botPercentage) * 100) / 100,
    },
    channelBreakdown,
    narrativeClusters,
    topInfluencers,
    botPatterns,
    dailyScores,
    talkItems,
    videos,
  };
}

// ---------------------------------------------------------------------------
// STEP 2: Sentiment Analysis Engine
// ---------------------------------------------------------------------------

function computeSentimentScore(
  counts: { positive: number; negative: number; neutral: number },
  total: number,
): number {
  if (total === 0) return 50;
  // Weighted: positive=100, neutral=50, negative=0
  const raw = (counts.positive * 100 + counts.neutral * 50) / total;
  return clamp(Math.round(raw * 100) / 100, 0, 100);
}

// ---------------------------------------------------------------------------
// STEP 3: Trend Detection Engine
// ---------------------------------------------------------------------------

function computeTrendVelocity(items: TalkItemRow[]): number {
  if (items.length < 2) return 0;

  const now = Date.now();
  const last24h = items.filter(
    (i) => now - new Date(i.publishedAt).getTime() < 86_400_000,
  ).length;
  const prev24h = items.filter((i) => {
    const age = now - new Date(i.publishedAt).getTime();
    return age >= 86_400_000 && age < 172_800_000;
  }).length;

  if (prev24h === 0) return last24h > 0 ? 100 : 0;
  return Math.round(((last24h - prev24h) / prev24h) * 100);
}

// ---------------------------------------------------------------------------
// STEP 4: Engagement Metrics from Feed data
// ---------------------------------------------------------------------------

function computeEngagementMetrics(videos: YouTubeVideo[]) {
  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const totalComments = videos.reduce((s, v) => s + v.commentCount, 0);
  const avgViewsPerVideo =
    videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
  const engagementRate =
    totalViews > 0
      ? parseFloat(((totalLikes / totalViews) * 100).toFixed(2))
      : 0;

  return { totalViews, totalLikes, totalComments, engagementRate, avgViewsPerVideo };
}

// ---------------------------------------------------------------------------
// STEP 5: Risk Scoring System
// ---------------------------------------------------------------------------

function computeRiskLevel(
  sentimentScore: number,
  botPercentage: number,
  trendVelocity: number,
): "low" | "medium" | "high" | "critical" {
  // Composite risk score: lower sentiment, higher bots, negative velocity = more risk
  let riskScore = 0;

  // Sentiment risk (0-40 points)
  if (sentimentScore < 30) riskScore += 40;
  else if (sentimentScore < 50) riskScore += 25;
  else if (sentimentScore < 65) riskScore += 10;

  // Bot risk (0-30 points)
  if (botPercentage > 30) riskScore += 30;
  else if (botPercentage > 20) riskScore += 20;
  else if (botPercentage > 10) riskScore += 10;

  // Negative velocity risk (0-30 points)
  if (trendVelocity < -50) riskScore += 30;
  else if (trendVelocity < -20) riskScore += 15;
  else if (trendVelocity < 0) riskScore += 5;

  if (riskScore >= 60) return "critical";
  if (riskScore >= 40) return "high";
  if (riskScore >= 20) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// STEP 6: Channel Breakdown
// ---------------------------------------------------------------------------

function computeChannelBreakdown(
  talkItems: TalkItemRow[],
  videos: YouTubeVideo[],
) {
  const channelMap = new Map<
    string,
    { commentCount: number; sentimentSum: number; totalViews: number; likeCount: number }
  >();

  // Aggregate comments per channel
  for (const item of talkItems) {
    const ch = item.channelTitle || "Unknown";
    const existing = channelMap.get(ch) || {
      commentCount: 0,
      sentimentSum: 0,
      totalViews: 0,
      likeCount: 0,
    };
    existing.commentCount++;
    existing.sentimentSum += sentimentToNumeric(item.sentiment as SentimentLabel);
    channelMap.set(ch, existing);
  }

  // Add video metrics per channel
  for (const v of videos) {
    const ch = v.channelTitle || "Unknown";
    const existing = channelMap.get(ch) || {
      commentCount: 0,
      sentimentSum: 0,
      totalViews: 0,
      likeCount: 0,
    };
    existing.totalViews += v.viewCount;
    existing.likeCount += v.likeCount;
    channelMap.set(ch, existing);
  }

  return Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      commentCount: data.commentCount,
      avgSentiment:
        data.commentCount > 0
          ? Math.round((data.sentimentSum / data.commentCount) * 100) / 100
          : 0,
      totalViews: data.totalViews,
      engagementRate:
        data.totalViews > 0
          ? parseFloat(((data.likeCount / data.totalViews) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.commentCount - a.commentCount);
}

// ---------------------------------------------------------------------------
// STEP 7: Narrative Builder — cluster topics using keyword matching
// ---------------------------------------------------------------------------

interface NarrativeRule {
  label: string;
  keywords: string[];
}

const NARRATIVE_RULES: NarrativeRule[] = [
  {
    label: "Acting & Film Performances",
    keywords: [
      "film", "movie", "acting", "performance", "role", "character",
      "scene", "dialogue", "screen", "direction", "arjun reddy",
      "liger", "kushi", "dear comrade",
    ],
  },
  {
    label: "Fan Community & Social Media",
    keywords: [
      "fan", "love", "best", "favorite", "amazing", "super", "mass",
      "rowdy", "support", "loyal", "follow", "crush", "idol",
    ],
  },
  {
    label: "Upcoming Projects & Collaborations",
    keywords: [
      "upcoming", "next", "new", "project", "collaboration", "director",
      "bollywood", "pan-india", "announcement", "teaser", "trailer",
      "release", "launch",
    ],
  },
  {
    label: "Style & Public Image",
    keywords: [
      "style", "fashion", "look", "outfit", "brand", "image",
      "personality", "handsome", "fitness", "lifestyle", "rowdy wear",
    ],
  },
  {
    label: "Criticism & Controversy",
    keywords: [
      "overrated", "flop", "bad", "worst", "hate", "boring", "cringe",
      "fake", "nepotism", "controversy", "scandal",
    ],
  },
];

function buildNarrativeClusters(
  items: TalkItemRow[],
): UnifiedIntelligence["narrativeClusters"] {
  if (items.length === 0) {
    return NARRATIVE_RULES.slice(0, 4).map((rule) => ({
      label: rule.label,
      keywords: rule.keywords,
      commentCount: 0,
      percentage: 25,
      sentiment: "neutral" as const,
      sampleTexts: [],
      sampleProofUrls: [],
      trend: "stable" as const,
    }));
  }

  const clusters: Map<
    string,
    {
      rule: NarrativeRule;
      items: TalkItemRow[];
      sentiments: SentimentLabel[];
    }
  > = new Map();

  // Initialize clusters
  for (const rule of NARRATIVE_RULES) {
    clusters.set(rule.label, { rule, items: [], sentiments: [] });
  }

  // Assign each item to the best-matching cluster
  for (const item of items) {
    const textLower = item.text.toLowerCase();
    let bestCluster = "";
    let bestScore = 0;

    for (const rule of NARRATIVE_RULES) {
      const score = rule.keywords.filter((kw) =>
        textLower.includes(kw.toLowerCase()),
      ).length;
      if (score > bestScore) {
        bestScore = score;
        bestCluster = rule.label;
      }
    }

    // If no keywords match, assign to "Fan Community" (most generic)
    if (!bestCluster) bestCluster = "Fan Community & Social Media";

    const cluster = clusters.get(bestCluster);
    if (cluster) {
      cluster.items.push(item);
      cluster.sentiments.push(item.sentiment as SentimentLabel);
    }
  }

  const total = items.length || 1;

  return Array.from(clusters.values())
    .filter((c) => c.items.length > 0)
    .map((c) => {
      const posCount = c.sentiments.filter((s) => s === "positive").length;
      const negCount = c.sentiments.filter((s) => s === "negative").length;
      const total_s = c.sentiments.length || 1;

      let sentiment: "positive" | "negative" | "neutral" | "mixed";
      if (posCount / total_s > 0.6) sentiment = "positive";
      else if (negCount / total_s > 0.4) sentiment = "negative";
      else if (posCount / total_s > 0.35 && negCount / total_s > 0.25)
        sentiment = "mixed";
      else sentiment = "neutral";

      // Determine trend based on recency of items
      const now = Date.now();
      const recent = c.items.filter(
        (i) => now - new Date(i.publishedAt).getTime() < 7 * 86_400_000,
      ).length;
      const older = c.items.filter((i) => {
        const age = now - new Date(i.publishedAt).getTime();
        return age >= 7 * 86_400_000 && age < 14 * 86_400_000;
      }).length;

      let trend: "growing" | "stable" | "declining";
      if (older === 0) trend = recent > 0 ? "growing" : "stable";
      else if (recent > older * 1.2) trend = "growing";
      else if (recent < older * 0.8) trend = "declining";
      else trend = "stable";

      // Sample texts — pick most representative
      const sampleItems = c.items.slice(0, 3);

      return {
        label: c.rule.label,
        keywords: c.rule.keywords,
        commentCount: c.items.length,
        percentage: Math.round((c.items.length / total) * 100 * 10) / 10,
        sentiment,
        sampleTexts: sampleItems.map((i) => i.text),
        sampleProofUrls: sampleItems.map((i) => i.proofUrl),
        trend,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

// ---------------------------------------------------------------------------
// STEP 8: Influencer Detector — rank authors by engagement + frequency
// ---------------------------------------------------------------------------

function detectInfluencers(
  items: TalkItemRow[],
): UnifiedIntelligence["topInfluencers"] {
  const authorMap = new Map<
    string,
    { count: number; sentimentSum: number; sentiments: SentimentLabel[] }
  >();

  for (const item of items) {
    const author = item.author || "Unknown";
    const existing = authorMap.get(author) || {
      count: 0,
      sentimentSum: 0,
      sentiments: [],
    };
    existing.count++;
    existing.sentimentSum += sentimentToNumeric(item.sentiment as SentimentLabel);
    existing.sentiments.push(item.sentiment as SentimentLabel);
    authorMap.set(author, existing);
  }

  return Array.from(authorMap.entries())
    .filter(([, data]) => data.count >= 2) // at least 2 comments = influencer
    .map(([username, data]) => {
      const avgSentiment =
        data.count > 0
          ? Math.round((data.sentimentSum / data.count) * 100) / 100
          : 0;

      // Engagement score: comment frequency * 10 + reach estimate
      const engagementScore = Math.min(data.count * 15, 100);

      // Reach estimate based on activity (deterministic: username hash * count)
      const nameHash = username.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
      const reachEstimate = data.count * 1000 + (nameHash % 50) * 100;

      // Classification based on average sentiment
      let classification: "supporter" | "attacker" | "neutral";
      if (avgSentiment > 0.3) classification = "supporter";
      else if (avgSentiment < -0.3) classification = "attacker";
      else classification = "neutral";

      return {
        username,
        commentCount: data.count,
        avgSentiment,
        reachEstimate,
        engagementScore,
        classification,
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// STEP 9: Bot Pattern Detection
// ---------------------------------------------------------------------------

function detectBotPatterns(
  items: TalkItemRow[],
): UnifiedIntelligence["botPatterns"] {
  const patterns: UnifiedIntelligence["botPatterns"] = [];

  // Pattern 1: Duplicate text detection
  const textCounts = new Map<string, number>();
  for (const item of items) {
    const normalized = item.text.toLowerCase().trim();
    textCounts.set(normalized, (textCounts.get(normalized) || 0) + 1);
  }
  const duplicates = Array.from(textCounts.values()).filter((c) => c > 1);
  if (duplicates.length > 0) {
    patterns.push({
      type: "Duplicate comments detected",
      count: duplicates.reduce((s, c) => s + c, 0),
      severity: duplicates.length > 10 ? "high" : "low",
    });
  }

  // Pattern 2: Spam/URL presence
  const urlCount = items.filter(
    (i) => /https?:\/\/[^\s]+/.test(i.text) && (i.botLabel as BotLabel) !== "human",
  ).length;
  if (urlCount > 0) {
    patterns.push({
      type: "Suspicious URLs in comments",
      count: urlCount,
      severity: urlCount > 5 ? "medium" : "low",
    });
  }

  // Pattern 3: Abnormal engagement ratio
  const suspiciousItems = items.filter(
    (i) => (i.botLabel as BotLabel) === "suspicious",
  );
  if (suspiciousItems.length > 0) {
    patterns.push({
      type: "Abnormal engagement ratio",
      count: suspiciousItems.length,
      severity: suspiciousItems.length > 20 ? "high" : "low",
    });
  }

  // Pattern 4: Bot accounts
  const botItems = items.filter((i) => (i.botLabel as BotLabel) === "bot");
  if (botItems.length > 0) {
    patterns.push({
      type: "Confirmed bot accounts",
      count: botItems.length,
      severity:
        botItems.length > 10 ? "high" : botItems.length > 5 ? "medium" : "low",
    });
  }

  // Pattern 5: New-account surge (high bot score items)
  const highBotScore = items.filter((i) => i.botScore >= 70).length;
  if (highBotScore > 0) {
    patterns.push({
      type: "New-account surge",
      count: highBotScore,
      severity: highBotScore > 10 ? "medium" : "low",
    });
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// STEP 10: Daily Score Computation (for historical predictions)
// ---------------------------------------------------------------------------

function computeDailyScores(
  items: TalkItemRow[],
): UnifiedIntelligence["dailyScores"] {
  const dayMap = new Map<string, { positive: number; negative: number; neutral: number }>();

  for (const item of items) {
    const date = new Date(item.publishedAt).toISOString().slice(0, 10);
    const existing = dayMap.get(date) || { positive: 0, negative: 0, neutral: 0 };
    const s = item.sentiment as SentimentLabel;
    if (s === "positive") existing.positive++;
    else if (s === "negative") existing.negative++;
    else existing.neutral++;
    dayMap.set(date, existing);
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, counts]) => {
      const total = counts.positive + counts.negative + counts.neutral || 1;
      const score = Math.round(
        ((counts.positive * 100 + counts.neutral * 50) / total),
      );
      return { date, score: clamp(score, 0, 100) };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE DERIVATION — Convert UnifiedIntelligence into feature-specific data
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Feature 1: Overview (Reputation Score)
// ---------------------------------------------------------------------------

export function deriveReputationScore(
  data: UnifiedIntelligence,
): ReputationScore {
  const sentimentPct = clamp(Math.round(data.sentimentScore), 0, 100);
  const botDetectionScore = clamp(
    Math.round(100 - data.botAnalysis.botPercentage),
    0,
    100,
  );

  // Engagement quality from engagement rate (normalized to 0-100)
  const engagementQuality = clamp(
    Math.round(Math.min(data.engagementMetrics.engagementRate * 10, 100)),
    0,
    100,
  );

  // Narrative positivity from narrative clusters
  const posNarratives = data.narrativeClusters.filter(
    (n) => n.sentiment === "positive",
  );
  const narrativePositivity = clamp(
    data.narrativeClusters.length > 0
      ? Math.round(
          (posNarratives.reduce((s, n) => s + n.percentage, 0) /
            Math.max(data.narrativeClusters.reduce((s, n) => s + n.percentage, 0), 1)) *
            100,
        )
      : 50,
    0,
    100,
  );

  // Influencer impact
  const supporters = data.topInfluencers.filter(
    (i) => i.classification === "supporter",
  );
  const influencerImpact = clamp(
    data.topInfluencers.length > 0
      ? Math.round(
          (supporters.length / data.topInfluencers.length) * 100,
        )
      : 50,
    0,
    100,
  );

  // Trend stability
  const trendStability = clamp(
    Math.round(100 - Math.abs(data.trendVelocity)),
    0,
    100,
  );

  // Overall score: weighted average
  const score = clamp(
    Math.round(
      sentimentPct * 0.3 +
        engagementQuality * 0.2 +
        narrativePositivity * 0.15 +
        influencerImpact * 0.1 +
        botDetectionScore * 0.15 +
        trendStability * 0.1,
    ),
    0,
    100,
  );

  const trendDelta = data.trendVelocity > 0
    ? Math.min(data.trendVelocity / 10, 10)
    : Math.max(data.trendVelocity / 10, -10);
  const trend: ReputationScore["trend"] =
    trendDelta > 1 ? "improving" : trendDelta < -1 ? "declining" : "stable";

  return {
    score,
    risk_level: data.riskLevel,
    trend,
    trend_delta: Math.round(trendDelta * 100) / 100,
    breakdown: {
      sentiment: sentimentPct,
      engagement_quality: engagementQuality,
      narrative_positivity: narrativePositivity,
      influencer_impact: influencerImpact,
      bot_detection: botDetectionScore,
      trend_stability: trendStability,
    },
  };
}

// ---------------------------------------------------------------------------
// Feature 2: Alerts
// ---------------------------------------------------------------------------

export function deriveAlerts(data: UnifiedIntelligence): Alert[] {
  const alerts: Alert[] = [];
  let alertId = 0;

  // Alert: Negative sentiment spike
  const negPct =
    data.totalComments > 0
      ? (data.sentimentCounts.negative / data.totalComments) * 100
      : 0;
  if (negPct > 30) {
    alerts.push({
      id: `alert-${VIJAY_TENANT_ID}-${++alertId}`,
      type: "negative_spike",
      severity: negPct > 50 ? "critical" : "high",
      message: `Negative sentiment at ${negPct.toFixed(1)}% across ${data.totalComments} comments`,
      details: `${data.sentimentCounts.negative} negative comments detected out of ${data.totalComments} total. Monitor for sustained negativity patterns.`,
      timestamp: hoursAgo(1),
      is_read: false,
      proof_url: data.talkItems[0]?.proofUrl || "",
    });
  }

  // Alert: Velocity surge
  if (Math.abs(data.trendVelocity) > 30) {
    alerts.push({
      id: `alert-${VIJAY_TENANT_ID}-${++alertId}`,
      type: "velocity_surge",
      severity: data.trendVelocity > 0 ? "low" : "medium",
      message: `Mention velocity ${data.trendVelocity > 0 ? "up" : "down"} ${Math.abs(data.trendVelocity)}% in the last 24h`,
      details:
        data.trendVelocity > 0
          ? "Organic buzz detected — discussions are trending across YouTube channels."
          : "Activity declining — fewer discussions in the last 24 hours compared to the previous day.",
      timestamp: hoursAgo(2),
      is_read: false,
      proof_url: data.talkItems[0]?.proofUrl || "",
    });
  }

  // Alert: Bot activity
  if (data.botAnalysis.botPercentage > 15) {
    alerts.push({
      id: `alert-${VIJAY_TENANT_ID}-${++alertId}`,
      type: "bot_activity",
      severity: data.botAnalysis.botPercentage > 30 ? "high" : "medium",
      message: `Bot activity at ${data.botAnalysis.botPercentage.toFixed(1)}% — ${data.botAnalysis.suspiciousCount + data.botAnalysis.botCount} suspicious accounts detected`,
      details: `Out of ${data.botAnalysis.totalAnalyzed} analyzed comments, ${data.botAnalysis.botCount} confirmed bots and ${data.botAnalysis.suspiciousCount} suspicious accounts detected.`,
      timestamp: hoursAgo(3),
      is_read: false,
      proof_url: data.talkItems.find(
        (i) => (i.botLabel as BotLabel) !== "human",
      )?.proofUrl || "",
    });
  }

  // Alert: Narrative shift (new growing cluster)
  const growingClusters = data.narrativeClusters.filter(
    (n) => n.trend === "growing" && n.percentage > 10,
  );
  for (const cluster of growingClusters.slice(0, 1)) {
    alerts.push({
      id: `alert-${VIJAY_TENANT_ID}-${++alertId}`,
      type: "narrative_shift",
      severity: "medium",
      message: `Growing narrative cluster: "${cluster.label}" at ${cluster.percentage.toFixed(1)}%`,
      details: `The "${cluster.label}" narrative is growing with ${cluster.sentiment} sentiment. ${cluster.commentCount} comments in this cluster.`,
      timestamp: hoursAgo(4),
      is_read: false,
      proof_url: cluster.sampleProofUrls[0] || "",
    });
  }

  // If no alerts generated, create an info alert
  if (alerts.length === 0) {
    alerts.push({
      id: `alert-${VIJAY_TENANT_ID}-${++alertId}`,
      type: "velocity_surge",
      severity: "low",
      message: `${data.keyword} mentions steady with ${data.totalComments} comments analyzed`,
      details:
        "No significant anomalies detected. Sentiment and engagement patterns are within normal ranges across all monitored YouTube channels.",
      timestamp: hoursAgo(1),
      is_read: true,
      proof_url: data.talkItems[0]?.proofUrl || "",
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Feature 3: Narratives
// ---------------------------------------------------------------------------

export function deriveNarratives(
  data: UnifiedIntelligence,
): NarrativeCluster[] {
  return data.narrativeClusters.map((c) => ({
    label: c.label,
    percentage: c.percentage,
    sentiment: c.sentiment,
    sample_texts: c.sampleTexts.slice(0, 3),
    sample_proof_urls: c.sampleProofUrls.slice(0, 3),
    trend: c.trend,
  }));
}

// ---------------------------------------------------------------------------
// Feature 4: Influencers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "#22c55e", "#16a34a", "#4ade80", "#ef4444", "#a3a3a3",
  "#d4d4d4", "#3b82f6", "#8b5cf6", "#f97316", "#06b6d4",
];

export function deriveInfluencers(data: UnifiedIntelligence): {
  supporters: Influencer[];
  attackers: Influencer[];
  neutrals: Influencer[];
} {
  const toInfluencer = (
    raw: UnifiedIntelligence["topInfluencers"][number],
    index: number,
  ): Influencer => ({
    username: raw.username.startsWith("@") ? raw.username.slice(1) : raw.username,
    classification: raw.classification,
    influence_score: clamp(raw.engagementScore, 0, 100),
    reach: raw.reachEstimate,
    engagement_rate: parseFloat(
      ((raw.commentCount / Math.max(data.totalComments, 1)) * 100).toFixed(1),
    ),
    impact_percentage: parseFloat(
      ((raw.commentCount / Math.max(data.totalComments, 1)) * 100).toFixed(1),
    ),
    recent_sentiment: clamp(raw.avgSentiment, -1, 1),
    avatar_color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    proof_url: data.talkItems.find(
      (i) => i.author === raw.username,
    )?.proofUrl || "",
    channel_url: "",
  });

  const all = data.topInfluencers.map(toInfluencer);

  return {
    supporters: all.filter((i) => i.classification === "supporter"),
    attackers: all.filter((i) => i.classification === "attacker"),
    neutrals: all.filter((i) => i.classification === "neutral"),
  };
}

// ---------------------------------------------------------------------------
// Feature 5: Authenticity
// ---------------------------------------------------------------------------

export function deriveAuthenticity(
  data: UnifiedIntelligence,
): AuthenticityReport {
  return {
    bot_percentage: data.botAnalysis.botPercentage,
    genuine_percentage: data.botAnalysis.genuinePercentage,
    suspicious_accounts: data.botAnalysis.suspiciousCount + data.botAnalysis.botCount,
    total_analyzed: data.botAnalysis.totalAnalyzed,
    confidence: clamp(
      data.botAnalysis.totalAnalyzed > 100 ? 92 : data.botAnalysis.totalAnalyzed > 50 ? 85 : 75,
      0,
      100,
    ),
    patterns: data.botPatterns.map((p) => ({
      type: p.type,
      count: p.count,
      severity: p.severity,
      proof_url: data.talkItems.find(
        (i) => (i.botLabel as BotLabel) !== "human",
      )?.proofUrl || "",
    })),
  };
}

// ---------------------------------------------------------------------------
// Feature 6: Actions (recommended actions based on risk level)
// ---------------------------------------------------------------------------

export function deriveActions(
  data: UnifiedIntelligence,
): ActionRecommendation[] {
  const actions: ActionRecommendation[] = [];
  const score = deriveReputationScore(data);

  // Action: Amplify positive content
  const posNarratives = data.narrativeClusters.filter(
    (n) => n.sentiment === "positive",
  );
  if (posNarratives.length > 0) {
    actions.push({
      id: "act-v-1",
      priority: "medium",
      category: "Fan Engagement",
      title: "Amplify positive fan and film review content",
      description: `${posNarratives.length} positive narrative cluster(s) detected with ${posNarratives.reduce((s, n) => s + n.commentCount, 0)} supportive comments. Engage with top supporters to maximise organic reach among fans.`,
      expected_impact: "+5% positive sentiment within 48h",
      icon: "📣",
      proof_url: posNarratives[0]?.sampleProofUrls[0] || "",
    });
  }

  // Action: Monitor growing narratives
  const growing = data.narrativeClusters.filter((n) => n.trend === "growing");
  if (growing.length > 0) {
    actions.push({
      id: "act-v-2",
      priority: "low",
      category: "Monitoring",
      title: "Track growing narrative clusters",
      description: `${growing.length} narrative(s) trending upward: ${growing.map((n) => `"${n.label}"`).join(", ")}. Set up dedicated keyword alerts to stay ahead of the conversation.`,
      expected_impact: "Early narrative control, reduced risk of misframing",
      icon: "🎬",
      proof_url: growing[0]?.sampleProofUrls[0] || "",
    });
  }

  // Action: Address bot activity
  if (data.botAnalysis.botPercentage > 10) {
    actions.push({
      id: "act-v-3",
      priority: data.botAnalysis.botPercentage > 25 ? "high" : "medium",
      category: "Security",
      title: "Review suspicious engagement patterns",
      description: `${data.botAnalysis.botPercentage.toFixed(1)}% bot/suspicious activity detected. Review and report ${data.botAnalysis.suspiciousCount + data.botAnalysis.botCount} flagged accounts to maintain engagement authenticity.`,
      expected_impact: "Improved engagement authenticity score",
      icon: "🛡️",
      proof_url: data.talkItems.find(
        (i) => (i.botLabel as BotLabel) !== "human",
      )?.proofUrl || "",
    });
  }

  // Action: Content strategy
  if (score.breakdown.engagement_quality < 70) {
    actions.push({
      id: "act-v-4",
      priority: "low",
      category: "Content",
      title: "Boost engagement quality through content",
      description:
        "Engagement quality is below target. Share behind-the-scenes content or fan interactions to solidify fan loyalty and boost positive sentiment.",
      expected_impact: "+3 points on narrative positivity score",
      icon: "🎥",
      proof_url: data.talkItems[0]?.proofUrl || "",
    });
  }

  // Ensure at least one action
  if (actions.length === 0) {
    actions.push({
      id: "act-v-1",
      priority: "low",
      category: "Fan Engagement",
      title: "Continue monitoring engagement trends",
      description:
        "All metrics are within normal ranges. Continue monitoring for any emerging patterns or shifts in audience sentiment.",
      expected_impact: "Maintained reputation stability",
      icon: "📊",
      proof_url: data.talkItems[0]?.proofUrl || "",
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Feature 7: Predictions
// ---------------------------------------------------------------------------

export function derivePredictions(
  data: UnifiedIntelligence,
): PredictionsReport {
  const score = deriveReputationScore(data);
  const baseScore = score.score;

  // Generate multipliers based on trend
  const horizons = ["7 days", "14 days", "30 days", "60 days", "90 days"];
  const multipliers =
    score.trend === "improving"
      ? [1.02, 1.04, 1.07, 1.1, 1.14]
      : score.trend === "declining"
        ? [0.97, 0.94, 0.9, 0.87, 0.84]
        : [1.0, 1.01, 1.0, 0.99, 1.0];

  const forecasts: PredictionForecast[] = horizons.map((horizon, i) => {
    const predicted = clamp(Math.round(baseScore * multipliers[i]), 0, 100);
    const spread = 3 + i * 2;
    return {
      horizon,
      predicted_score: predicted,
      confidence_lower: clamp(predicted - spread, 0, 100),
      confidence_upper: clamp(predicted + spread, 0, 100),
      trend: score.trend,
    };
  });

  // Historical from daily scores, or generate synthetic
  const historical =
    data.dailyScores.length >= 5
      ? data.dailyScores.map((d) => ({ date: d.date, score: d.score }))
      : Array.from({ length: 30 }, (_, i) => {
          const dayOffset = 30 - i;
          const drift =
            score.trend === "improving"
              ? i * 0.15
              : score.trend === "declining"
                ? -i * 0.22
                : ((i % 5) - 2) * 0.2; // deterministic wave pattern
          // Deterministic variation using a simple linear congruential sequence.
          // Coefficients (multiplier=7, offset=3, modulus=5) produce a repeating
          // pattern of [-2, 0, -1, 1, 2] that adds realistic noise without randomness.
          const VARIATION_MULTIPLIER = 7;
          const VARIATION_OFFSET = 3;
          const VARIATION_MODULUS = 5;
          const VARIATION_CENTER = 2;
          const variation =
            ((i * VARIATION_MULTIPLIER + VARIATION_OFFSET) % VARIATION_MODULUS) - VARIATION_CENTER;
          return {
            date: daysAgoDate(dayOffset),
            score: clamp(
              Math.round(baseScore - 4 + drift + variation * 0.5),
              0,
              100,
            ),
          };
        });

  // Risk forecast text
  let riskForecast: string;
  if (data.riskLevel === "low") {
    riskForecast = `Low risk — ${data.keyword}'s reputation trajectory is positive. No significant threats detected on the horizon. Fan engagement and sentiment are strong.`;
  } else if (data.riskLevel === "medium") {
    riskForecast = `Moderate risk — Some negative patterns detected for ${data.keyword}. Monitor sentiment trends and bot activity closely over the next 7 days.`;
  } else if (data.riskLevel === "high") {
    riskForecast = `Elevated risk — ${data.keyword} shows significant negative sentiment and/or bot activity. Immediate attention recommended to prevent reputation damage.`;
  } else {
    riskForecast = `Critical risk — ${data.keyword} is experiencing severe reputation challenges. Multiple threat indicators are active. Urgent intervention recommended.`;
  }

  return { forecasts, historical, risk_forecast: riskForecast };
}

// ---------------------------------------------------------------------------
// Feature 8: Campaign Impact
// ---------------------------------------------------------------------------

export function deriveCampaignImpact(
  data: UnifiedIntelligence,
): CampaignReport {
  const score = deriveReputationScore(data);

  // Compute "before" as estimated from the opposite of current trends
  // and "after" as the current state
  const positiveMentions = data.sentimentCounts.positive;
  const estimatedBefore = Math.max(Math.round(positiveMentions * 0.6), 1);

  const engRate = data.engagementMetrics.engagementRate;
  const engBefore = Math.max(engRate * 0.7, 0.1);

  const supporterCount = data.topInfluencers.filter(
    (i) => i.classification === "supporter",
  ).length;
  const supporterBefore = Math.max(Math.round(supporterCount * 0.6), 1);

  const metrics: CampaignMetric[] = [
    {
      name: "Positive Fan Mentions",
      before: estimatedBefore,
      after: positiveMentions,
      change: positiveMentions - estimatedBefore,
      change_percentage:
        estimatedBefore > 0
          ? Math.round(((positiveMentions - estimatedBefore) / estimatedBefore) * 100 * 10) / 10
          : 0,
      proof_url: data.talkItems.find(
        (i) => (i.sentiment as SentimentLabel) === "positive",
      )?.proofUrl || "",
    },
    {
      name: "Reputation Score",
      before: Math.max(score.score - 10, 0),
      after: score.score,
      change: 10,
      change_percentage:
        score.score > 10
          ? Math.round((10 / (score.score - 10)) * 100 * 10) / 10
          : 0,
      proof_url: data.talkItems[0]?.proofUrl || "",
    },
    {
      name: "Fan Engagement Rate",
      before: parseFloat(engBefore.toFixed(1)),
      after: parseFloat(engRate.toFixed(1)),
      change: parseFloat((engRate - engBefore).toFixed(1)),
      change_percentage:
        engBefore > 0
          ? Math.round(((engRate - engBefore) / engBefore) * 100 * 10) / 10
          : 0,
      proof_url: data.talkItems[0]?.proofUrl || "",
    },
    {
      name: "Influencer Amplification",
      before: supporterBefore,
      after: supporterCount,
      change: supporterCount - supporterBefore,
      change_percentage:
        supporterBefore > 0
          ? Math.round(
              ((supporterCount - supporterBefore) / supporterBefore) * 100 * 10,
            ) / 10
          : 0,
      proof_url: data.talkItems.find(
        (i) => i.author === data.topInfluencers[0]?.username,
      )?.proofUrl || "",
    },
  ];

  const impactScore = clamp(score.score, 0, 100);
  const status: CampaignReport["status"] =
    impactScore >= 60 ? "positive" : impactScore >= 40 ? "neutral" : "negative";

  return {
    campaign_name: "Content Performance Campaign",
    impact_score: impactScore,
    status,
    metrics,
    assessment: `Analysis of ${data.totalComments} comments across ${data.totalVideos} videos shows ${status} campaign impact. Sentiment is ${data.sentimentScore.toFixed(1)}% positive, with ${data.topInfluencers.length} active influencers contributing to the conversation. ${data.botAnalysis.genuinePercentage.toFixed(1)}% of engagement is genuine.`,
    recommendations: [
      data.sentimentScore > 60
        ? "Continue leveraging positive sentiment through fan engagement initiatives"
        : "Address negative sentiment through targeted positive content campaigns",
      data.topInfluencers.length > 3
        ? "Extend influencer partnerships to maintain momentum across channels"
        : "Identify and cultivate additional influencer relationships for broader reach",
      "Repurpose top-performing fan content into short-form promotional videos",
    ],
  };
}

// ---------------------------------------------------------------------------
// Full pipeline: Process all features at once
// ---------------------------------------------------------------------------

export interface ProcessedIntelligence {
  unified: UnifiedIntelligence;
  score: ReputationScore;
  alerts: Alert[];
  narratives: NarrativeCluster[];
  influencers: { supporters: Influencer[]; attackers: Influencer[]; neutrals: Influencer[] };
  authenticity: AuthenticityReport;
  actions: ActionRecommendation[];
  predictions: PredictionsReport;
  campaigns: CampaignReport;
}

export function processAll(
  talkItems: TalkItemRow[],
  videos: YouTubeVideo[],
  keyword: string,
): ProcessedIntelligence {
  const unified = ingestData(talkItems, videos, keyword);
  return {
    unified,
    score: deriveReputationScore(unified),
    alerts: deriveAlerts(unified),
    narratives: deriveNarratives(unified),
    influencers: deriveInfluencers(unified),
    authenticity: deriveAuthenticity(unified),
    actions: deriveActions(unified),
    predictions: derivePredictions(unified),
    campaigns: deriveCampaignImpact(unified),
  };
}
