// Mock API layer — simulates YouTube + Twitter API with rate-limit safety
// NEVER crashes. Returns partial data with status flags on limit exceeded.
// Max tweets: 100 (hard cap). Max retries: 3.

import { getClientData, ClientId, ClientData } from "./mockData";

const TWEET_HARD_CAP = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 300;

export interface ApiResponse<T> {
  data: T | null;
  status: "ok" | "partial_data" | "error";
  reason?: "rate_limit" | "api_error" | "timeout";
  retriesUsed: number;
  tweetsFetched?: number;
  youtubeFetched?: number;
}

// Simulated tweet fetch with hard cap enforcement
async function fetchTweets(clientId: ClientId, requested: number): Promise<{ count: number; hitLimit: boolean }> {
  const safe = Math.min(requested, TWEET_HARD_CAP);
  // Simulate occasional rate-limit hit for KIMS client
  const hitLimit = clientId === "kims" && requested > 95;
  return { count: safe, hitLimit };
}

// Simulated YouTube fetch
async function fetchYouTube(count: number): Promise<{ count: number }> {
  return { count };
}

// Retry wrapper — max 3 retries, never throws
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<{ result: T | null; retriesUsed: number; error?: string }> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      return { result, retriesUsed: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  return { result: null, retriesUsed: retries, error: lastError };
}

// Main API call — NEVER crashes, always returns data
export async function fetchClientDashboard(
  clientId: ClientId,
  tweetCount = 50,
  youtubeCount = 30
): Promise<ApiResponse<ClientData>> {
  const { result: tweets, retriesUsed } = await withRetry(
    () => fetchTweets(clientId, tweetCount)
  );

  const { result: youtube } = await withRetry(
    () => fetchYouTube(youtubeCount)
  );

  const clientData = getClientData(clientId);

  // Determine status
  const hitTweetLimit = tweets?.hitLimit ?? false;
  const storedStatus = clientData.apiStatus.status;

  let status: ApiResponse<ClientData>["status"] = "ok";
  let reason: ApiResponse<ClientData>["reason"];

  if (hitTweetLimit || storedStatus === "partial_data") {
    status = "partial_data";
    reason = "rate_limit";
  }

  // NEVER return null data — always fall back to mock
  return {
    data: {
      ...clientData,
      apiStatus: {
        ...clientData.apiStatus,
        status,
        reason,
        tweetsFetched: Math.min(tweets?.count ?? 0, TWEET_HARD_CAP),
        youtubeFetched: youtube?.count ?? 0,
      },
    },
    status,
    reason,
    retriesUsed,
    tweetsFetched: Math.min(tweets?.count ?? 0, TWEET_HARD_CAP),
    youtubeFetched: youtube?.count ?? 0,
  };
}

export { TWEET_HARD_CAP, MAX_RETRIES };
