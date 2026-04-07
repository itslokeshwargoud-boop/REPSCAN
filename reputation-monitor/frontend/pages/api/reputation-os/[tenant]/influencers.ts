/**
 * /api/reputation-os/[tenant]/influencers — Returns influencer breakdown for a tenant.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchInfluencers, type Influencer } from "@/lib/reputationOs";

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

interface InfluencerPayload {
  supporters: Influencer[];
  attackers: Influencer[];
  neutrals: Influencer[];
}

type ResponsePayload = InfluencerPayload | { error: string };

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
    const data = await fetchInfluencers(tenant);
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
