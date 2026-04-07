/**
 * REPUTATION OS API client — generates realistic client-side dummy data
 * for all 10 REPUTATION OS modules, keyed by tenant.
 *
 * No backend required. Each function returns deterministic-per-tenant data
 * with slight randomisation (±2-3%) so values feel "live" across requests.
 */

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
}

export interface NarrativeCluster {
  label: string;
  percentage: number;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sample_texts: string[];
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
}

export interface AuthenticityReport {
  bot_percentage: number;
  genuine_percentage: number;
  suspicious_accounts: number;
  total_analyzed: number;
  confidence: number;
  patterns: { type: string; count: number; severity: string }[];
}

export interface VelocityReport {
  speed: "rapid" | "moderate" | "slow";
  rate_per_hour: number;
  trend_direction: "accelerating" | "decelerating" | "stable";
  acceleration: number;
  timeline: {
    hour: string;
    positive: number;
    negative: number;
    neutral: number;
  }[];
}

export interface MoodMapSegment {
  segment_index: number;
  start_time: string;
  end_time: string;
  sentiment_score: number;
  dominant_emotion: string;
  comment_count: number;
  is_spike: boolean;
}

export interface MoodMapReport {
  segments: MoodMapSegment[];
  spikes: { time: string; emotion: string; intensity: number }[];
  overall_mood: string;
  summary: string;
}

export interface ActionRecommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  expected_impact: string;
  icon: string; // emoji
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
  speed: VelocityReport["speed"];
  ratePerHour: number;
  overallMood: string;
}

const PROFILES: Record<string, TenantProfile> = {
  vijayx: {
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
    speed: "moderate",
    ratePerHour: 34,
    overallMood: "optimistic",
  },
  prabhasx: {
    baseScore: 52,
    riskLevel: "high",
    trend: "declining",
    trendDelta: -6.1,
    sentiment: 48,
    engagementQuality: 50,
    narrativePositivity: 42,
    influencerImpact: 55,
    botDetection: 77,
    trendStability: 45,
    botPct: 23,
    speed: "rapid",
    ratePerHour: 87,
    overallMood: "tense",
  },
  default: {
    baseScore: 65,
    riskLevel: "medium",
    trend: "stable",
    trendDelta: 0.8,
    sentiment: 64,
    engagementQuality: 62,
    narrativePositivity: 60,
    influencerImpact: 66,
    botDetection: 85,
    trendStability: 63,
    botPct: 14,
    speed: "moderate",
    ratePerHour: 52,
    overallMood: "neutral",
  },
};

function profile(tenantId: string): TenantProfile {
  return PROFILES[tenantId] ?? PROFILES["default"];
}

// ---------------------------------------------------------------------------
// Module 1 — Reputation Score
// ---------------------------------------------------------------------------

export async function fetchReputationScore(
  tenantId: string,
): Promise<ReputationScore> {
  const p = profile(tenantId);
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

const ALERT_TEMPLATES: Record<
  string,
  Omit<Alert, "id" | "timestamp" | "is_read">[]
> = {
  vijayx: [
    {
      type: "velocity_surge",
      severity: "low",
      message: "Vijay Deverakonda mentions up 15% in the last hour",
      details:
        "Organic buzz detected — his latest film teaser is trending on YouTube and Twitter in Telugu-speaking regions.",
    },
    {
      type: "narrative_shift",
      severity: "medium",
      message: "New narrative cluster around Vijay Deverakonda's next film",
      details:
        "3 entertainment influencers started discussing his upcoming pan-India project. Sentiment is 78% positive.",
    },
  ],
  prabhasx: [
    {
      type: "negative_spike",
      severity: "critical",
      message: "Negative mentions about Prabhas surged 340% in 2 hours",
      details:
        "A viral thread is amplifying criticism of his latest film's box office performance. 12k impressions and growing.",
    },
    {
      type: "bot_activity",
      severity: "high",
      message: "Coordinated bot network targeting Prabhas detected",
      details:
        "147 accounts with matching creation dates are posting identical negative comments about his recent release. Confidence: 94%.",
    },
    {
      type: "reputation_drop",
      severity: "high",
      message: "Prabhas reputation score dropped 8 points in 24h",
      details:
        "Primary drivers: negative film reviews (+23% negative sentiment) and declining fan engagement quality (-11%).",
    },
    {
      type: "velocity_surge",
      severity: "medium",
      message: "Prabhas mention velocity tripled compared to baseline",
      details:
        "Rate jumped from 29/hr to 87/hr. 62% of new mentions carry negative sentiment around box office numbers.",
    },
  ],
  default: [
    {
      type: "narrative_shift",
      severity: "medium",
      message: "Narrative shift detected in competitor comparison threads",
      details:
        "Discussion is moving from feature comparison to pricing. Neutral sentiment, but monitor closely.",
    },
    {
      type: "velocity_surge",
      severity: "low",
      message: "Steady increase in mention volume over 6 hours",
      details:
        "Volume up 22% — appears correlated with a trending industry topic.",
    },
    {
      type: "bot_activity",
      severity: "medium",
      message: "Mild bot-like activity flagged",
      details:
        "34 accounts show repetitive posting patterns. Auto-monitoring enabled.",
    },
  ],
};

export async function fetchAlerts(tenantId: string): Promise<Alert[]> {
  const templates = ALERT_TEMPLATES[tenantId] ?? ALERT_TEMPLATES["default"];
  return templates.map((t, i) => ({
    ...t,
    id: `alert-${tenantId}-${i + 1}`,
    timestamp: hoursAgo(i * 2 + 1),
    is_read: i > 1,
  }));
}

// ---------------------------------------------------------------------------
// Module 3 — Narratives
// ---------------------------------------------------------------------------

const NARRATIVE_SETS: Record<string, NarrativeCluster[]> = {
  vijayx: [
    {
      label: "Acting & Film Performances",
      percentage: 38,
      sentiment: "positive",
      sample_texts: [
        "Vijay Deverakonda was phenomenal in his latest film — raw emotion and powerful screen presence",
        "Nobody in Telugu cinema does intense roles like Vijay Deverakonda right now",
        "His range from Arjun Reddy to family entertainer roles is incredible",
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
      trend: "growing",
    },
  ],
  prabhasx: [
    {
      label: "Box Office & Film Reception",
      percentage: 34,
      sentiment: "negative",
      sample_texts: [
        "Prabhas's recent film underperformed at the box office despite massive hype",
        "The storyline was weak — expected much more from a star of his calibre",
        "Audience reviews are harsh, especially after the Baahubali benchmark",
      ],
      trend: "growing",
    },
    {
      label: "Film Quality Concerns",
      percentage: 24,
      sentiment: "negative",
      sample_texts: [
        "Prabhas needs to pick better scripts — the VFX alone cannot carry a film",
        "The dubbing quality in the Hindi version was disappointing",
        "Too many high-budget flops in a row — the magic seems to be fading",
      ],
      trend: "growing",
    },
    {
      label: "Loyal Fan Base",
      percentage: 22,
      sentiment: "positive",
      sample_texts: [
        "Prabhas will always be Baahubali for us — one bad film does not change that",
        "True fans stand by him — he will bounce back stronger",
        "His dedication to physically demanding roles is still unmatched",
      ],
      trend: "declining",
    },
    {
      label: "Industry Comparisons",
      percentage: 20,
      sentiment: "mixed",
      sample_texts: [
        "Other Telugu stars are outshining Prabhas at the box office lately",
        "Still the biggest pan-India star from Tollywood despite recent setbacks",
        "The competition from younger actors is getting fierce",
      ],
      trend: "stable",
    },
  ],
  default: [
    {
      label: "General Perception",
      percentage: 35,
      sentiment: "neutral",
      sample_texts: [
        "Solid product with room for improvement",
        "Does what it says — nothing more, nothing less",
        "Average experience overall",
      ],
      trend: "stable",
    },
    {
      label: "Feature Requests",
      percentage: 28,
      sentiment: "mixed",
      sample_texts: [
        "Would love to see better integrations",
        "Mobile app needs a major update",
        "API documentation could be more detailed",
      ],
      trend: "growing",
    },
    {
      label: "Value Proposition",
      percentage: 22,
      sentiment: "positive",
      sample_texts: [
        "Great bang for the buck",
        "ROI has been positive since month one",
        "Affordable for what you get",
      ],
      trend: "stable",
    },
    {
      label: "Market Position",
      percentage: 15,
      sentiment: "neutral",
      sample_texts: [
        "Middle of the pack in this space",
        "Not the leader but a strong contender",
        "Reliable choice for mid-market teams",
      ],
      trend: "stable",
    },
  ],
};

export async function fetchNarratives(
  tenantId: string,
): Promise<NarrativeCluster[]> {
  const clusters = NARRATIVE_SETS[tenantId] ?? NARRATIVE_SETS["default"];
  return clusters.map((c) => ({
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

const INFLUENCER_SETS: Record<string, InfluencerSet> = {
  vijayx: {
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
      },
    ],
  },
  prabhasx: {
    supporters: [
      {
        username: "@prabhas_fan_forever",
        classification: "supporter",
        influence_score: 54,
        reach: 22_000,
        engagement_rate: 7.1,
        impact_percentage: 5,
        recent_sentiment: 0.71,
        avatar_color: "#22c55e",
      },
    ],
    attackers: [
      {
        username: "@box_office_tracker",
        classification: "attacker",
        influence_score: 88,
        reach: 310_000,
        engagement_rate: 8.4,
        impact_percentage: 24,
        recent_sentiment: -0.91,
        avatar_color: "#dc2626",
      },
      {
        username: "@film_flop_watchdog",
        classification: "attacker",
        influence_score: 79,
        reach: 198_000,
        engagement_rate: 6.7,
        impact_percentage: 19,
        recent_sentiment: -0.78,
        avatar_color: "#ef4444",
      },
      {
        username: "@tollywood_gossip",
        classification: "attacker",
        influence_score: 72,
        reach: 145_000,
        engagement_rate: 9.2,
        impact_percentage: 15,
        recent_sentiment: -0.85,
        avatar_color: "#f87171",
      },
    ],
    neutrals: [
      {
        username: "@indian_cinema_analyst",
        classification: "neutral",
        influence_score: 81,
        reach: 167_000,
        engagement_rate: 3.4,
        impact_percentage: 12,
        recent_sentiment: -0.08,
        avatar_color: "#a3a3a3",
      },
      {
        username: "@south_media_digest",
        classification: "neutral",
        influence_score: 65,
        reach: 74_000,
        engagement_rate: 2.9,
        impact_percentage: 8,
        recent_sentiment: 0.03,
        avatar_color: "#d4d4d4",
      },
    ],
  },
  default: {
    supporters: [
      {
        username: "@brand_advocate_01",
        classification: "supporter",
        influence_score: 72,
        reach: 85_000,
        engagement_rate: 4.2,
        impact_percentage: 12,
        recent_sentiment: 0.74,
        avatar_color: "#22c55e",
      },
      {
        username: "@happy_customer",
        classification: "supporter",
        influence_score: 58,
        reach: 34_000,
        engagement_rate: 5.8,
        impact_percentage: 8,
        recent_sentiment: 0.65,
        avatar_color: "#4ade80",
      },
    ],
    attackers: [
      {
        username: "@critical_voice",
        classification: "attacker",
        influence_score: 67,
        reach: 102_000,
        engagement_rate: 5.5,
        impact_percentage: 14,
        recent_sentiment: -0.58,
        avatar_color: "#ef4444",
      },
    ],
    neutrals: [
      {
        username: "@sector_analysis",
        classification: "neutral",
        influence_score: 71,
        reach: 110_000,
        engagement_rate: 3.0,
        impact_percentage: 10,
        recent_sentiment: 0.02,
        avatar_color: "#a3a3a3",
      },
      {
        username: "@data_observer",
        classification: "neutral",
        influence_score: 63,
        reach: 68_000,
        engagement_rate: 2.6,
        impact_percentage: 7,
        recent_sentiment: -0.04,
        avatar_color: "#d4d4d4",
      },
    ],
  },
};

export async function fetchInfluencers(
  tenantId: string,
): Promise<InfluencerSet> {
  const set = INFLUENCER_SETS[tenantId] ?? INFLUENCER_SETS["default"];

  const applyJitter = (inf: Influencer): Influencer => ({
    ...inf,
    influence_score: clamp(jitterInt(inf.influence_score, 0.02), 0, 100),
    reach: jitterInt(inf.reach, 0.03),
    engagement_rate: jitter(inf.engagement_rate, 0.03),
    impact_percentage: clamp(jitterInt(inf.impact_percentage, 0.02), 0, 100),
    recent_sentiment: clamp(jitter(inf.recent_sentiment, 0.02), -1, 1),
  });

  return {
    supporters: set.supporters.map(applyJitter),
    attackers: set.attackers.map(applyJitter),
    neutrals: set.neutrals.map(applyJitter),
  };
}

// ---------------------------------------------------------------------------
// Module 5 — Authenticity
// ---------------------------------------------------------------------------

export async function fetchAuthenticity(
  tenantId: string,
): Promise<AuthenticityReport> {
  const p = profile(tenantId);
  const totalAnalyzed = jitterInt(tenantId === "prabhasx" ? 4_820 : 2_340, 0.03);
  const botPct = clamp(jitter(p.botPct, 0.03), 0, 100);
  const genuinePct = Math.round((100 - botPct) * 100) / 100;
  const suspicious = Math.round(totalAnalyzed * (botPct / 100));

  const patterns: AuthenticityReport["patterns"] =
    tenantId === "prabhasx"
      ? [
          { type: "Coordinated posting", count: jitterInt(147), severity: "critical" },
          { type: "Duplicate content", count: jitterInt(89), severity: "high" },
          { type: "New-account surge", count: jitterInt(63), severity: "high" },
          { type: "Abnormal engagement ratio", count: jitterInt(38), severity: "medium" },
        ]
      : tenantId === "vijayx"
        ? [
            { type: "Abnormal engagement ratio", count: jitterInt(12), severity: "low" },
            { type: "New-account surge", count: jitterInt(8), severity: "low" },
          ]
        : [
            { type: "Duplicate content", count: jitterInt(31), severity: "medium" },
            { type: "Abnormal engagement ratio", count: jitterInt(22), severity: "medium" },
            { type: "New-account surge", count: jitterInt(15), severity: "low" },
          ];

  return {
    bot_percentage: botPct,
    genuine_percentage: genuinePct,
    suspicious_accounts: suspicious,
    total_analyzed: totalAnalyzed,
    confidence: clamp(jitter(tenantId === "prabhasx" ? 94 : 88, 0.02), 0, 100),
    patterns,
  };
}

// ---------------------------------------------------------------------------
// Module 6 — Velocity
// ---------------------------------------------------------------------------

export async function fetchVelocity(
  tenantId: string,
): Promise<VelocityReport> {
  const p = profile(tenantId);
  const isDecelerating = tenantId === "vijayx";

  const timeline = Array.from({ length: 24 }, (_, i) => {
    const base = p.ratePerHour / 3;
    const positiveBase =
      tenantId === "vijayx"
        ? base * 1.8
        : tenantId === "prabhasx"
          ? base * 0.6
          : base * 1.1;
    const negativeBase =
      tenantId === "prabhasx"
        ? base * 1.6
        : tenantId === "vijayx"
          ? base * 0.3
          : base * 0.8;

    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      positive: Math.max(0, jitterInt(positiveBase, 0.1)),
      negative: Math.max(0, jitterInt(negativeBase, 0.1)),
      neutral: Math.max(0, jitterInt(base * 0.9, 0.1)),
    };
  });

  return {
    speed: p.speed,
    rate_per_hour: jitterInt(p.ratePerHour, 0.03),
    trend_direction: isDecelerating
      ? "decelerating"
      : tenantId === "prabhasx"
        ? "accelerating"
        : "stable",
    acceleration: jitter(
      tenantId === "prabhasx" ? 12.4 : tenantId === "vijayx" ? -3.1 : 0.7,
      0.03,
    ),
    timeline,
  };
}

// ---------------------------------------------------------------------------
// Module 7 — Mood Map
// ---------------------------------------------------------------------------

const EMOTIONS = [
  "joy",
  "trust",
  "anticipation",
  "surprise",
  "anger",
  "disgust",
  "sadness",
  "fear",
] as const;

export async function fetchMoodMap(
  tenantId: string,
): Promise<MoodMapReport> {
  const p = profile(tenantId);

  const positiveEmotions: readonly string[] = ["joy", "trust", "anticipation"];
  const negativeEmotions: readonly string[] = ["anger", "disgust", "sadness", "fear"];

  const segments: MoodMapSegment[] = Array.from({ length: 12 }, (_, i) => {
    const baseSentiment =
      tenantId === "vijayx"
        ? 0.55 + Math.random() * 0.3
        : tenantId === "prabhasx"
          ? -0.1 + Math.random() * 0.4 - 0.2
          : 0.1 + Math.random() * 0.3;

    const emotionPool =
      baseSentiment > 0.3
        ? positiveEmotions
        : baseSentiment < -0.1
          ? negativeEmotions
          : EMOTIONS;

    const emotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];
    const isSpike = Math.random() < 0.15;

    return {
      segment_index: i,
      start_time: hoursAgo(24 - i * 2),
      end_time: hoursAgo(22 - i * 2),
      sentiment_score: clamp(
        Math.round(baseSentiment * 100) / 100,
        -1,
        1,
      ),
      dominant_emotion: emotion,
      comment_count: jitterInt(tenantId === "prabhasx" ? 420 : 185, 0.15),
      is_spike: isSpike,
    };
  });

  const spikes = segments
    .filter((s) => s.is_spike)
    .map((s) => ({
      time: s.start_time,
      emotion: s.dominant_emotion,
      intensity: clamp(jitter(0.8, 0.1), 0, 1),
    }));

  return {
    segments,
    spikes,
    overall_mood: p.overallMood,
    summary:
      tenantId === "vijayx"
        ? "Fan sentiment for Vijay Deverakonda is predominantly positive with occasional spikes around film teasers and public appearances. Trust and joy are the dominant emotions across all segments."
        : tenantId === "prabhasx"
          ? "Sentiment around Prabhas is volatile with frequent negative spikes driven by box office performance concerns. Anger and frustration dominate recent segments following his latest release."
          : "Mixed sentiment with a slight positive lean. Audience mood is relatively stable with no significant spikes in the last 24 hours.",
  };
}

// ---------------------------------------------------------------------------
// Module 8 — Action Recommendations
// ---------------------------------------------------------------------------

const ACTION_SETS: Record<string, ActionRecommendation[]> = {
  vijayx: [
    {
      id: "act-v-1",
      priority: "medium",
      category: "Fan Engagement",
      title: "Amplify positive fan and film review content",
      description:
        "Three high-reach Telugu cinema influencers posted favourable reviews of Vijay Deverakonda this week. Retweet or co-create content to maximise organic reach among fans.",
      expected_impact: "+5% positive sentiment within 48h",
      icon: "📣",
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
    },
  ],
  prabhasx: [
    {
      id: "act-p-1",
      priority: "critical",
      category: "Crisis Response",
      title: "Address box office criticism with positive PR",
      description:
        "The top negative narrative (34%) centres on box office underperformance. A candid interview or social media post acknowledging fans could reduce negative buzz by 20-30%.",
      expected_impact: "-15% negative mentions within 72h",
      icon: "🚨",
    },
    {
      id: "act-p-2",
      priority: "critical",
      category: "Bot Mitigation",
      title: "Report coordinated bot network targeting Prabhas",
      description:
        "147 accounts are amplifying negative content about Prabhas with identical messaging. File platform abuse reports immediately.",
      expected_impact: "Remove 60-70% of artificial negative volume",
      icon: "🤖",
    },
    {
      id: "act-p-3",
      priority: "high",
      category: "Fan Engagement",
      title: "Activate loyal fan base for counter-narrative",
      description:
        "Loyal Prabhas supporters are declining in visibility. Provide them with exclusive content and event access to counter negative coverage.",
      expected_impact: "+8% positive narrative share",
      icon: "🛡️",
    },
    {
      id: "act-p-4",
      priority: "high",
      category: "PR Strategy",
      title: "Announce next compelling project",
      description:
        "Shift the narrative from past box office results to future excitement. An announcement of a highly anticipated collaboration can redirect fan energy.",
      expected_impact: "Redirect 40% of conversation to positive anticipation",
      icon: "🎬",
    },
    {
      id: "act-p-5",
      priority: "medium",
      category: "Monitoring",
      title: "Set up industry comparison alerts",
      description:
        "20% of narratives involve comparisons with other Telugu stars. Monitor and prepare counter-positioning content highlighting Prabhas's unique strengths.",
      expected_impact: "Prevent narrative loss to competitor actors",
      icon: "👀",
    },
  ],
  default: [
    {
      id: "act-d-1",
      priority: "medium",
      category: "Content",
      title: "Address top feature requests publicly",
      description:
        "Feature requests make up 28% of narratives. A public roadmap update would convert mixed sentiment to positive.",
      expected_impact: "+4% positive sentiment, improved trust score",
      icon: "🗺️",
    },
    {
      id: "act-d-2",
      priority: "medium",
      category: "Monitoring",
      title: "Investigate bot-like activity",
      description:
        "34 accounts flagged for repetitive patterns. Review and report if confirmed artificial.",
      expected_impact: "Cleaner sentiment data, reduced noise",
      icon: "🔍",
    },
    {
      id: "act-d-3",
      priority: "low",
      category: "Engagement",
      title: "Engage neutral influencers",
      description:
        "Two neutral influencers with high reach could be converted to supporters through product demos or partnerships.",
      expected_impact: "+6% positive influencer coverage",
      icon: "🤝",
    },
  ],
};

export async function fetchActions(
  tenantId: string,
): Promise<ActionRecommendation[]> {
  return ACTION_SETS[tenantId] ?? ACTION_SETS["default"];
}

// ---------------------------------------------------------------------------
// Module 9 — Predictions
// ---------------------------------------------------------------------------

export async function fetchPredictions(
  tenantId: string,
): Promise<PredictionsReport> {
  const p = profile(tenantId);

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

  const riskForecast =
    tenantId === "vijayx"
      ? "Low risk — Vijay Deverakonda's reputation trajectory is positive. No significant threats detected on the horizon. Film buzz and fan loyalty are strong."
      : tenantId === "prabhasx"
        ? "High risk — Prabhas's reputation score is projected to drop below 45 within 30 days if current negative film reception trends continue unchecked."
        : "Moderate risk — score is expected to remain stable. Monitor emerging narratives for early warning signs.";

  return { forecasts, historical, risk_forecast: riskForecast };
}

// ---------------------------------------------------------------------------
// Module 10 — Campaign Impact
// ---------------------------------------------------------------------------

export async function fetchCampaignImpact(
  tenantId: string,
): Promise<CampaignReport> {
  if (tenantId === "vijayx") {
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
        },
        {
          name: "Star Power Score",
          before: jitterInt(64),
          after: jitterInt(78),
          change: jitterInt(14),
          change_percentage: jitter(21.9),
        },
        {
          name: "Fan Engagement Rate",
          before: jitter(3.2),
          after: jitter(5.1),
          change: jitter(1.9),
          change_percentage: jitter(59.4),
        },
        {
          name: "Influencer Amplification",
          before: jitterInt(8),
          after: jitterInt(14),
          change: jitterInt(6),
          change_percentage: jitter(75),
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

  if (tenantId === "prabhasx") {
    return {
      campaign_name: "Public Image Recovery Initiative",
      impact_score: jitterInt(31, 0.02),
      status: "negative",
      metrics: [
        {
          name: "Negative Mentions",
          before: jitterInt(3_450),
          after: jitterInt(2_980),
          change: jitterInt(-470),
          change_percentage: jitter(-13.6),
        },
        {
          name: "Fan Sentiment Score",
          before: jitterInt(38),
          after: jitterInt(42),
          change: jitterInt(4),
          change_percentage: jitter(10.5),
        },
        {
          name: "Bot Traffic Share",
          before: jitter(23),
          after: jitter(19),
          change: jitter(-4),
          change_percentage: jitter(-17.4),
        },
        {
          name: "PR Response Time (hrs)",
          before: jitter(18.5),
          after: jitter(8.2),
          change: jitter(-10.3),
          change_percentage: jitter(-55.7),
        },
      ],
      assessment:
        "Prabhas's public image recovery initiative achieved marginal improvements. Negative mentions dropped 14% but remain elevated after the box office underperformance. PR response time improved significantly, though fan sentiment recovery is slow.",
      recommendations: [
        "Increase campaign duration — 2 weeks is insufficient for image recovery after a box office setback",
        "Add a direct fan outreach component through meet-and-greet events",
        "Announce a compelling upcoming project to shift narrative towards anticipation",
        "Invest in bot mitigation before the next film release campaign",
      ],
    };
  }

  // default
  return {
    campaign_name: "Brand Awareness Sprint",
    impact_score: jitterInt(58, 0.02),
    status: "neutral",
    metrics: [
      {
        name: "Total Mentions",
        before: jitterInt(1_800),
        after: jitterInt(2_340),
        change: jitterInt(540),
        change_percentage: jitter(30),
      },
      {
        name: "Sentiment Ratio",
        before: jitter(1.4),
        after: jitter(1.6),
        change: jitter(0.2),
        change_percentage: jitter(14.3),
      },
      {
        name: "New Audience Reach",
        before: jitterInt(42_000),
        after: jitterInt(67_000),
        change: jitterInt(25_000),
        change_percentage: jitter(59.5),
      },
      {
        name: "Engagement Rate",
        before: jitter(2.8),
        after: jitter(3.4),
        change: jitter(0.6),
        change_percentage: jitter(21.4),
      },
    ],
    assessment:
      "The brand awareness sprint delivered moderate results. Mention volume and reach increased meaningfully, but sentiment improvement was limited.",
    recommendations: [
      "Focus next campaign on sentiment, not just volume",
      "Partner with neutral influencers to shift perception",
      "A/B test messaging to identify highest-impact content themes",
    ],
  };
}
