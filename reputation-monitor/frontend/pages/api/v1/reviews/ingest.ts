/**
 * POST /api/v1/reviews/ingest
 *
 * Accepts real reviews payload, validates, sanitizes, deduplicates, and persists.
 * Accepts single review or batch of reviews.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { assertMethod, sendSuccess, sendError, sanitizeText, log } from "@/lib/apiHelpers";
import { upsertReviewsBatch } from "@/lib/db/reviews";

const ReviewSchema = z.object({
  id: z.string().min(1).max(256),
  platform: z.string().default("google"),
  author: z.string().min(1).max(256),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(10000),
  createdAt: z.string().min(1), // ISO date string
});

const IngestSchema = z.object({
  reviews: z.array(ReviewSchema).min(1).max(500),
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertMethod(req, res, "POST")) return;

  try {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return sendError(res, `Validation failed: ${issues.join("; ")}`, 400);
    }

    const sanitized = parsed.data.reviews.map((r) => ({
      id: r.id.trim(),
      platform: sanitizeText(r.platform, 50),
      author: sanitizeText(r.author, 256),
      rating: r.rating,
      text: sanitizeText(r.text, 5000),
      created_at: r.createdAt,
    }));

    const result = upsertReviewsBatch(sanitized);

    log("info", "Reviews ingested", {
      total: sanitized.length,
      inserted: result.inserted,
      duplicates: result.duplicates,
    });

    sendSuccess(res, {
      ingested: result.inserted,
      duplicates: result.duplicates,
      total: sanitized.length,
    });
  } catch (err) {
    log("error", "Failed to ingest reviews", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    sendError(res, "Failed to ingest reviews", 500);
  }
}
