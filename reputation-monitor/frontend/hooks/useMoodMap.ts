/**
 * useMoodMap — React hook for managing MoodMap (video mood analysis) state.
 * Handles fetching and state management for the MoodMap feature.
 */

import { useState, useCallback, useRef } from "react";
import {
  fetchMoodMap,
  type MoodMapDataResponse,
} from "@/lib/moodMapApi";
import type { MoodMapReport } from "@/lib/moodMap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoodMapData {
  /** Input: video URL */
  videoUrl: string;
  setVideoUrl: (url: string) => void;

  /** Input: keyword context */
  keywordContext: string;
  setKeywordContext: (ctx: string) => void;

  /** Trigger analysis */
  analyze: () => void;

  /** The report (null until first analysis) */
  report: MoodMapReport | null;

  /** Status flags */
  isLoading: boolean;
  error: string | null;
  hasAnalyzed: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMoodMap(): MoodMapData {
  const [videoUrl, setVideoUrl] = useState("");
  const [keywordContext, setKeywordContext] = useState("");
  const [report, setReport] = useState<MoodMapReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const isFetching = useRef(false);

  const analyze = useCallback(async () => {
    const url = videoUrl.trim();
    if (!url || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result: MoodMapDataResponse = await fetchMoodMap({
        videoUrl: url,
        keywordContext: keywordContext.trim() || undefined,
      });

      if (result.success && result.report) {
        setReport(result.report);
        setError(null);
      } else {
        setError(result.error ?? "Analysis failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze video"
      );
    } finally {
      setIsLoading(false);
      isFetching.current = false;
      setHasAnalyzed(true);
    }
  }, [videoUrl, keywordContext]);

  return {
    videoUrl,
    setVideoUrl,
    keywordContext,
    setKeywordContext,
    analyze,
    report,
    isLoading,
    error,
    hasAnalyzed,
  };
}
