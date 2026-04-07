/**
 * useReputationOs — React hook for all 10 REPUTATION OS modules.
 * Uses @tanstack/react-query for caching, deduplication, and background refresh.
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

export function useReputationOs(tenantId: string) {
  const score = useQuery({
    queryKey: ["rep-score", tenantId],
    queryFn: () => api.fetchReputationScore(tenantId),
    staleTime: STALE_TIME,
  });

  const alerts = useQuery({
    queryKey: ["rep-alerts", tenantId],
    queryFn: () => api.fetchAlerts(tenantId),
    staleTime: STALE_TIME,
  });

  const narratives = useQuery({
    queryKey: ["rep-narratives", tenantId],
    queryFn: () => api.fetchNarratives(tenantId),
    staleTime: STALE_TIME,
  });

  const influencers = useQuery({
    queryKey: ["rep-influencers", tenantId],
    queryFn: () => api.fetchInfluencers(tenantId),
    staleTime: STALE_TIME,
  });

  const authenticity = useQuery({
    queryKey: ["rep-authenticity", tenantId],
    queryFn: () => api.fetchAuthenticity(tenantId),
    staleTime: STALE_TIME,
  });

  const velocity = useQuery({
    queryKey: ["rep-velocity", tenantId],
    queryFn: () => api.fetchVelocity(tenantId),
    staleTime: STALE_TIME,
  });

  const moodmap = useQuery({
    queryKey: ["rep-moodmap", tenantId],
    queryFn: () => api.fetchMoodMap(tenantId),
    staleTime: STALE_TIME,
  });

  const actions = useQuery({
    queryKey: ["rep-actions", tenantId],
    queryFn: () => api.fetchActions(tenantId),
    staleTime: STALE_TIME,
  });

  const predictions = useQuery({
    queryKey: ["rep-predictions", tenantId],
    queryFn: () => api.fetchPredictions(tenantId),
    staleTime: STALE_TIME,
  });

  const campaigns = useQuery({
    queryKey: ["rep-campaigns", tenantId],
    queryFn: () => api.fetchCampaignImpact(tenantId),
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
