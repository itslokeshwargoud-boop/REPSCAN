/**
 * /api/reputation-os/[tenant]/velocity — Single-tenant — always returns Vijay Deverakonda data.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchVelocity, type VelocityReport } from "@/lib/reputationOs";

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

type ResponsePayload = VelocityReport | { error: string };

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
    const data = await fetchVelocity();
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
