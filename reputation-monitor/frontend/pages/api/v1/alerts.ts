/**
 * GET /api/v1/alerts
 *
 * Returns alerts based on negative review spikes.
 * Triggers "high" alert if >= 3 negative reviews in the last 24 hours.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, sendSuccess, sendError, log } from "@/lib/apiHelpers";
import { getSentimentCounts } from "@/lib/db/reviews";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertMethod(req, res, "GET")) return;

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const startDate = twentyFourHoursAgo.toISOString();
    const endDate = now.toISOString();

    const counts = getSentimentCounts(startDate, endDate);

    const alerts: Array<{
      message: string;
      severity: "high" | "medium" | "low";
      createdAt: string;
      negativeCount: number;
    }> = [];

    if (counts.negative >= 3) {
      alerts.push({
        message: `⚠️ ${counts.negative} negative reviews in last 24 hours`,
        severity: "high",
        createdAt: now.toISOString(),
        negativeCount: counts.negative,
      });
    } else if (counts.negative >= 1) {
      alerts.push({
        message: `${counts.negative} negative review${counts.negative > 1 ? "s" : ""} in last 24 hours`,
        severity: "medium",
        createdAt: now.toISOString(),
        negativeCount: counts.negative,
      });
    }

    if (counts.total === 0) {
      alerts.push({
        message: "No reviews with sentiment analysis in the last 24 hours",
        severity: "low",
        createdAt: now.toISOString(),
        negativeCount: 0,
      });
    }

    sendSuccess(res, alerts);
  } catch (err) {
    log("error", "Failed to compute alerts", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    sendError(res, "Failed to compute alerts", 500);
  }
}
