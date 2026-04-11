/**
 * useReputationOs — React hook for all REPUTATION OS modules.
 * Uses @tanstack/react-query for caching, deduplication, and background refresh.
 *
 * All data is now powered by the unified Processing Engine via /api/reputation/*
 * endpoints. These endpoints derive intelligence from real Talk + Feed data
 * (YouTube videos, comments, sentiment, bot detection).
 *
 * Fallback: If the unified API fails, falls back to the client-side dummy data
 * from lib/reputationOs.ts to ensure the dashboard never breaks.
 *
 * Single-tenant: always uses Vijay Deverakonda data.
 */

import { useQuery } from "@tanstack/react-query";
import * as fallback from "@/lib/reputationOs";
import { DEFAULT_KEYWORD, CACHE_TTL_MS } from "@/lib/constants";

// Re-export types for consumer convenience
export type {
  ReputationScore,
  Alert,
  NarrativeCluster,
  Influencer,
  AuthenticityReport,
  ActionRecommendation,
  PredictionsReport,
  CampaignReport,
} from "@/lib/reputationOs";

// ---------------------------------------------------------------------------
// Unified API fetchers — fetch from /api/reputation/* (Processing Engine)
// with graceful fallback to mock data if the API is unavailable.
// ---------------------------------------------------------------------------

async function fetchFromApi<T>(
  endpoint: string,
  fallbackFn: () => Promise<T>,
  keyword: string = DEFAULT_KEYWORD,
): Promise<T> {
  try {
    const url = `/api/reputation/${endpoint}?keyword=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // If the API returns an error object, fall back
    if (data && typeof data === "object" && "error" in data && !Array.isArray(data)) {
      throw new Error(data.error);
    }
    return data as T;
  } catch {
    // Graceful fallback to client-side dummy data
    return fallbackFn();
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const STALE_TIME = CACHE_TTL_MS;

export function useReputationOs(keyword: string = DEFAULT_KEYWORD) {
  const score = useQuery({
    queryKey: ["rep-score", keyword],
    queryFn: () =>
      fetchFromApi("overview", fallback.fetchReputationScore, keyword),
    staleTime: STALE_TIME,
  });

  const alerts = useQuery({
    queryKey: ["rep-alerts", keyword],
    queryFn: () =>
      fetchFromApi("alerts", fallback.fetchAlerts, keyword),
    staleTime: STALE_TIME,
  });

  const narratives = useQuery({
    queryKey: ["rep-narratives", keyword],
    queryFn: () =>
      fetchFromApi("narratives", fallback.fetchNarratives, keyword),
    staleTime: STALE_TIME,
  });

  const influencers = useQuery({
    queryKey: ["rep-influencers", keyword],
    queryFn: () =>
      fetchFromApi("influencers", fallback.fetchInfluencers, keyword),
    staleTime: STALE_TIME,
  });

  const authenticity = useQuery({
    queryKey: ["rep-authenticity", keyword],
    queryFn: () =>
      fetchFromApi("authenticity", fallback.fetchAuthenticity, keyword),
    staleTime: STALE_TIME,
  });

  const actions = useQuery({
    queryKey: ["rep-actions", keyword],
    queryFn: () =>
      fetchFromApi("actions", fallback.fetchActions, keyword),
    staleTime: STALE_TIME,
  });

  const predictions = useQuery({
    queryKey: ["rep-predictions", keyword],
    queryFn: () =>
      fetchFromApi("predictions", fallback.fetchPredictions, keyword),
    staleTime: STALE_TIME,
  });

  const campaigns = useQuery({
    queryKey: ["rep-campaigns", keyword],
    queryFn: () =>
      fetchFromApi("campaigns", fallback.fetchCampaignImpact, keyword),
    staleTime: STALE_TIME,
  });

  return {
    score,
    alerts,
    narratives,
    influencers,
    authenticity,
    actions,
    predictions,
    campaigns,
  };
}
