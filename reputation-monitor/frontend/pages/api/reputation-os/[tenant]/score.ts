/**
 * /api/reputation-os/[tenant]/score — Returns reputation score for a tenant.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchReputationScore, type ReputationScore } from "@/lib/reputationOs";

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

  const { tenant } = req.query;
  if (typeof tenant !== "string" || !tenant.trim()) {
    return res.status(400).json({ error: "Missing or invalid tenant parameter" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  try {
    const data = await fetchReputationScore();
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
