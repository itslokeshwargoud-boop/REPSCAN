/**
 * useReputationOs — React hook for all 10 REPUTATION OS modules.
 * Uses @tanstack/react-query for caching, deduplication, and background refresh.
 *
 * Single-tenant: always uses Vijay Deverakonda data.
 */

import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/reputationOs";

// Re-export types for consumer convenience
export type {
  ReputationScore,
  Alert,
  NarrativeCluster,
  Influencer,
  AuthenticityReport,
  VelocityReport,
  MoodMapReport,
  ActionRecommendation,
  PredictionsReport,
  CampaignReport,
} from "@/lib/reputationOs";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const STALE_TIME = 30_000; // 30 seconds

export function useReputationOs() {
  const score = useQuery({
    queryKey: ["rep-score"],
    queryFn: () => api.fetchReputationScore(),
    staleTime: STALE_TIME,
  });

  const alerts = useQuery({
    queryKey: ["rep-alerts"],
    queryFn: () => api.fetchAlerts(),
    staleTime: STALE_TIME,
  });

  const narratives = useQuery({
    queryKey: ["rep-narratives"],
    queryFn: () => api.fetchNarratives(),
    staleTime: STALE_TIME,
  });

  const influencers = useQuery({
    queryKey: ["rep-influencers"],
    queryFn: () => api.fetchInfluencers(),
    staleTime: STALE_TIME,
  });

  const authenticity = useQuery({
    queryKey: ["rep-authenticity"],
    queryFn: () => api.fetchAuthenticity(),
    staleTime: STALE_TIME,
  });

  const velocity = useQuery({
    queryKey: ["rep-velocity"],
    queryFn: () => api.fetchVelocity(),
    staleTime: STALE_TIME,
  });

  const moodmap = useQuery({
    queryKey: ["rep-moodmap"],
    queryFn: () => api.fetchMoodMap(),
    staleTime: STALE_TIME,
  });

  const actions = useQuery({
    queryKey: ["rep-actions"],
    queryFn: () => api.fetchActions(),
    staleTime: STALE_TIME,
  });

  const predictions = useQuery({
    queryKey: ["rep-predictions"],
    queryFn: () => api.fetchPredictions(),
    staleTime: STALE_TIME,
  });

  const campaigns = useQuery({
    queryKey: ["rep-campaigns"],
    queryFn: () => api.fetchCampaignImpact(),
    staleTime: STALE_TIME,
  });

  return {
    score,
    alerts,
    narratives,
    influencers,
    authenticity,
    velocity,
    moodmap,
    actions,
    predictions,
    campaigns,
  };
}
