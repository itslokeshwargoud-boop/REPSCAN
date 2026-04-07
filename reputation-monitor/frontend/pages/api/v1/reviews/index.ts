/**
 * GET /api/v1/reviews
 *
 * Returns all persisted reviews with optional sentiment data.
 * If no reviews exist, returns empty array (UI shows onboarding state).
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, sendSuccess, sendError, log } from "@/lib/apiHelpers";
import { getAllReviews } from "@/lib/db/reviews";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertMethod(req, res, "GET")) return;

  try {
    const reviews = getAllReviews();

    const normalized = reviews.map((r) => ({
      id: r.id,
      platform: r.platform,
      author: r.author,
      rating: r.rating,
      text: r.text,
      createdAt: r.created_at,
      sentiment: r.sentiment ?? null,
      sentimentScore: r.sentiment_score ?? null,
    }));

    sendSuccess(res, normalized);
  } catch (err) {
    log("error", "Failed to fetch reviews", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    sendError(res, "Failed to fetch reviews", 500);
  }
}
