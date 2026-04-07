import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar";
import { useTalkData } from "@/hooks/useTalkData";
import type { TalkItem } from "@/lib/talkApi";
import type { SentimentLabel } from "@/lib/sentiment";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function sentimentColor(s: SentimentLabel): string {
  switch (s) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-red-400";
    case "neutral":
      return "text-slate-400";
  }
}

function sentimentBg(s: SentimentLabel): string {
  switch (s) {
    case "positive":
      return "bg-emerald-500/15 border-emerald-500/30";
    case "negative":
      return "bg-red-500/15 border-red-500/30";
    case "neutral":
      return "bg-slate-500/15 border-slate-500/30";
  }
}

function sentimentIcon(s: SentimentLabel): string {
  switch (s) {
    case "positive":
      return "👍";
    case "negative":
      return "👎";
    case "neutral":
      return "😐";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─── Sentiment Summary Cards ─────────────────────────────────────────────── */

function SentimentSummary({
  counts,
  total,
  activeFilter,
  onFilter,
}: {
  counts: { positive: number; negative: number; neutral: number };
  total: number;
  activeFilter: SentimentLabel | null;
  onFilter: (s: SentimentLabel | null) => void;
}) {
  const cards: Array<{ label: SentimentLabel; count: number; emoji: string; color: string; bgHover: string }> = [
    { label: "positive", count: counts.positive, emoji: "👍", color: "text-emerald-400", bgHover: "hover:bg-emerald-500/10" },
    { label: "neutral", count: counts.neutral, emoji: "😐", color: "text-slate-400", bgHover: "hover:bg-slate-500/10" },
    { label: "negative", count: counts.negative, emoji: "👎", color: "text-red-400", bgHover: "hover:bg-red-500/10" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => {
        const isActive = activeFilter === card.label;
        return (
          <button
            key={card.label}
            onClick={() => onFilter(isActive ? null : card.label)}
            className={`glass-card rounded-xl p-4 text-left transition-all duration-200 ${card.bgHover} ${
              isActive ? "ring-1 ring-rose-500/50 bg-rose-500/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{card.emoji}</span>
              <span className={`text-xs font-medium uppercase tracking-wider ${card.color}`}>
                {capitalize(card.label)}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{card.count.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">
              {total > 0 ? `${((card.count / total) * 100).toFixed(1)}%` : "0%"} of total
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Talk Item Card ──────────────────────────────────────────────────────── */

function TalkCard({ item }: { item: TalkItem }) {
  return (
    <div className="glass-card rounded-xl p-4 hover:border-slate-600/60 transition-all duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Author avatar placeholder */}
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-semibold flex-shrink-0">
            {item.author ? item.author.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">
              {item.author || "Anonymous"}
            </div>
            <div className="text-xs text-slate-500">{timeAgo(item.publishedAt)}</div>
          </div>
        </div>

        {/* Sentiment badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sentimentBg(
            item.sentiment
          )} ${sentimentColor(item.sentiment)}`}
        >
          {sentimentIcon(item.sentiment)} {capitalize(item.sentiment)}
        </span>
      </div>

      {/* Text content */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap break-words">
        {item.text}
      </p>

      {/* Footer: video info + proof link */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div className="text-xs text-slate-500 truncate flex-1" title={item.videoTitle}>
          <span className="text-slate-600">on</span>{" "}
          <span className="text-slate-400">{item.videoTitle || "Unknown video"}</span>
          {item.channelTitle && (
            <>
              {" "}
              <span className="text-slate-600">by</span>{" "}
              <span className="text-slate-400">{item.channelTitle}</span>
            </>
          )}
        </div>
        <a
          href={item.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Proof
        </a>
      </div>
    </div>
  );
}

/* ─── Pagination ──────────────────────────────────────────────────────────── */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-600">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              p === page
                ? "bg-rose-500/20 text-rose-400 font-semibold"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

/* ─── Loading Spinner ─────────────────────────────────────────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-rose-500 animate-spin" />
      <p className="text-sm text-slate-500">Loading talk items…</p>
      <p className="text-xs text-slate-600">
        Fetching and analyzing sentiment across all videos. This may take a moment for the first load.
      </p>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */

function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">💬</div>
        <h3 className="text-lg font-semibold text-slate-300">Discover what people are saying</h3>
        <p className="text-sm text-slate-500 text-center max-w-md">
          Enter a keyword above to aggregate talk items from YouTube videos and analyze their
          sentiment.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl">🔇</div>
      <h3 className="text-lg font-semibold text-slate-300">No talk items found</h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Try a different keyword or adjust your filters.
      </p>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function TalkPage() {
  const router = useRouter();
  const talk = useTalkData();

  // Pick up keyword from URL query param
  useEffect(() => {
    if (router.query.q && typeof router.query.q === "string") {
      talk.setKeyword(router.query.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    talk.search();
  }

  function handleTextSearch(e: React.FormEvent) {
    e.preventDefault();
    talk.refresh();
  }

  const totalSentiment =
    talk.sentimentCounts.positive + talk.sentimentCounts.negative + talk.sentimentCounts.neutral;

  return (
    <>
      <Head>
        <title>Talk | REPSCAN</title>
      </Head>

      <div className="flex min-h-screen bg-[#030712]">
        <Sidebar />

        <main className="flex-1 ml-16">
          {/* ── Header ─────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#030712]/80 backdrop-blur-md">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h1 className="text-lg font-bold text-white tracking-tight">Talk</h1>
              </div>

              {/* Keyword search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={talk.keyword}
                    onChange={(e) => talk.setKeyword(e.target.value)}
                    placeholder="Search for a brand or topic…"
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-colors"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </form>

              {/* Refresh button */}
              {talk.hasSearched && (
                <button
                  onClick={talk.refresh}
                  disabled={talk.isLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-40"
                  title="Refresh"
                >
                  <svg
                    className={talk.isLoading ? "animate-spin" : ""}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          {/* ── Content ────────────────────────────────────────── */}
          <div className="px-6 py-6 max-w-6xl mx-auto">
            {/* Error banner */}
            {talk.error && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                ⚠️ {talk.error}
              </div>
            )}

            {talk.isLoading ? (
              <LoadingSpinner />
            ) : !talk.hasSearched ? (
              <EmptyState hasSearched={false} />
            ) : (
              <>
                {/* Sentiment summary */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      Sentiment Overview
                    </h2>
                    <span className="text-xs text-slate-500">
                      {talk.totalTalkItems.toLocaleString()} talk items total
                    </span>
                  </div>
                  <SentimentSummary
                    counts={talk.sentimentCounts}
                    total={totalSentiment}
                    activeFilter={talk.sentimentFilter}
                    onFilter={talk.setSentimentFilter}
                  />
                </div>

                {/* Filters bar */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Text search within results */}
                  <form onSubmit={handleTextSearch} className="flex-1 min-w-[200px] max-w-sm">
                    <input
                      type="text"
                      value={talk.searchQuery}
                      onChange={(e) => talk.setSearchQuery(e.target.value)}
                      placeholder="Search within talk items…"
                      className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-rose-500/50 focus:outline-none transition-colors"
                      onBlur={talk.refresh}
                    />
                  </form>

                  {/* Sort */}
                  <select
                    value={talk.sortOrder}
                    onChange={(e) => talk.setSortOrder(e.target.value as "newest" | "oldest")}
                    className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>

                  {/* Active filter indicator */}
                  {talk.sentimentFilter && (
                    <button
                      onClick={() => talk.setSentimentFilter(null)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      {sentimentIcon(talk.sentimentFilter)} {capitalize(talk.sentimentFilter)}
                      <span className="ml-1">×</span>
                    </button>
                  )}

                  {/* Results count */}
                  <span className="text-xs text-slate-500 ml-auto">
                    Showing {talk.items.length} of {talk.total.toLocaleString()} results
                  </span>
                </div>

                {/* Talk items list */}
                {talk.items.length === 0 ? (
                  <EmptyState hasSearched={true} />
                ) : (
                  <div className="grid gap-3">
                    {talk.items.map((item) => (
                      <TalkCard key={item.commentId} item={item} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <Pagination
                  page={talk.page}
                  totalPages={talk.totalPages}
                  onPageChange={talk.goToPage}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
