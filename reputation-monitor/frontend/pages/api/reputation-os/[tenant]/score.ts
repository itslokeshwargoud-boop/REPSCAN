/**
 * /api/reputation-os/[tenant]/score — Single-tenant — always returns Vijay Deverakonda data.
 * Now powered by the unified Processing Engine (real Talk + Feed data).
 * Falls back to mock data if processing fails.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchReputationScore, type ReputationScore } from "@/lib/reputationOs";
import { fetchAndProcess } from "@/lib/dataIngestion";

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

type ResponsePayload = ReputationScore | { error: string };

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponsePayload>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  try {
    const processed = await fetchAndProcess("Vijay Deverakonda");
    return res.status(200).json(processed.score);
  } catch {
    // Fallback to mock data
    try {
      const data = await fetchReputationScore();
      return res.status(200).json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  }
}
