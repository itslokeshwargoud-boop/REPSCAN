/**
 * /api/reputation-os/[tenant]/alerts — Returns alerts for a tenant.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchAlerts, type Alert } from "@/lib/reputationOs";

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

type ResponsePayload = Alert[] | { error: string };

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
    const data = await fetchAlerts();
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
