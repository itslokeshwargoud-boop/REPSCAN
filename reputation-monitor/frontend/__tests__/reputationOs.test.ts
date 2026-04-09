/**
 * Reputation OS — Entity relevance & data integrity tests.
 *
 * Single-tenant: permanently scoped to Vijay Deverakonda.
 * These tests ensure data is strictly relevant to the persona —
 * no generic SaaS, tech-product, or other-domain content leaking in.
 */

import { describe, it, expect } from "vitest";
import {
  fetchReputationScore,
  fetchAlerts,
  fetchNarratives,
  fetchInfluencers,
  fetchAuthenticity,
  fetchVelocity,
  fetchMoodMap,
  fetchActions,
  fetchPredictions,
  fetchCampaignImpact,
} from "@/lib/reputationOs";

// ── Relevance keyword lists ──────────────────────────────────────────────────

/** Keywords/phrases that should NOT appear in Vijay Deverakonda data. */
const VIJAY_IRRELEVANT = [
  "product",
  "SaaS",
  "enterprise",
  "startup",
  "AI features",
  "delivery",
  "customer support",
  "pricing",
  "subscription",
  "onboarding",
  "webinar",
  "Q4",
  "sustainability",
  "thought leadership",
  "tech channels",
  "tech space",
  "tutorial",
];

/** Keywords that SHOULD appear somewhere in Vijay Deverakonda narrative/alert/action data. */
const VIJAY_RELEVANT = [
  "Vijay Deverakonda",
  "film",
  "fan",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function allTexts(obj: unknown): string {
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map(allTexts).join(" ");
  if (obj && typeof obj === "object") {
    return Object.values(obj).map(allTexts).join(" ");
  }
  return String(obj);
}

function containsAny(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Vijay Deverakonda data relevance", () => {
  it("narratives contain no irrelevant SaaS/tech keywords", async () => {
    const narratives = await fetchNarratives();
    const text = allTexts(narratives);
    const hits = containsAny(text, VIJAY_IRRELEVANT);
    expect(hits).toEqual([]);
  });

  it("narratives reference Vijay Deverakonda, film, or fan culture", async () => {
    const narratives = await fetchNarratives();
    const text = allTexts(narratives);
    for (const kw of VIJAY_RELEVANT) {
      expect(text.toLowerCase()).toContain(kw.toLowerCase());
    }
  });

  it("alerts contain no irrelevant SaaS/tech keywords", async () => {
    const alerts = await fetchAlerts();
    const text = allTexts(alerts);
    const hits = containsAny(text, VIJAY_IRRELEVANT);
    expect(hits).toEqual([]);
  });

  it("alerts reference Vijay Deverakonda or Telugu cinema", async () => {
    const alerts = await fetchAlerts();
    const text = allTexts(alerts);
    expect(text.toLowerCase()).toContain("vijay deverakonda");
  });

  it("actions contain no irrelevant SaaS/tech keywords", async () => {
    const actions = await fetchActions();
    const text = allTexts(actions);
    const hits = containsAny(text, VIJAY_IRRELEVANT);
    expect(hits).toEqual([]);
  });

  it("influencers have entertainment/film usernames, not tech", async () => {
    const inf = await fetchInfluencers();
    const allUsernames = [
      ...inf.supporters,
      ...inf.attackers,
      ...inf.neutrals,
    ].map((u) => u.username);
    const techNames = ["tech", "saas", "digital_insider", "market_watch"];
    for (const name of allUsernames) {
      for (const bad of techNames) {
        expect(name.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("campaign data references film/teaser, not product launch", async () => {
    const campaign = await fetchCampaignImpact();
    expect(campaign.campaign_name.toLowerCase()).not.toContain("product");
    expect(campaign.campaign_name.toLowerCase()).toContain("film");
  });

  it("mood map summary references Vijay Deverakonda", async () => {
    const mood = await fetchMoodMap();
    expect(mood.summary.toLowerCase()).toContain("vijay deverakonda");
    expect(mood.summary.toLowerCase()).not.toContain("product");
  });

  it("predictions risk forecast references Vijay Deverakonda", async () => {
    const predictions = await fetchPredictions();
    expect(predictions.risk_forecast.toLowerCase()).toContain(
      "vijay deverakonda",
    );
  });
});

describe("Reputation score data integrity", () => {
  it("score is in 0-100 range with valid breakdown", async () => {
    const score = await fetchReputationScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.risk_level).toBe("low");
    expect(score.trend).toBe("improving");
    for (const val of Object.values(score.breakdown)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

describe("Authenticity report data integrity", () => {
  it("bot + genuine percentages sum to ~100%", async () => {
    const auth = await fetchAuthenticity();
    const sum = auth.bot_percentage + auth.genuine_percentage;
    expect(sum).toBeGreaterThan(98);
    expect(sum).toBeLessThan(102);
  });

  it("confidence is between 0 and 100", async () => {
    const auth = await fetchAuthenticity();
    expect(auth.confidence).toBeGreaterThanOrEqual(0);
    expect(auth.confidence).toBeLessThanOrEqual(100);
  });
});

describe("Velocity report data integrity", () => {
  it("timeline has 24 hourly entries", async () => {
    const vel = await fetchVelocity();
    expect(vel.timeline).toHaveLength(24);
    for (const entry of vel.timeline) {
      expect(entry.positive).toBeGreaterThanOrEqual(0);
      expect(entry.negative).toBeGreaterThanOrEqual(0);
      expect(entry.neutral).toBeGreaterThanOrEqual(0);
    }
  });
});
