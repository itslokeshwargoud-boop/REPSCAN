/**
 * MoodMap API client — fetches mood analysis from /api/mood-map.
 * Never throws. All errors surface as partial data with status flags.
 */

import type { MoodMapReport } from "@/lib/moodMap";
import type { MoodMapApiResponse } from "@/pages/api/mood-map";

// Re-export for convenience
export type { MoodMapReport, MoodMapApiResponse };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MoodMapDataResponse {
  success: boolean;
  report: MoodMapReport | null;
  error?: string;
}

export interface FetchMoodMapParams {
  videoUrl: string;
  keywordContext?: string;
}

// ---------------------------------------------------------------------------
// Fetch — never throws
// ---------------------------------------------------------------------------

export async function fetchMoodMap(
  params: FetchMoodMapParams
): Promise<MoodMapDataResponse> {
  if (!params.videoUrl.trim()) {
    return { success: false, report: null, error: "No video URL provided" };
  }

  try {
    const url = new URL("/api/mood-map", window.location.origin);
    url.searchParams.set("video_url", params.videoUrl);
    if (params.keywordContext) {
      url.searchParams.set("keyword_context", params.keywordContext);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        success: false,
        report: null,
        error: errData.error ?? `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as MoodMapApiResponse;

    if (!data.success || !data.data) {
      return {
        success: false,
        report: null,
        error: data.error ?? "Analysis failed",
      };
    }

    return {
      success: true,
      report: data.data,
    };
  } catch (err) {
    return {
      success: false,
      report: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
