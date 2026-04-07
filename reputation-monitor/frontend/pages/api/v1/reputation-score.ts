/**
 * GET /api/v1/reputation-score
 *
 * Computes reputation score from reviews in the last 30 days.
 * Score = percentage of positive reviews * 100.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, sendSuccess, sendError, log } from "@/lib/apiHelpers";
import { getSentimentCounts, getDailySentimentCounts } from "@/lib/db/reviews";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertMethod(req, res, "GET")) return;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const startDate = thirtyDaysAgo.toISOString();
    const endDate = now.toISOString();

    const counts = getSentimentCounts(startDate, endDate);

    // Score = % positive reviews * 100 (0-100 scale)
    const score =
      counts.total > 0
        ? Math.round((counts.positive / counts.total) * 100)
        : 0;

    // Also compute 7-day trend data for the dashboard chart
    const trendStart = sevenDaysAgo.toISOString();
    const trend = getDailySentimentCounts(trendStart, endDate);

    sendSuccess(res, {
      score,
      breakdown: {
        positive: counts.positive,
        neutral: counts.neutral,
        negative: counts.negative,
      },
      total: counts.total,
      windowDays: 30,
      trend,
    });
  } catch (err) {
    log("error", "Failed to compute reputation score", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    sendError(res, "Failed to compute reputation score", 500);
  }
}
