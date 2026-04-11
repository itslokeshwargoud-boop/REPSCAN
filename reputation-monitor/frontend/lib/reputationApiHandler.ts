/**
 * Shared helper for /api/reputation/* unified endpoints.
 *
 * Eliminates duplication of keyword extraction, cache headers,
 * error handling, and method validation across all reputation API routes.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchAndProcess } from "@/lib/dataIngestion";
import type { ProcessedIntelligence } from "@/lib/processingEngine";
import { DEFAULT_KEYWORD, CACHE_TTL_MS } from "@/lib/constants";

/** Cache-Control header value shared by all reputation endpoints. */
const CACHE_CONTROL = `public, s-maxage=${Math.round(CACHE_TTL_MS / 1000)}, stale-while-revalidate=${Math.round(CACHE_TTL_MS / 500)}`;

/**
 * Create a reputation API handler that extracts a specific feature
 * from the ProcessedIntelligence result.
 *
 * @param extract — Function that picks the desired data from ProcessedIntelligence
 */
export function createReputationHandler<T>(
  extract: (processed: ProcessedIntelligence) => T,
) {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<T | { error: string }>,
  ) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    res.setHeader("Cache-Control", CACHE_CONTROL);

    try {
      const keyword =
        typeof req.query.keyword === "string" && req.query.keyword.trim()
          ? req.query.keyword.trim()
          : DEFAULT_KEYWORD;

      const processed = await fetchAndProcess(keyword);
      return res.status(200).json(extract(processed));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  };
}
