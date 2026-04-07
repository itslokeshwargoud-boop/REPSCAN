/**
 * Frontend hooks for the Reputation AI MVP.
 *
 * Uses @tanstack/react-query for caching, staleTime, and background refresh.
 * Does NOT spam APIs — uses smart staleTime and controlled refetch.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  platform: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentimentScore: number | null;
}

export interface ReputationScore {
  score: number;
  breakdown: { positive: number; neutral: number; negative: number };
  total: number;
  windowDays: number;
  trend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
}

export interface AlertItem {
  message: string;
  severity: "high" | "medium" | "low";
  createdAt: string;
  negativeCount: number;
}

export interface SentimentResult {
  id: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
}

// ---------------------------------------------------------------------------
// Fetch helpers (never throw — return typed ApiResponse)
// ---------------------------------------------------------------------------

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    return json as ApiResponse<T>;
  } catch (err) {
    return {
      success: false,
      data: null as unknown as T,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ---------------------------------------------------------------------------
// useReviews
// ---------------------------------------------------------------------------

export function useReviews() {
  return useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await apiFetch<Review[]>("/api/v1/reviews");
      if (!res.success) throw new Error(res.error || "Failed to fetch reviews");
      return res.data;
    },
    staleTime: 30_000,       // 30s before considered stale
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// useReputationScore
// ---------------------------------------------------------------------------

export function useReputationScore() {
  return useQuery<ReputationScore>({
    queryKey: ["reputation-score"],
    queryFn: async () => {
      const res = await apiFetch<ReputationScore>("/api/v1/reputation-score");
      if (!res.success) throw new Error(res.error || "Failed to fetch score");
      return res.data;
    },
    staleTime: 60_000,       // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// useAlerts
// ---------------------------------------------------------------------------

export function useAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await apiFetch<AlertItem[]>("/api/v1/alerts");
      if (!res.success) throw new Error(res.error || "Failed to fetch alerts");
      return res.data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// useSentimentBatch — smart batch analysis, avoids re-running for cached items
// ---------------------------------------------------------------------------

export function useSentimentBatch() {
  const queryClient = useQueryClient();
  const analyzedIds = useRef(new Set<string>());

  const mutation = useMutation({
    mutationFn: async (reviews: Array<{ id: string; text: string }>) => {
      // Filter out reviews we've already analyzed in this session
      const toAnalyze = reviews.filter((r) => !analyzedIds.current.has(r.id));
      if (toAnalyze.length === 0) return [];

      const res = await apiFetch<SentimentResult[]>("/api/v1/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: toAnalyze }),
      });

      if (!res.success) throw new Error(res.error || "Sentiment analysis failed");

      // Mark as analyzed
      for (const r of toAnalyze) {
        analyzedIds.current.add(r.id);
      }

      return res.data;
    },
    onSuccess: () => {
      // Invalidate reviews query so sentiment pills update
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reputation-score"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const analyze = useCallback(
    (reviews: Array<{ id: string; text: string }>) => {
      mutation.mutate(reviews);
    },
    [mutation]
  );

  return {
    analyze,
    isAnalyzing: mutation.isPending,
    error: mutation.error,
    results: mutation.data,
  };
}

// ---------------------------------------------------------------------------
// useGenerateResponse — on-demand AI reply generation
// ---------------------------------------------------------------------------

export function useGenerateResponse() {
  const mutation = useMutation({
    mutationFn: async (params: {
      reviewText: string;
      sentiment: string;
      tone?: string;
    }) => {
      const res = await apiFetch<{ reply: string }>("/api/v1/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.success) throw new Error(res.error || "Failed to generate response");
      return res.data;
    },
  });

  return {
    generate: mutation.mutate,
    isGenerating: mutation.isPending,
    reply: mutation.data?.reply ?? null,
    error: mutation.error,
    reset: mutation.reset,
  };
}

// ---------------------------------------------------------------------------
// useIngestReviews — ingestion mutation
// ---------------------------------------------------------------------------

export function useIngestReviews() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      reviews: Array<{
        id: string;
        platform?: string;
        author: string;
        rating: number;
        text: string;
        createdAt: string;
      }>
    ) => {
      const res = await apiFetch<{ ingested: number; duplicates: number; total: number }>(
        "/api/v1/reviews/ingest",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews }),
        }
      );
      if (!res.success) throw new Error(res.error || "Ingestion failed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  return {
    ingest: mutation.mutate,
    isIngesting: mutation.isPending,
    result: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}
