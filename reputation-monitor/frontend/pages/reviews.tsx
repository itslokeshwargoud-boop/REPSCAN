/**
 * Reviews page — lists all ingested reviews with sentiment pills,
 * star ratings, and AI reply generation.
 */

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  useReviews,
  useSentimentBatch,
  useGenerateResponse,
  useIngestReviews,
  type Review,
} from "@/hooks/useReputationAI";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= rating ? "text-amber-400" : "text-slate-700"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function SentimentPill({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-slate-400">
        pending
      </span>
    );
  }
  const colors = {
    positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    neutral: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  const emoji = { positive: "🟢", neutral: "🟡", negative: "🔴" };
  const cls = colors[sentiment as keyof typeof colors] || colors.neutral;
  const icon = emoji[sentiment as keyof typeof emoji] || "🟡";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {icon} {sentiment}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// AI Reply Modal
// ---------------------------------------------------------------------------

function AIReplyModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const { generate, isGenerating, reply, error, reset } = useGenerateResponse();
  const [editedReply, setEditedReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("professional and warm");

  useEffect(() => {
    reset();
    generate({
      reviewText: review.text,
      sentiment: review.sentiment || "neutral",
      tone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reply) setEditedReply(reply);
  }, [reply]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editedReply).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [editedReply]);

  const handleRegenerate = useCallback(() => {
    reset();
    generate({
      reviewText: review.text,
      sentiment: review.sentiment || "neutral",
      tone,
    });
  }, [generate, reset, review, tone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-700/60 bg-[#0F172A] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">
            AI Reply Generator
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Original review */}
        <div className="mb-4 rounded-lg bg-slate-800/50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-500">
            Original Review by {review.author}
          </p>
          <p className="text-sm text-slate-300 line-clamp-3">{review.text}</p>
        </div>

        {/* Tone selector */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-blue focus:outline-none"
          >
            <option value="professional and warm">Professional & Warm</option>
            <option value="polite and concise">Polite & Concise</option>
            <option value="friendly and casual">Friendly & Casual</option>
            <option value="formal and corporate">Formal & Corporate</option>
          </select>
        </div>

        {/* Generated reply */}
        {isGenerating && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <span className="animate-spin">⏳</span> Generating AI reply…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-400">
            {error instanceof Error ? error.message : "Failed to generate reply"}
          </div>
        )}

        {editedReply && (
          <>
            <textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={5}
              className="mb-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-blue focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ingest Modal
// ---------------------------------------------------------------------------

function IngestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { ingest, isIngesting, result, error, reset } = useIngestReviews();
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const handleIngest = useCallback(() => {
    setParseError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const reviews = Array.isArray(parsed) ? parsed : [parsed];
      ingest(reviews);
    } catch {
      setParseError("Invalid JSON. Please provide a valid JSON array of reviews.");
    }
  }, [jsonInput, ingest]);

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        reset();
        onSuccess();
        onClose();
      }, 1500);
    }
  }, [result, onClose, onSuccess, reset]);

  const sampleJson = JSON.stringify(
    [
      {
        id: "rev-001",
        platform: "google",
        author: "Jane Doe",
        rating: 5,
        text: "Excellent service! Would recommend to anyone.",
        createdAt: new Date().toISOString(),
      },
    ],
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-700/60 bg-[#0F172A] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">
            Import Reviews
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-400">
          Paste a JSON array of reviews to import. Each review needs:{" "}
          <code className="text-xs text-brand-blue">
            id, author, rating (1-5), text, createdAt
          </code>
        </p>

        <div className="mb-3">
          <button
            onClick={() => setJsonInput(sampleJson)}
            className="text-xs text-brand-blue hover:underline"
          >
            Load sample →
          </button>
        </div>

        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={10}
          placeholder={sampleJson}
          className="mb-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-200 focus:border-brand-blue focus:outline-none"
        />

        {parseError && (
          <p className="mb-3 text-sm text-rose-400">{parseError}</p>
        )}
        {error && (
          <p className="mb-3 text-sm text-rose-400">
            {error instanceof Error ? error.message : "Ingestion failed"}
          </p>
        )}
        {result && (
          <p className="mb-3 text-sm text-emerald-400">
            ✓ Imported {result.ingested} reviews ({result.duplicates} duplicates
            skipped)
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleIngest}
            disabled={isIngesting || !jsonInput.trim()}
            className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isIngesting ? "Importing…" : "Import Reviews"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Reviews Page
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  const { data: reviews, isLoading, error, refetch } = useReviews();
  const { analyze, isAnalyzing } = useSentimentBatch();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  // Auto-analyze reviews that don't have sentiment yet
  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
    const unanalyzed = reviews.filter((r) => !r.sentiment);
    if (unanalyzed.length > 0) {
      analyze(unanalyzed.map((r) => ({ id: r.id, text: r.text })));
    }
  }, [reviews, analyze]);

  const hasReviews = reviews && reviews.length > 0;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="ml-16 flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Reviews</h1>
            <p className="mt-1 text-sm text-slate-500">
              {hasReviews
                ? `${reviews.length} reviews imported`
                : "Import reviews to get started"}
            </p>
          </div>
          <div className="flex gap-2">
            {hasReviews && (
              <button
                onClick={() =>
                  analyze(
                    reviews
                      .filter((r) => !r.sentiment)
                      .map((r) => ({ id: r.id, text: r.text }))
                  )
                }
                disabled={isAnalyzing}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing…" : "Analyze Sentiment"}
              </button>
            )}
            <button
              onClick={() => setShowIngest(true)}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              + Import Reviews
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-500 animate-pulse">
              Loading reviews…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
            Failed to load reviews. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !hasReviews && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20">
            <div className="mb-4 text-5xl">📝</div>
            <h2 className="mb-2 text-lg font-semibold text-slate-200">
              No reviews yet
            </h2>
            <p className="mb-6 max-w-md text-center text-sm text-slate-500">
              Import your Google reviews, Yelp reviews, or any other review
              source to start tracking your reputation. Click &quot;Import
              Reviews&quot; to begin.
            </p>
            <button
              onClick={() => setShowIngest(true)}
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              Import Your First Reviews
            </button>
          </div>
        )}

        {/* Reviews list */}
        {hasReviews && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-4 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-200">
                        {review.author}
                      </span>
                      <StarRating rating={review.rating} />
                      <SentimentPill sentiment={review.sentiment} />
                      <span className="text-xs text-slate-600">
                        {formatDate(review.createdAt)}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase">
                        {review.platform}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                  >
                    Generate AI Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {selectedReview && (
          <AIReplyModal
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}
        {showIngest && (
          <IngestModal
            onClose={() => setShowIngest(false)}
            onSuccess={() => refetch()}
          />
        )}
      </main>
    </div>
  );
}
