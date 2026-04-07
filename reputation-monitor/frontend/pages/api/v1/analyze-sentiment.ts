/**
 * POST /api/v1/analyze-sentiment
 *
 * Batch sentiment analysis using Hugging Face Inference API.
 * Model: tabularisai/multilingual-sentiment-analysis
 *
 * Features:
 * - Batch input support (array of reviews)
 * - In-memory cache keyed by hash of review text
 * - Rate limit protection (sequential calls, delay between batches)
 * - Safe fallback on HF failure
 */

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { assertMethod, sendSuccess, sendError, log } from "@/lib/apiHelpers";
import { upsertSentimentBatch } from "@/lib/db/reviews";

// ---------------------------------------------------------------------------
// In-memory cache: text hash → sentiment result
// NOTE: This cache lives in the Node.js process memory. It will be cleared on
// server restart or cold start in serverless environments. Sentiment results
// are also persisted to SQLite for durability. For high-traffic production use,
// consider adding Redis as a shared cache layer.
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 10_000;
const sentimentCache = new Map<string, { sentiment: string; score: number }>();

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// HF Inference API
// ---------------------------------------------------------------------------

const HF_MODEL = "tabularisai/multilingual-sentiment-analysis";
const HF_BATCH_SIZE = 10; // max texts per HF call

interface HFResult {
  label: string;
  score: number;
}

function normalizeLabel(label: string): "positive" | "neutral" | "negative" {
  const lower = label.toLowerCase();
  if (lower.includes("positive") || lower === "5 stars" || lower === "4 stars") return "positive";
  if (lower.includes("negative") || lower === "1 star" || lower === "2 stars") return "negative";
  return "neutral";
}

async function callHuggingFace(
  texts: string[],
  apiKey: string
): Promise<Array<{ sentiment: "positive" | "neutral" | "negative"; score: number } | null>> {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texts }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown");
      log("warn", "HF API error", { status: response.status, body: errText.slice(0, 200) });
      return texts.map(() => null);
    }

    const data = await response.json();

    // HF returns array of arrays of label/score objects (one per input)
    // Each element is an array of { label, score } sorted by score descending
    if (!Array.isArray(data)) {
      return texts.map(() => null);
    }

    return data.map((item: HFResult[] | HFResult) => {
      try {
        // Single result or array of results
        const top = Array.isArray(item) ? item[0] : item;
        if (!top || !top.label) return null;
        return {
          sentiment: normalizeLabel(top.label),
          score: Math.round((top.score ?? 0) * 100) / 100,
        };
      } catch {
        return null;
      }
    });
  } catch (err) {
    log("error", "HF API call failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return texts.map(() => null);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

interface SentimentInput {
  id: string;
  text: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertMethod(req, res, "POST")) return;

  try {
    const { reviews } = req.body as { reviews?: SentimentInput[] };

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return sendError(res, "reviews must be a non-empty array of { id, text }", 400);
    }

    if (reviews.length > 100) {
      return sendError(res, "Maximum 100 reviews per batch", 400);
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return sendError(res, "Sentiment analysis service not configured", 503);
    }

    const results: Array<{ id: string; sentiment: string; score: number }> = [];
    const uncached: Array<{ index: number; id: string; text: string }> = [];

    // Check cache first
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      if (!review.id || !review.text) continue;

      const hash = hashText(review.text);
      const cached = sentimentCache.get(hash);
      if (cached) {
        results.push({ id: review.id, sentiment: cached.sentiment, score: cached.score });
      } else {
        uncached.push({ index: i, id: review.id, text: review.text });
      }
    }

    // Process uncached items in batches
    if (uncached.length > 0) {
      for (let i = 0; i < uncached.length; i += HF_BATCH_SIZE) {
        const batch = uncached.slice(i, i + HF_BATCH_SIZE);
        const texts = batch.map((r) => r.text.slice(0, 512)); // HF input limit
        const hfResults = await callHuggingFace(texts, apiKey);

        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const hfResult = hfResults[j];

          if (hfResult) {
            // Cache the result
            const hash = hashText(item.text);
            sentimentCache.set(hash, hfResult);

            // Evict oldest entries if cache too large
            if (sentimentCache.size > MAX_CACHE_SIZE) {
              const firstKey = sentimentCache.keys().next().value;
              if (firstKey) sentimentCache.delete(firstKey);
            }

            results.push({ id: item.id, sentiment: hfResult.sentiment, score: hfResult.score });
          } else {
            // Fallback: unable to determine
            results.push({ id: item.id, sentiment: "neutral", score: 0 });
          }
        }

        // Rate limit protection: small delay between batches
        if (i + HF_BATCH_SIZE < uncached.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    // Persist sentiment results to DB
    try {
      const dbResults = results.map((r) => ({
        reviewId: r.id,
        sentiment: r.sentiment as "positive" | "neutral" | "negative",
        score: r.score,
      }));
      upsertSentimentBatch(dbResults);
    } catch (dbErr) {
      log("warn", "Failed to persist sentiment results", {
        error: dbErr instanceof Error ? dbErr.message : "Unknown",
      });
      // Non-fatal: still return results to client
    }

    sendSuccess(res, results);
  } catch (err) {
    log("error", "Sentiment analysis failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    sendError(res, "Sentiment analysis failed", 500);
  }
}
