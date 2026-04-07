/**
 * useDashboardData — fetches real YouTube + Twitter data via realApi
 * and maps it into the shapes consumed by the dashboard page.
 *
 * Replaces the broken useKeywords/useAlerts/useCurrentScore hooks
 * that depended on a non-existent FastAPI backend.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchClientDashboard,
  CLIENT_QUERIES,
  CLIENT_NAMES,
  type RealApiResponse,
} from "@/lib/realApi";
import type { ClientId } from "@/lib/mockData";
import type { Keyword, Alert } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardData {
  keywords: Keyword[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  platformCounts: { twitter: number; youtube: number; instagram: number };
  totalMentions: number;
  rhiScore: number;
  apiResponse: RealApiResponse | null;
  refresh: () => void;
}

const CLIENT_IDS: ClientId[] = ["rana", "kims", "peddi"];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardData(): DashboardData {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformCounts, setPlatformCounts] = useState({ twitter: 0, youtube: 0, instagram: 0 });
  const [totalMentions, setTotalMentions] = useState(0);
  const [rhiScore, setRhiScore] = useState(0);
  const [apiResponse, setApiResponse] = useState<RealApiResponse | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const isFetching = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data for all clients in parallel
      const results = await Promise.all(
        CLIENT_IDS.map((id) => fetchClientDashboard(id).then((r) => ({ id, result: r })))
      );

      // Build synthetic keywords from the client search queries
      const now = new Date().toISOString();
      const syntheticKeywords: Keyword[] = results.map(({ id, result }) => ({
        id,
        keyword: CLIENT_QUERIES[id],
        created_at: now,
        is_active: result.status !== "error",
        owner_user_id: null,
      }));

      // Build synthetic alerts from YouTube videos + tweets across all clients
      const syntheticAlerts: Alert[] = [];
      let twitterCount = 0;
      let youtubeCount = 0;
      let totalScore = 0;
      let lastSuccessfulResponse: RealApiResponse | null = null;

      for (const { id, result } of results) {
        const clientName = CLIENT_NAMES[id];

        if (result.status !== "error") {
          lastSuccessfulResponse = result;
        }

        if (result.data) {
          totalScore += result.data.rhi.score;
        }

        // Create alerts from tweets
        for (const tweet of result.twitterData.tweets) {
          twitterCount++;
          syntheticAlerts.push({
            id: `tw-${tweet.id}`,
            keyword_id: id,
            alert_type: tweet.likeCount > 10 ? "viral_negative" : "mention",
            message: `Twitter mention for ${clientName}: ${tweet.text.slice(0, 120)}`,
            evidence_url: tweet.proofUrl,
            sent_via: ["dashboard"],
            triggered_at: tweet.createdAt || now,
            is_read: false,
          });
        }

        // Create alerts from YouTube videos
        for (const video of result.youtubeData.videos) {
          youtubeCount++;
          syntheticAlerts.push({
            id: `yt-${video.id}`,
            keyword_id: id,
            alert_type: video.viewCount > 10000 ? "viral_negative" : "mention",
            message: `YouTube video about ${clientName}: ${video.title.slice(0, 120)}`,
            evidence_url: video.proofUrl,
            sent_via: ["dashboard"],
            triggered_at: video.publishedAt || now,
            is_read: false,
          });
        }
      }

      setKeywords(syntheticKeywords);
      setAlerts(syntheticAlerts);
      setPlatformCounts({ twitter: twitterCount, youtube: youtubeCount, instagram: 0 });
      setTotalMentions(twitterCount + youtubeCount);
      setRhiScore(results.length > 0 ? totalScore / results.length : 0);
      setApiResponse(lastSuccessfulResponse);

      // Set error if all APIs failed
      const allFailed = results.every((r) => r.result.status === "error");
      if (allFailed) {
        setError("All API calls failed. Check API keys.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [fetchKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    isFetching.current = false;
    setFetchKey((k) => k + 1);
  }, []);

  return {
    keywords,
    alerts,
    isLoading,
    error,
    platformCounts,
    totalMentions,
    rhiScore,
    apiResponse,
    refresh,
  };
}
