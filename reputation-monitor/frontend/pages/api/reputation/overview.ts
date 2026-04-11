/**
 * /api/reputation/overview — Unified Overview endpoint.
 *
 * Returns aggregated reputation score + metrics derived from real Talk + Feed data
 * via the Processing Engine. No mock data.
 *
 * Query: ?keyword=Vijay+Deverakonda (optional, defaults to "Vijay Deverakonda")
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { fetchAndProcess } from "@/lib/dataIngestion";
import type { ReputationScore } from "@/lib/reputationOs";

const DEFAULT_KEYWORD = "Vijay Deverakonda";

type ResponsePayload = ReputationScore | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponsePayload>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60",
  );

  try {
    const keyword =
      typeof req.query.keyword === "string" && req.query.keyword.trim()
        ? req.query.keyword.trim()
        : DEFAULT_KEYWORD;

    const processed = await fetchAndProcess(keyword);
    return res.status(200).json(processed.score);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
