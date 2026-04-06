// Multi-client in-memory data store
// STRICT: data is NEVER mixed between clients

export type ClientId = "rana" | "kims" | "peddi";

export interface RHIMetric {
  key: string;
  label: string;           // user-friendly label
  technicalLabel: string;  // internal name
  value: number;
  displayValue: string;
  change: number;          // % change, positive = good
  changeLabel: string;     // e.g. "+2.4%"
  weight: number;          // weight in RHI formula (sum = 1)
  status: "good" | "attention" | "risky";
  tooltip: string;         // plain-English explanation
  unit: string;            // "%", "/100", "pts", etc.
  higherIsBetter: boolean;
  displayMax: number;      // upper bound for progress bar normalization (e.g. 100 or 10 for engagement rate)
}

export interface RHIScore {
  score: number;
  trend: number;           // delta vs last period
  trendLabel: string;
  status: "good" | "attention" | "risky";
  summary: string;         // plain-English summary
}

export interface TrendDataPoint {
  date: string;
  engagement: number;
  sentiment: number;
  mediaPresence: number;
}

export interface InsightAlert {
  id: string;
  type: "positive" | "warning" | "neutral";
  message: string;         // plain English
  detail: string;
  timestamp: string;
}

export interface ClientData {
  clientId: ClientId;
  clientName: string;
  rhi: RHIScore;
  metrics: RHIMetric[];
  trendData: TrendDataPoint[];
  insights: InsightAlert[];
  apiStatus: {
    status: "ok" | "partial_data" | "error";
    reason?: "rate_limit" | "api_error" | "timeout";
    tweetsFetched: number;
    youtubeFetched: number;
  };
}

// Build data for each client
function buildRanaData(): ClientData {
  return {
    clientId: "rana",
    clientName: "RANA",
    rhi: {
      score: 89.4,
      trend: 2.1,
      trendLabel: "+2.1%",
      status: "good",
      summary: "Your online reputation is strong and improving. People are engaging more and media coverage is very positive.",
    },
    metrics: [
      {
        key: "sentiment",
        label: "Public Opinion",
        technicalLabel: "Sentiment Index",
        value: 72,
        displayValue: "72%",
        change: 2.4,
        changeLabel: "+2.4%",
        weight: 0.20,
        status: "good",
        tooltip: "This shows how people feel about you online. A higher percentage means more people have positive things to say.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "media",
        label: "Media Presence",
        technicalLabel: "Media Coverage",
        value: 92,
        displayValue: "92/100",
        change: 5.0,
        changeLabel: "+5.0%",
        weight: 0.15,
        status: "good",
        tooltip: "How often your brand appears in news articles and online publications. Higher is better.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "engagement",
        label: "Audience Interaction",
        technicalLabel: "Social Engagement",
        value: 4.8,
        displayValue: "4.8%",
        change: 1.2,
        changeLabel: "+1.2%",
        weight: 0.15,
        status: "good",
        tooltip: "The percentage of people who interact with your content — likes, shares, comments. More interaction means people care about your brand.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 10,
      },
      {
        key: "trust",
        label: "Public Trust",
        technicalLabel: "Public Trust Index",
        value: 85.2,
        displayValue: "85.2",
        change: 0,
        changeLabel: "Stable",
        weight: 0.15,
        status: "good",
        tooltip: "A measure of how much people trust your brand based on reviews, mentions, and public feedback.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "peer",
        label: "Industry Standing",
        technicalLabel: "Peer Validation",
        value: 88,
        displayValue: "88/100",
        change: 0.8,
        changeLabel: "+0.8%",
        weight: 0.10,
        status: "good",
        tooltip: "How your brand is regarded by industry peers, partners, and competitors. Higher scores mean strong respect in your field.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "risk",
        label: "Risk Level",
        technicalLabel: "Risk Exposure",
        value: 12,
        displayValue: "12%",
        change: -2.0,
        changeLabel: "-2.0%",
        weight: 0.10,
        status: "good",
        tooltip: "The level of negative risk your brand is currently facing online. Lower is better — it means fewer threats or controversies.",
        unit: "%",
        higherIsBetter: false,
        displayMax: 100,
      },
      {
        key: "growth",
        label: "Growth Momentum",
        technicalLabel: "Growth Momentum",
        value: 82,
        displayValue: "High",
        change: 4.1,
        changeLabel: "+4.1%",
        weight: 0.10,
        status: "good",
        tooltip: "How quickly your brand is growing its presence and reach online. 'High' means you are gaining momentum fast.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "influencer",
        label: "Influencer Score",
        technicalLabel: "Influencer Score",
        value: 86,
        displayValue: "86",
        change: 1.5,
        changeLabel: "+1.5%",
        weight: 0.05,
        status: "good",
        tooltip: "How influential people who talk about your brand are. A higher score means key opinion leaders are mentioning you positively.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
    ],
    trendData: [
      { date: "Jan", engagement: 3.2, sentiment: 65, mediaPresence: 78 },
      { date: "Feb", engagement: 3.8, sentiment: 67, mediaPresence: 80 },
      { date: "Mar", engagement: 4.0, sentiment: 68, mediaPresence: 83 },
      { date: "Apr", engagement: 4.2, sentiment: 69, mediaPresence: 85 },
      { date: "May", engagement: 4.5, sentiment: 70, mediaPresence: 88 },
      { date: "Jun", engagement: 4.6, sentiment: 71, mediaPresence: 89 },
      { date: "Jul", engagement: 4.8, sentiment: 72, mediaPresence: 92 },
    ],
    insights: [
      {
        id: "r1",
        type: "positive",
        message: "More people are engaging with your content this month",
        detail: "Audience interaction grew by 20% compared to last month. Your recent posts are resonating well.",
        timestamp: "2 hours ago",
      },
      {
        id: "r2",
        type: "positive",
        message: "Your media presence reached an all-time high",
        detail: "You appeared in 47 news articles this week, a 15% increase. Coverage is predominantly positive.",
        timestamp: "5 hours ago",
      },
      {
        id: "r3",
        type: "neutral",
        message: "Public trust remains steady",
        detail: "Your trust score has been stable for 30 days. No major changes in public perception.",
        timestamp: "1 day ago",
      },
    ],
    apiStatus: {
      status: "ok",
      tweetsFetched: 87,
      youtubeFetched: 42,
    },
  };
}

function buildKimsData(): ClientData {
  return {
    clientId: "kims",
    clientName: "KIMS",
    rhi: {
      score: 74.8,
      trend: -0.8,
      trendLabel: "-0.8%",
      status: "attention",
      summary: "Your reputation is generally healthy but there are a few areas that need your attention. Public opinion has slightly declined recently.",
    },
    metrics: [
      {
        key: "sentiment",
        label: "Public Opinion",
        technicalLabel: "Sentiment Index",
        value: 61,
        displayValue: "61%",
        change: -3.2,
        changeLabel: "-3.2%",
        weight: 0.20,
        status: "attention",
        tooltip: "This shows how people feel about you online. A higher percentage means more people have positive things to say.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "media",
        label: "Media Presence",
        technicalLabel: "Media Coverage",
        value: 78,
        displayValue: "78/100",
        change: 1.5,
        changeLabel: "+1.5%",
        weight: 0.15,
        status: "good",
        tooltip: "How often your brand appears in news articles and online publications. Higher is better.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "engagement",
        label: "Audience Interaction",
        technicalLabel: "Social Engagement",
        value: 3.1,
        displayValue: "3.1%",
        change: -0.5,
        changeLabel: "-0.5%",
        weight: 0.15,
        status: "attention",
        tooltip: "The percentage of people who interact with your content. More interaction means people care about your brand.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 10,
      },
      {
        key: "trust",
        label: "Public Trust",
        technicalLabel: "Public Trust Index",
        value: 70.5,
        displayValue: "70.5",
        change: -1.2,
        changeLabel: "-1.2%",
        weight: 0.15,
        status: "attention",
        tooltip: "A measure of how much people trust your brand based on reviews, mentions, and public feedback.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "peer",
        label: "Industry Standing",
        technicalLabel: "Peer Validation",
        value: 80,
        displayValue: "80/100",
        change: 0.3,
        changeLabel: "+0.3%",
        weight: 0.10,
        status: "good",
        tooltip: "How your brand is regarded by industry peers, partners, and competitors.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "risk",
        label: "Risk Level",
        technicalLabel: "Risk Exposure",
        value: 24,
        displayValue: "24%",
        change: 3.5,
        changeLabel: "+3.5%",
        weight: 0.10,
        status: "attention",
        tooltip: "The level of negative risk your brand is currently facing online. Lower is better.",
        unit: "%",
        higherIsBetter: false,
        displayMax: 100,
      },
      {
        key: "growth",
        label: "Growth Momentum",
        technicalLabel: "Growth Momentum",
        value: 62,
        displayValue: "Medium",
        change: -1.0,
        changeLabel: "-1.0%",
        weight: 0.10,
        status: "attention",
        tooltip: "How quickly your brand is growing its presence and reach online.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "influencer",
        label: "Influencer Score",
        technicalLabel: "Influencer Score",
        value: 72,
        displayValue: "72",
        change: 0.5,
        changeLabel: "+0.5%",
        weight: 0.05,
        status: "good",
        tooltip: "How influential people who talk about your brand are.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
    ],
    trendData: [
      { date: "Jan", engagement: 3.8, sentiment: 66, mediaPresence: 72 },
      { date: "Feb", engagement: 3.6, sentiment: 65, mediaPresence: 74 },
      { date: "Mar", engagement: 3.5, sentiment: 64, mediaPresence: 75 },
      { date: "Apr", engagement: 3.4, sentiment: 63, mediaPresence: 76 },
      { date: "May", engagement: 3.2, sentiment: 63, mediaPresence: 77 },
      { date: "Jun", engagement: 3.0, sentiment: 62, mediaPresence: 77 },
      { date: "Jul", engagement: 3.1, sentiment: 61, mediaPresence: 78 },
    ],
    insights: [
      {
        id: "k1",
        type: "warning",
        message: "People's opinion of your brand has dropped slightly",
        detail: "Public opinion fell by 3.2% this month. We noticed a spike in negative mentions related to recent service delays.",
        timestamp: "3 hours ago",
      },
      {
        id: "k2",
        type: "warning",
        message: "Your risk level has increased — action recommended",
        detail: "Risk exposure went up by 3.5%. Monitor social media closely for emerging negative trends.",
        timestamp: "6 hours ago",
      },
      {
        id: "k3",
        type: "positive",
        message: "Your media coverage continued to grow",
        detail: "You gained 12 new media mentions this week. Keep up the press engagement.",
        timestamp: "1 day ago",
      },
    ],
    apiStatus: {
      status: "partial_data",
      reason: "rate_limit",
      tweetsFetched: 100,
      youtubeFetched: 38,
    },
  };
}

function buildPeddiData(): ClientData {
  return {
    clientId: "peddi",
    clientName: "PEDDI",
    rhi: {
      score: 58.2,
      trend: -4.5,
      trendLabel: "-4.5%",
      status: "risky",
      summary: "Your brand is facing some challenges right now. Public opinion and engagement have declined and require immediate attention.",
    },
    metrics: [
      {
        key: "sentiment",
        label: "Public Opinion",
        technicalLabel: "Sentiment Index",
        value: 48,
        displayValue: "48%",
        change: -8.0,
        changeLabel: "-8.0%",
        weight: 0.20,
        status: "risky",
        tooltip: "This shows how people feel about you online. A higher percentage means more people have positive things to say.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "media",
        label: "Media Presence",
        technicalLabel: "Media Coverage",
        value: 65,
        displayValue: "65/100",
        change: -2.0,
        changeLabel: "-2.0%",
        weight: 0.15,
        status: "attention",
        tooltip: "How often your brand appears in news articles and online publications. Higher is better.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "engagement",
        label: "Audience Interaction",
        technicalLabel: "Social Engagement",
        value: 2.1,
        displayValue: "2.1%",
        change: -2.3,
        changeLabel: "-2.3%",
        weight: 0.15,
        status: "risky",
        tooltip: "The percentage of people who interact with your content. More interaction means people care about your brand.",
        unit: "%",
        higherIsBetter: true,
        displayMax: 10,
      },
      {
        key: "trust",
        label: "Public Trust",
        technicalLabel: "Public Trust Index",
        value: 54.0,
        displayValue: "54.0",
        change: -5.0,
        changeLabel: "-5.0%",
        weight: 0.15,
        status: "risky",
        tooltip: "A measure of how much people trust your brand based on reviews, mentions, and public feedback.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "peer",
        label: "Industry Standing",
        technicalLabel: "Peer Validation",
        value: 60,
        displayValue: "60/100",
        change: -1.5,
        changeLabel: "-1.5%",
        weight: 0.10,
        status: "attention",
        tooltip: "How your brand is regarded by industry peers, partners, and competitors.",
        unit: "/100",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "risk",
        label: "Risk Level",
        technicalLabel: "Risk Exposure",
        value: 38,
        displayValue: "38%",
        change: 7.0,
        changeLabel: "+7.0%",
        weight: 0.10,
        status: "risky",
        tooltip: "The level of negative risk your brand is currently facing online. Lower is better.",
        unit: "%",
        higherIsBetter: false,
        displayMax: 100,
      },
      {
        key: "growth",
        label: "Growth Momentum",
        technicalLabel: "Growth Momentum",
        value: 40,
        displayValue: "Low",
        change: -6.0,
        changeLabel: "-6.0%",
        weight: 0.10,
        status: "risky",
        tooltip: "How quickly your brand is growing its presence and reach online.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
      {
        key: "influencer",
        label: "Influencer Score",
        technicalLabel: "Influencer Score",
        value: 55,
        displayValue: "55",
        change: -2.0,
        changeLabel: "-2.0%",
        weight: 0.05,
        status: "attention",
        tooltip: "How influential people who talk about your brand are.",
        unit: "pts",
        higherIsBetter: true,
        displayMax: 100,
      },
    ],
    trendData: [
      { date: "Jan", engagement: 4.5, sentiment: 62, mediaPresence: 72 },
      { date: "Feb", engagement: 4.0, sentiment: 60, mediaPresence: 70 },
      { date: "Mar", engagement: 3.5, sentiment: 58, mediaPresence: 68 },
      { date: "Apr", engagement: 3.0, sentiment: 55, mediaPresence: 67 },
      { date: "May", engagement: 2.6, sentiment: 52, mediaPresence: 66 },
      { date: "Jun", engagement: 2.3, sentiment: 50, mediaPresence: 65 },
      { date: "Jul", engagement: 2.1, sentiment: 48, mediaPresence: 65 },
    ],
    insights: [
      {
        id: "p1",
        type: "warning",
        message: "People's opinion of your brand has fallen significantly",
        detail: "Public opinion dropped 8% this month. Negative mentions have spiked — immediate response recommended.",
        timestamp: "1 hour ago",
      },
      {
        id: "p2",
        type: "warning",
        message: "Your risk level is high and rising",
        detail: "Risk exposure jumped by 7%. Consider a proactive communication strategy to address public concerns.",
        timestamp: "4 hours ago",
      },
      {
        id: "p3",
        type: "warning",
        message: "Fewer people are engaging with your content",
        detail: "Audience interaction dropped by 2.3%. Your content may not be resonating with your audience right now.",
        timestamp: "8 hours ago",
      },
    ],
    apiStatus: {
      status: "ok",
      tweetsFetched: 94,
      youtubeFetched: 50,
    },
  };
}

// STRICT: per-client isolated data store — NEVER mix clients
const dataStore: Record<ClientId, ClientData> = {
  rana: buildRanaData(),
  kims: buildKimsData(),
  peddi: buildPeddiData(),
};

export function getClientData(clientId: ClientId): ClientData {
  // ALWAYS filter by clientId — never return wrong client's data
  return dataStore[clientId];
}

export function getAllClientSummaries(): Array<{
  clientId: ClientId;
  clientName: string;
  score: number;
  trend: number;
  trendLabel: string;
  status: "good" | "attention" | "risky";
}> {
  return (Object.keys(dataStore) as ClientId[]).map((id) => ({
    clientId: id,
    clientName: dataStore[id].clientName,
    score: dataStore[id].rhi.score,
    trend: dataStore[id].rhi.trend,
    trendLabel: dataStore[id].rhi.trendLabel,
    status: dataStore[id].rhi.status,
  }));
}

export const CLIENT_IDS: ClientId[] = ["rana", "kims", "peddi"];
