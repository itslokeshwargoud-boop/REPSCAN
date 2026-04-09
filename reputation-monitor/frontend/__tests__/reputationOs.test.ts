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

describe("Single-tenant enforcement (Vijay Deverakonda only)", () => {
  it("data functions accept no tenant parameter", () => {
    // All fetch functions should have zero required parameters.
    // If someone accidentally re-adds a tenantId param, TS will catch it
    // at compile time, but this runtime check is a safety net.
    expect(fetchReputationScore.length).toBe(0);
    expect(fetchAlerts.length).toBe(0);
    expect(fetchNarratives.length).toBe(0);
    expect(fetchInfluencers.length).toBe(0);
    expect(fetchAuthenticity.length).toBe(0);
    expect(fetchActions.length).toBe(0);
    expect(fetchPredictions.length).toBe(0);
    expect(fetchCampaignImpact.length).toBe(0);
  });

  it("score always returns low risk (Vijay profile)", async () => {
    const score = await fetchReputationScore();
    expect(score.risk_level).toBe("low");
    expect(score.trend).toBe("improving");
    expect(score.score).toBeGreaterThanOrEqual(70);
  });

  it("alerts are Vijay-specific (not Prabhas or default)", async () => {
    const alerts = await fetchAlerts();
    const text = allTexts(alerts);
    // Vijay alerts should reference him
    expect(text.toLowerCase()).toContain("vijay deverakonda");
    // Should NOT contain Prabhas-specific content
    expect(text.toLowerCase()).not.toContain("prabhas");
  });

  it("campaign is Film Teaser Launch (Vijay), not recovery or brand", async () => {
    const campaign = await fetchCampaignImpact();
    expect(campaign.campaign_name).toBe("Film Teaser Launch Campaign");
    expect(campaign.status).toBe("positive");
    // Must not be Prabhas recovery campaign
    expect(campaign.campaign_name.toLowerCase()).not.toContain("recovery");
  });

  it("predictions risk forecast is low-risk Vijay profile", async () => {
    const predictions = await fetchPredictions();
    expect(predictions.risk_forecast.toLowerCase()).toContain("low risk");
    expect(predictions.risk_forecast.toLowerCase()).toContain("vijay deverakonda");
    expect(predictions.risk_forecast.toLowerCase()).not.toContain("prabhas");
  });

  it("constants module exports correct values", async () => {
    const { VIJAY_TENANT_ID, VIJAY_DISPLAY_NAME, PAGE_TITLE } = await import("@/lib/constants");
    expect(VIJAY_TENANT_ID).toBe("vijay_deverakonda");
    expect(VIJAY_DISPLAY_NAME).toBe("Vijay Deverakonda");
    expect(PAGE_TITLE).toContain("Vijay Deverakonda");
  });
});
