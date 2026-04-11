/**
 * Processing Engine — Unit tests.
 *
 * Tests the core intelligence layer that transforms Talk + Feed data
 * into derived intelligence for all dashboard features.
 */

import { describe, it, expect } from "vitest";
import {
  ingestData,
  deriveReputationScore,
  deriveAlerts,
  deriveNarratives,
  deriveInfluencers,
  deriveAuthenticity,
  deriveActions,
  derivePredictions,
  deriveCampaignImpact,
  processAll,
  type UnifiedIntelligence,
} from "@/lib/processingEngine";
import type { TalkItemRow } from "@/lib/db/talkCache";
import type { YouTubeVideo } from "@/pages/api/youtube";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeTalkItem(overrides: Partial<TalkItemRow> = {}): TalkItemRow {
  return {
    commentId: `comment-${Math.random().toString(36).slice(2)}`,
    videoId: "video-1",
    text: "This is a great film by Vijay Deverakonda",
    author: "TestUser",
    publishedAt: new Date().toISOString(),
    videoTitle: "Vijay Deverakonda Movie Review",
    channelTitle: "Telugu Cinema Reviews",
    sentiment: "positive",
    proofUrl: "https://www.youtube.com/watch?v=abc123&lc=xyz",
    keyword: "Vijay Deverakonda",
    fetchedAt: new Date().toISOString(),
    botScore: 10,
    botLabel: "human",
    botReasons: "[]",
    ...overrides,
  };
}

function makeVideo(overrides: Partial<YouTubeVideo> = {}): YouTubeVideo {
  return {
    id: `video-${Math.random().toString(36).slice(2)}`,
    title: "Vijay Deverakonda Latest Movie",
    channelTitle: "Telugu Cinema Reviews",
    publishedAt: new Date().toISOString(),
    thumbnailUrl: "https://example.com/thumb.jpg",
    description: "Movie review",
    proofUrl: "https://www.youtube.com/watch?v=abc123",
    viewCount: 100000,
    likeCount: 5000,
    commentCount: 500,
    ...overrides,
  };
}

function makeSampleData(): { items: TalkItemRow[]; videos: YouTubeVideo[] } {
  const items: TalkItemRow[] = [
    makeTalkItem({ sentiment: "positive", text: "Amazing film performance by VD", author: "Fan1" }),
    makeTalkItem({ sentiment: "positive", text: "Love this actor so much, best fan forever", author: "Fan1" }),
    makeTalkItem({ sentiment: "positive", text: "Great upcoming project announcement", author: "Fan2" }),
    makeTalkItem({ sentiment: "neutral", text: "Interesting style and fashion sense", author: "Fan3" }),
    makeTalkItem({ sentiment: "negative", text: "This movie was boring and overrated", author: "Critic1" }),
    makeTalkItem({ sentiment: "neutral", text: "Average performance, nothing special", author: "Fan4" }),
    makeTalkItem({ sentiment: "positive", text: "Rowdy brand is amazing, love the loyalty", author: "Fan5" }),
    makeTalkItem({ sentiment: "negative", text: "Worst movie ever, totally fake acting", author: "Troll1", botScore: 85, botLabel: "bot", botReasons: '["spam"]' }),
    makeTalkItem({ sentiment: "positive", text: "The new teaser trailer looks incredible", author: "Fan6" }),
    makeTalkItem({ sentiment: "neutral", text: "Waiting for the next release", author: "Fan7" }),
  ];
  const videos: YouTubeVideo[] = [
    makeVideo({ channelTitle: "Telugu Cinema Reviews", viewCount: 200000, likeCount: 10000 }),
    makeVideo({ channelTitle: "Tollywood Daily", viewCount: 150000, likeCount: 7500 }),
  ];
  return { items, videos };
}

// ---------------------------------------------------------------------------
// Data Ingestion tests
// ---------------------------------------------------------------------------

describe("Data Ingestion (ingestData)", () => {
  it("normalizes talk + feed data into unified format", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "Vijay Deverakonda");

    expect(result.keyword).toBe("Vijay Deverakonda");
    expect(result.totalComments).toBe(10);
    expect(result.totalVideos).toBe(2);
    expect(result.processedAt).toBeTruthy();
  });

  it("correctly counts sentiments", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(result.sentimentCounts.positive).toBe(5);
    expect(result.sentimentCounts.negative).toBe(2);
    expect(result.sentimentCounts.neutral).toBe(3);
  });

  it("computes sentiment score (0-100)", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(result.sentimentScore).toBeGreaterThanOrEqual(0);
    expect(result.sentimentScore).toBeLessThanOrEqual(100);
    // 5 positive * 100 + 3 neutral * 50 + 2 negative * 0 = 650 / 10 = 65
    expect(result.sentimentScore).toBe(65);
  });

  it("computes engagement metrics from videos", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(result.engagementMetrics.totalViews).toBe(350000);
    expect(result.engagementMetrics.totalLikes).toBe(17500);
    expect(result.engagementMetrics.engagementRate).toBeGreaterThan(0);
  });

  it("analyzes bot activity", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(result.botAnalysis.totalAnalyzed).toBe(10);
    expect(result.botAnalysis.botCount).toBe(1); // One bot item
    expect(result.botAnalysis.botPercentage).toBeGreaterThan(0);
    expect(result.botAnalysis.genuinePercentage).toBeGreaterThan(0);
    expect(result.botAnalysis.botPercentage + result.botAnalysis.genuinePercentage).toBeCloseTo(100, 0);
  });

  it("handles empty data gracefully", () => {
    const result = ingestData([], [], "test");

    expect(result.totalComments).toBe(0);
    expect(result.totalVideos).toBe(0);
    expect(result.sentimentScore).toBe(50); // default neutral
    expect(result.riskLevel).toBeDefined();
    expect(result.narrativeClusters).toBeDefined();
  });

  it("builds narrative clusters from comment text", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(result.narrativeClusters.length).toBeGreaterThan(0);
    for (const cluster of result.narrativeClusters) {
      expect(cluster.label).toBeTruthy();
      expect(cluster.percentage).toBeGreaterThanOrEqual(0);
      expect(["positive", "negative", "neutral", "mixed"]).toContain(cluster.sentiment);
      expect(["growing", "stable", "declining"]).toContain(cluster.trend);
    }
  });

  it("detects influencers from comment authors", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    // Fan1 has 2 comments, so should be detected as influencer
    expect(result.topInfluencers.length).toBeGreaterThan(0);
    const fan1 = result.topInfluencers.find((i) => i.username === "Fan1");
    expect(fan1).toBeDefined();
    expect(fan1!.commentCount).toBe(2);
    expect(fan1!.classification).toBe("supporter"); // positive sentiment
  });

  it("detects bot patterns", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    // Should detect at least bot-related patterns
    expect(result.botPatterns).toBeDefined();
    expect(Array.isArray(result.botPatterns)).toBe(true);
  });

  it("assigns risk level based on composite factors", () => {
    const { items, videos } = makeSampleData();
    const result = ingestData(items, videos, "test");

    expect(["low", "medium", "high", "critical"]).toContain(result.riskLevel);
  });
});

// ---------------------------------------------------------------------------
// Feature derivation tests
// ---------------------------------------------------------------------------

describe("Reputation Score derivation", () => {
  it("derives a valid score from unified data", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const score = deriveReputationScore(unified);

    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high", "critical"]).toContain(score.risk_level);
    expect(["improving", "stable", "declining"]).toContain(score.trend);
  });

  it("contains valid breakdown values (all 0-100)", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const score = deriveReputationScore(unified);

    for (const val of Object.values(score.breakdown)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

describe("Alerts derivation", () => {
  it("generates at least one alert", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const alerts = deriveAlerts(unified);

    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(alert.id).toBeTruthy();
      expect(alert.message).toBeTruthy();
      expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
    }
  });

  it("generates negative spike alert when sentiment is poor", () => {
    const items = Array.from({ length: 10 }, () =>
      makeTalkItem({ sentiment: "negative" }),
    );
    const unified = ingestData(items, [], "test");
    const alerts = deriveAlerts(unified);

    const spikeAlert = alerts.find((a) => a.type === "negative_spike");
    expect(spikeAlert).toBeDefined();
    expect(["critical", "high"]).toContain(spikeAlert!.severity);
  });
});

describe("Narratives derivation", () => {
  it("derives narrative clusters from unified data", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const narratives = deriveNarratives(unified);

    expect(narratives.length).toBeGreaterThan(0);
    for (const n of narratives) {
      expect(n.label).toBeTruthy();
      expect(n.percentage).toBeGreaterThanOrEqual(0);
      expect(["positive", "negative", "neutral", "mixed"]).toContain(n.sentiment);
      expect(["growing", "stable", "declining"]).toContain(n.trend);
    }
  });
});

describe("Influencers derivation", () => {
  it("classifies influencers into supporters, attackers, neutrals", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const influencers = deriveInfluencers(unified);

    expect(influencers.supporters).toBeDefined();
    expect(influencers.attackers).toBeDefined();
    expect(influencers.neutrals).toBeDefined();
    expect(Array.isArray(influencers.supporters)).toBe(true);
    expect(Array.isArray(influencers.attackers)).toBe(true);
    expect(Array.isArray(influencers.neutrals)).toBe(true);
  });

  it("supporter influencers have valid data", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const influencers = deriveInfluencers(unified);

    for (const inf of influencers.supporters) {
      expect(inf.influence_score).toBeGreaterThanOrEqual(0);
      expect(inf.influence_score).toBeLessThanOrEqual(100);
      expect(inf.classification).toBe("supporter");
    }
  });
});

describe("Authenticity derivation", () => {
  it("derives authenticity report from bot analysis", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const auth = deriveAuthenticity(unified);

    expect(auth.total_analyzed).toBe(10);
    expect(auth.bot_percentage + auth.genuine_percentage).toBeCloseTo(100, 0);
    expect(auth.confidence).toBeGreaterThan(0);
    expect(auth.confidence).toBeLessThanOrEqual(100);
  });
});

describe("Actions derivation", () => {
  it("generates at least one action recommendation", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const actions = deriveActions(unified);

    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action.id).toBeTruthy();
      expect(action.title).toBeTruthy();
      expect(action.description).toBeTruthy();
      expect(["critical", "high", "medium", "low"]).toContain(action.priority);
    }
  });
});

describe("Predictions derivation", () => {
  it("generates forecasts and historical data", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const predictions = derivePredictions(unified);

    expect(predictions.forecasts.length).toBe(5);
    expect(predictions.historical.length).toBeGreaterThan(0);
    expect(predictions.risk_forecast).toBeTruthy();

    for (const f of predictions.forecasts) {
      expect(f.predicted_score).toBeGreaterThanOrEqual(0);
      expect(f.predicted_score).toBeLessThanOrEqual(100);
      expect(f.confidence_lower).toBeLessThanOrEqual(f.predicted_score);
      expect(f.confidence_upper).toBeGreaterThanOrEqual(f.predicted_score);
    }
  });
});

describe("Campaign Impact derivation", () => {
  it("generates campaign report with metrics", () => {
    const { items, videos } = makeSampleData();
    const unified = ingestData(items, videos, "test");
    const campaign = deriveCampaignImpact(unified);

    expect(campaign.campaign_name).toBeTruthy();
    expect(campaign.impact_score).toBeGreaterThanOrEqual(0);
    expect(campaign.impact_score).toBeLessThanOrEqual(100);
    expect(["positive", "negative", "neutral"]).toContain(campaign.status);
    expect(campaign.metrics.length).toBeGreaterThan(0);
    expect(campaign.assessment).toBeTruthy();
    expect(campaign.recommendations.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Full pipeline tests
// ---------------------------------------------------------------------------

describe("processAll — Full pipeline", () => {
  it("processes all features from raw data", () => {
    const { items, videos } = makeSampleData();
    const result = processAll(items, videos, "Vijay Deverakonda");

    expect(result.unified).toBeDefined();
    expect(result.score).toBeDefined();
    expect(result.alerts).toBeDefined();
    expect(result.narratives).toBeDefined();
    expect(result.influencers).toBeDefined();
    expect(result.authenticity).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.predictions).toBeDefined();
    expect(result.campaigns).toBeDefined();
  });

  it("all features derive from the same unified data source", () => {
    const { items, videos } = makeSampleData();
    const result = processAll(items, videos, "test");

    // Verify data consistency: authenticity total should match unified total
    expect(result.authenticity.total_analyzed).toBe(result.unified.totalComments);

    // Verify all influencers come from the same analysis
    const allInfs = [
      ...result.influencers.supporters,
      ...result.influencers.attackers,
      ...result.influencers.neutrals,
    ];
    expect(allInfs.length).toBe(result.unified.topInfluencers.length);
  });

  it("handles empty input gracefully (no crashes)", () => {
    const result = processAll([], [], "empty-test");

    expect(result.score.score).toBeGreaterThanOrEqual(0);
    expect(result.alerts.length).toBeGreaterThan(0); // info alert
    expect(result.predictions.forecasts.length).toBe(5);
    expect(result.campaigns.metrics.length).toBeGreaterThan(0);
  });

  it("sentiment-heavy data produces expected risk levels", () => {
    // All negative comments
    const negItems = Array.from({ length: 20 }, () =>
      makeTalkItem({ sentiment: "negative" }),
    );
    const negResult = processAll(negItems, [], "neg-test");
    // Negative should produce higher risk
    expect(["medium", "high", "critical"]).toContain(negResult.score.risk_level);

    // All positive comments
    const posItems = Array.from({ length: 20 }, () =>
      makeTalkItem({ sentiment: "positive" }),
    );
    const posResult = processAll(posItems, [], "pos-test");
    // Positive should produce lower risk
    expect(posResult.score.risk_level).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// Data consistency tests
// ---------------------------------------------------------------------------

describe("Data-driven consistency", () => {
  it("all features use the same sentiment analysis", () => {
    const { items, videos } = makeSampleData();
    const result = processAll(items, videos, "test");

    // Score sentiment should reflect the actual data
    const expectedSentiment = 65; // (5*100 + 3*50) / 10
    expect(result.score.breakdown.sentiment).toBe(expectedSentiment);
  });

  it("bot analysis is consistent across features", () => {
    const { items, videos } = makeSampleData();
    const result = processAll(items, videos, "test");

    // Authenticity bot_percentage should match unified
    expect(result.authenticity.bot_percentage).toBe(
      result.unified.botAnalysis.botPercentage,
    );
    expect(result.authenticity.genuine_percentage).toBe(
      result.unified.botAnalysis.genuinePercentage,
    );
  });

  it("narrative clusters have percentages that sum to ~100%", () => {
    const items = Array.from({ length: 50 }, (_, i) =>
      makeTalkItem({
        text: i % 2 === 0 ? "Amazing film acting performance" : "Great fan support and love",
        sentiment: "positive",
      }),
    );
    const unified = ingestData(items, [], "test");
    const total = unified.narrativeClusters.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBeGreaterThan(90); // ~100% (rounding errors)
    expect(total).toBeLessThanOrEqual(101);
  });
});
