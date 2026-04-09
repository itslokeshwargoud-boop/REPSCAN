/**
 * REPUTATION OS API client — generates realistic client-side dummy data
 * for all REPUTATION OS modules.
 *
 * Single-tenant: permanently scoped to Vijay Deverakonda.
 * No backend required. Each function returns deterministic data
 * with slight randomisation (±2-3%) so values feel "live" across requests.
 */

import { VIJAY_TENANT_ID } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReputationScore {
  score: number; // 0-100
  risk_level: "low" | "medium" | "high" | "critical";
  trend: "improving" | "stable" | "declining";
  trend_delta: number;
  breakdown: {
    sentiment: number;
    engagement_quality: number;
    narrative_positivity: number;
    influencer_impact: number;
    bot_detection: number;
    trend_stability: number;
  };
}

export interface Alert {
  id: string;
  type:
    | "negative_spike"
    | "velocity_surge"
    | "bot_activity"
    | "narrative_shift"
    | "reputation_drop";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  details: string;
  timestamp: string;
  is_read: boolean;
  proof_url: string;
}

export interface NarrativeCluster {
  label: string;
  percentage: number;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sample_texts: string[];
  sample_proof_urls: string[];
  trend: "growing" | "stable" | "declining";
}

export interface Influencer {
  username: string;
  classification: "supporter" | "neutral" | "attacker";
  influence_score: number;
  reach: number;
  engagement_rate: number;
  impact_percentage: number;
  recent_sentiment: number;
  avatar_color: string;
  proof_url: string;
  channel_url: string;
}

export interface AuthenticityReport {
  bot_percentage: number;
  genuine_percentage: number;
  suspicious_accounts: number;
  total_analyzed: number;
  confidence: number;
  patterns: { type: string; count: number; severity: string; proof_url: string }[];
}

export interface ActionRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  expected_impact: string;
  icon: string; // emoji
  proof_url: string;
}

export interface PredictionForecast {
  horizon: string;
  predicted_score: number;
  confidence_lower: number;
  confidence_upper: number;
  trend: "improving" | "stable" | "declining";
}

export interface PredictionsReport {
  forecasts: PredictionForecast[];
  historical: { date: string; score: number }[];
  risk_forecast: string;
}

export interface CampaignMetric {
  name: string;
  before: number;
  after: number;
  change: number;
  change_percentage: number;
  proof_url: string;
}

export interface CampaignReport {
  campaign_name: string;
  impact_score: number;
  status: "positive" | "negative" | "neutral";
  metrics: CampaignMetric[];
  assessment: string;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Small deterministic jitter so values feel "live" on each request. */
function jitter(base: number, pct = 0.03): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

function jitterInt(base: number, pct = 0.03): number {
  return Math.round(jitter(base, pct));
}

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Generate an ISO timestamp N hours ago. */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

/** Generate an ISO date string N days ago (date only). */
function daysAgoDate(d: number): string {
  const dt = new Date(Date.now() - d * 86_400_000);
  return dt.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Tenant profiles
// ---------------------------------------------------------------------------

interface TenantProfile {
  baseScore: number;
  riskLevel: ReputationScore["risk_level"];
  trend: ReputationScore["trend"];
  trendDelta: number;
  sentiment: number;
  engagementQuality: number;
  narrativePositivity: number;
  influencerImpact: number;
  botDetection: number;
  trendStability: number;
  botPct: number;
}

const PROFILES: Record<string, TenantProfile> = {
  [VIJAY_TENANT_ID]: {
    baseScore: 78,
    riskLevel: "low",
    trend: "improving",
    trendDelta: 4.2,
    sentiment: 82,
    engagementQuality: 76,
    narrativePositivity: 80,
    influencerImpact: 74,
    botDetection: 92,
    trendStability: 77,
    botPct: 8,
  },
};

function profile(): TenantProfile {
  return PROFILES[VIJAY_TENANT_ID];
}

// ---------------------------------------------------------------------------
// Module 1 — Reputation Score
// ---------------------------------------------------------------------------

export async function fetchReputationScore(): Promise<ReputationScore> {
  const p = profile();
  return {
    score: clamp(jitterInt(p.baseScore, 0.02), 0, 100),
    risk_level: p.riskLevel,
    trend: p.trend,
    trend_delta: jitter(p.trendDelta, 0.02),
    breakdown: {
      sentiment: clamp(jitterInt(p.sentiment, 0.02), 0, 100),
      engagement_quality: clamp(jitterInt(p.engagementQuality, 0.02), 0, 100),
      narrative_positivity: clamp(
        jitterInt(p.narrativePositivity, 0.02),
        0,
        100,
      ),
      influencer_impact: clamp(jitterInt(p.influencerImpact, 0.02), 0, 100),
      bot_detection: clamp(jitterInt(p.botDetection, 0.02), 0, 100),
      trend_stability: clamp(jitterInt(p.trendStability, 0.02), 0, 100),
    },
  };
}

// ---------------------------------------------------------------------------
// Module 2 — Alerts
// ---------------------------------------------------------------------------

const ALERT_TEMPLATES: Omit<Alert, "id" | "timestamp" | "is_read">[] = [
  {
    type: "velocity_surge",
    severity: "low",
    message: "Vijay Deverakonda mentions up 15% in the last hour",
    details:
      "Organic buzz detected — his latest film teaser is trending on YouTube and Twitter in Telugu-speaking regions.",
    proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxV4h9kT2bE1aZ0Jp4AaABAg",
  },
  {
    type: "narrative_shift",
    severity: "medium",
    message: "New narrative cluster around Vijay Deverakonda's next film",
    details:
      "3 entertainment influencers started discussing his upcoming pan-India project. Sentiment is 78% positive.",
    proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxN3pQ8rT5vW2mDZh4AaABAg",
  },
];

export async function fetchAlerts(): Promise<Alert[]> {
  return ALERT_TEMPLATES.map((t, i) => ({
    ...t,
    id: `alert-${VIJAY_TENANT_ID}-${i + 1}`,
    timestamp: hoursAgo(i * 2 + 1),
    is_read: i > 1,
  }));
}

// ---------------------------------------------------------------------------
// Module 3 — Narratives
// ---------------------------------------------------------------------------

const NARRATIVE_CLUSTERS: NarrativeCluster[] = [
  {
    label: "Acting & Film Performances",
    percentage: 38,
    sentiment: "positive",
    sample_texts: [
      "Vijay Deverakonda was phenomenal in his latest film — raw emotion and powerful screen presence",
      "Nobody in Telugu cinema does intense roles like Vijay Deverakonda right now",
      "His range from Arjun Reddy to family entertainer roles is incredible",
    ],
    sample_proof_urls: [
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxV1aK2bT3eR6nR5p4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxW2bL3cU4fR5oS6r4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxX3cM4dV5gS6pT7r4AaABAg",
    ],
    trend: "growing",
  },
  {
    label: "Fan Community & Social Media",
    percentage: 27,
    sentiment: "positive",
    sample_texts: [
      "Vijay Deverakonda's Instagram live had over 500k viewers — the fan base is massive",
      "The Rowdy brand merchandise sold out in minutes, fans are super loyal",
      "His interactions with fans at events are so genuine and down-to-earth",
    ],
    sample_proof_urls: [
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxY4dN5eW6hT7qU8s4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxZ5eO6fX7iU8rV9t4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxa6fP7gY8jV9sW0u4AaABAg",
    ],
    trend: "stable",
  },
  {
    label: "Upcoming Projects & Collaborations",
    percentage: 20,
    sentiment: "mixed",
    sample_texts: [
      "Excited about Vijay Deverakonda's next film with the new director",
      "Hope his Bollywood projects live up to the Telugu originals",
      "The pan-India strategy is risky but could pay off big time",
    ],
    sample_proof_urls: [
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxb7gQ8hZ9kW0tX1v4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxc8hR9ia0lX1uY2w4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxd9iS0jb1mY2vZ3x4AaABAg",
    ],
    trend: "stable",
  },
  {
    label: "Style & Public Image",
    percentage: 15,
    sentiment: "positive",
    sample_texts: [
      "Vijay Deverakonda's fashion sense is setting trends across South India",
      "His Rowdy brand is becoming a lifestyle statement for young fans",
      "Always keeps it real — no pretence, just authenticity",
    ],
    sample_proof_urls: [
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxe0jT1kc2nZ3wA4y4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxf1kU2ld3oA4xB5z4AaABAg",
      "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=Ugxg2lV3me4pB5yC6a4AaABAg",
    ],
    trend: "growing",
  },
];

export async function fetchNarratives(): Promise<NarrativeCluster[]> {
  return NARRATIVE_CLUSTERS.map((c) => ({
    ...c,
    percentage: clamp(jitterInt(c.percentage, 0.03), 1, 100),
  }));
}

// ---------------------------------------------------------------------------
// Module 4 — Influencers
// ---------------------------------------------------------------------------

interface InfluencerSet {
  supporters: Influencer[];
  attackers: Influencer[];
  neutrals: Influencer[];
}

const INFLUENCER_DATA: InfluencerSet = {
  supporters: [
    {
      username: "@tollywood_reviews",
      classification: "supporter",
      influence_score: 92,
      reach: 245_000,
      engagement_rate: 4.8,
      impact_percentage: 18,
      recent_sentiment: 0.89,
      avatar_color: "#22c55e",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxTR1aB2cD3eF4gH4AaABAg",
      channel_url: "https://www.youtube.com/@TollywoodReviews",
    },
    {
      username: "@telugu_cinema_daily",
      classification: "supporter",
      influence_score: 85,
      reach: 182_000,
      engagement_rate: 3.9,
      impact_percentage: 14,
      recent_sentiment: 0.82,
      avatar_color: "#16a34a",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxTC2bC3dE4fG5hI4AaABAg",
      channel_url: "https://www.youtube.com/@TeluguCinemaDaily",
    },
    {
      username: "@rowdy_fanclub",
      classification: "supporter",
      influence_score: 78,
      reach: 97_000,
      engagement_rate: 5.1,
      impact_percentage: 11,
      recent_sentiment: 0.76,
      avatar_color: "#4ade80",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxRF3cD4eF5gH6iJ4AaABAg",
      channel_url: "https://www.youtube.com/@RowdyFanClub",
    },
  ],
  attackers: [
    {
      username: "@film_critic_honest",
      classification: "attacker",
      influence_score: 61,
      reach: 53_000,
      engagement_rate: 6.2,
      impact_percentage: 7,
      recent_sentiment: -0.42,
      avatar_color: "#ef4444",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxFC4dE5fG6hI7jK4AaABAg",
      channel_url: "https://www.youtube.com/@FilmCriticHonest",
    },
  ],
  neutrals: [
    {
      username: "@entertainment_news_india",
      classification: "neutral",
      influence_score: 74,
      reach: 128_000,
      engagement_rate: 2.7,
      impact_percentage: 9,
      recent_sentiment: 0.05,
      avatar_color: "#a3a3a3",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxEN5eF6gH7iJ8kL4AaABAg",
      channel_url: "https://www.youtube.com/@EntertainmentNewsIndia",
    },
    {
      username: "@south_film_tracker",
      classification: "neutral",
      influence_score: 68,
      reach: 91_000,
      engagement_rate: 3.1,
      impact_percentage: 6,
      recent_sentiment: 0.12,
      avatar_color: "#d4d4d4",
      proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxSF6fG7hI8jK9lM4AaABAg",
      channel_url: "https://www.youtube.com/@SouthFilmTracker",
    },
  ],
};

export async function fetchInfluencers(): Promise<InfluencerSet> {
  const applyJitter = (inf: Influencer): Influencer => ({
    ...inf,
    influence_score: clamp(jitterInt(inf.influence_score, 0.02), 0, 100),
    reach: jitterInt(inf.reach, 0.03),
    engagement_rate: jitter(inf.engagement_rate, 0.03),
    impact_percentage: clamp(jitterInt(inf.impact_percentage, 0.02), 0, 100),
    recent_sentiment: clamp(jitter(inf.recent_sentiment, 0.02), -1, 1),
  });

  return {
    supporters: INFLUENCER_DATA.supporters.map(applyJitter),
    attackers: INFLUENCER_DATA.attackers.map(applyJitter),
    neutrals: INFLUENCER_DATA.neutrals.map(applyJitter),
  };
}

// ---------------------------------------------------------------------------
// Module 5 — Authenticity
// ---------------------------------------------------------------------------

export async function fetchAuthenticity(): Promise<AuthenticityReport> {
  const p = profile();
  const totalAnalyzed = jitterInt(2_340, 0.03);
  const botPct = clamp(jitter(p.botPct, 0.03), 0, 100);
  const genuinePct = Math.round((100 - botPct) * 100) / 100;
  const suspicious = Math.round(totalAnalyzed * (botPct / 100));

  const patterns: AuthenticityReport["patterns"] = [
    { type: "Abnormal engagement ratio", count: jitterInt(12), severity: "low", proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxAU5eF6gH7iJ8kL4AaABAg" },
    { type: "New-account surge", count: jitterInt(8), severity: "low", proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxAU6fG7hI8jK9lM4AaABAg" },
  ];

  return {
    bot_percentage: botPct,
    genuine_percentage: genuinePct,
    suspicious_accounts: suspicious,
    total_analyzed: totalAnalyzed,
    confidence: clamp(jitter(88, 0.02), 0, 100),
    patterns,
  };
}

// ---------------------------------------------------------------------------
// Module 6 — Action Recommendations
// ---------------------------------------------------------------------------

const ACTION_RECOMMENDATIONS: ActionRecommendation[] = [
  {
    id: "act-v-1",
    priority: "medium",
    category: "Fan Engagement",
    title: "Amplify positive fan and film review content",
    description:
      "Three high-reach Telugu cinema influencers posted favourable reviews of Vijay Deverakonda this week. Retweet or co-create content to maximise organic reach among fans.",
    expected_impact: "+5% positive sentiment within 48h",
    icon: "📣",
    proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxAC1aB2cD3eF4gH4AaABAg",
  },
  {
    id: "act-v-2",
    priority: "low",
    category: "Monitoring",
    title: "Track upcoming film release narrative",
    description:
      "A new narrative cluster around Vijay Deverakonda's next pan-India project is growing. Set up dedicated keyword alerts to stay ahead of the conversation.",
    expected_impact: "Early narrative control, reduced risk of misframing",
    icon: "🎬",
    proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxAC2bC3dE4fG5hI4AaABAg",
  },
  {
    id: "act-v-3",
    priority: "low",
    category: "Content",
    title: "Share behind-the-scenes content from upcoming film",
    description:
      "Fan community engagement is the second-largest narrative. Exclusive BTS content or Instagram Lives could solidify fan loyalty and boost positive sentiment.",
    expected_impact: "+3 points on narrative positivity score",
    icon: "🎥",
    proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxAC3cD4eF5gH6iJ4AaABAg",
  },
];

export async function fetchActions(): Promise<ActionRecommendation[]> {
  return ACTION_RECOMMENDATIONS;
}

// ---------------------------------------------------------------------------
// Module 9 — Predictions
// ---------------------------------------------------------------------------

export async function fetchPredictions(): Promise<PredictionsReport> {
  const p = profile();

  const horizons = ["7 days", "14 days", "30 days", "60 days", "90 days"];
  const multipliers =
    p.trend === "improving"
      ? [1.02, 1.04, 1.07, 1.1, 1.14]
      : p.trend === "declining"
        ? [0.97, 0.94, 0.90, 0.87, 0.84]
        : [1.0, 1.01, 1.0, 0.99, 1.0];

  const forecasts: PredictionForecast[] = horizons.map((horizon, i) => {
    const predicted = clamp(
      Math.round(p.baseScore * multipliers[i]),
      0,
      100,
    );
    const spread = 3 + i * 2;
    return {
      horizon,
      predicted_score: jitterInt(predicted, 0.01),
      confidence_lower: clamp(predicted - spread, 0, 100),
      confidence_upper: clamp(predicted + spread, 0, 100),
      trend: p.trend,
    };
  });

  const historical = Array.from({ length: 30 }, (_, i) => {
    const dayOffset = 30 - i;
    const drift =
      p.trend === "improving"
        ? i * 0.15
        : p.trend === "declining"
          ? -i * 0.22
          : (Math.random() - 0.5) * 0.8;
    return {
      date: daysAgoDate(dayOffset),
      score: clamp(
        Math.round(p.baseScore - 4 + drift + (Math.random() - 0.5) * 2),
        0,
        100,
      ),
    };
  });

  return {
    forecasts,
    historical,
    risk_forecast:
      "Low risk — Vijay Deverakonda's reputation trajectory is positive. No significant threats detected on the horizon. Film buzz and fan loyalty are strong.",
  };
}

// ---------------------------------------------------------------------------
// Module 10 — Campaign Impact
// ---------------------------------------------------------------------------

export async function fetchCampaignImpact(): Promise<CampaignReport> {
  return {
    campaign_name: "Film Teaser Launch Campaign",
    impact_score: jitterInt(82, 0.02),
    status: "positive",
    metrics: [
      {
        name: "Positive Fan Mentions",
        before: jitterInt(1_240),
        after: jitterInt(2_890),
        change: jitterInt(1_650),
        change_percentage: jitter(133),
        proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxCM1aB2cD3eF4gH4AaABAg",
      },
      {
        name: "Star Power Score",
        before: jitterInt(64),
        after: jitterInt(78),
        change: jitterInt(14),
        change_percentage: jitter(21.9),
        proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxCM2bC3dE4fG5hI4AaABAg",
      },
      {
        name: "Fan Engagement Rate",
        before: jitter(3.2),
        after: jitter(5.1),
        change: jitter(1.9),
        change_percentage: jitter(59.4),
        proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxCM3cD4eF5gH6iJ4AaABAg",
      },
      {
        name: "Influencer Amplification",
        before: jitterInt(8),
        after: jitterInt(14),
        change: jitterInt(6),
        change_percentage: jitter(75),
        proof_url: "https://www.youtube.com/watch?v=LkY3F-GR8Xc&lc=UgxCM4dE5fG6hI7jK4AaABAg",
      },
    ],
    assessment:
      "The film teaser launch campaign for Vijay Deverakonda significantly boosted positive fan mentions and star power score. Influencer amplification from Telugu cinema channels nearly doubled, driving organic fan engagement.",
    recommendations: [
      "Extend influencer partnerships through the film release window to maintain momentum",
      "Repurpose top-performing fan content into short-form promotional videos",
      "Launch a follow-up campaign around the film's music album release",
    ],
  };
}
