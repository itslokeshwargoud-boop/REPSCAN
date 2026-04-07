import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar";
import { useKeyword } from "@/contexts/KeywordContext";
import LiveFeed from "@/components/brand/LiveFeed";
import type { YouTubeVideo } from "./api/youtube";

export default function BrandIntelligencePage() {
  const router = useRouter();
  const shared = useKeyword();
  const [keyword, setKeyword] = useState(shared.activeKeyword ?? "");
  const [activeKeyword, setActiveKeyword] = useState(shared.activeKeyword ?? "");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick up keyword from URL query param
  useEffect(() => {
    if (router.query.q && typeof router.query.q === "string") {
      setKeyword(router.query.q);
      setActiveKeyword(router.query.q);
    }
  }, [router.query.q]);

  const fetchData = useCallback(async (kw: string) => {
    if (!kw.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrics?keyword=${encodeURIComponent(kw)}`);
      const data = await res.json();
      setVideos(data.videos ?? []);
      if (data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeKeyword.trim()) {
      fetchData(activeKeyword);
    }
  }, [activeKeyword, fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setActiveKeyword(keyword.trim());
    // Persist to shared context
    shared.commitKeyword(keyword.trim());
    // Update URL without full navigation
    router.replace(`/brand-intelligence?q=${encodeURIComponent(keyword.trim())}`, undefined, { shallow: true });
  }

  return (
    <>
      <Head>
        <title>YouTube Live Feed — REPSCAN</title>
        <meta name="description" content="Real-time YouTube content feed" />
      </Head>

      <div className="flex min-h-screen bg-[#030712]">
        <Sidebar />

        <div className="flex-1 ml-16 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-700/50 bg-[#030712]/90 backdrop-blur px-8">
            <h1 className="text-lg font-bold text-white shrink-0">YouTube Live Feed</h1>

            <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-xl">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search YouTube…"
                className="flex-1 h-9 rounded-lg bg-slate-800 border border-slate-600/50 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
              <button
                type="submit"
                disabled={!keyword.trim() || loading}
                className="h-9 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "…" : "Search"}
              </button>
            </form>
          </header>

          <main className="flex-1 p-6">
            {/* Error */}
            {error && (
              <div className="mb-4 rounded-xl border border-orange-800/40 bg-orange-950/20 px-4 py-3 text-sm text-orange-400">
                ⚠️ {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  <p className="text-sm text-slate-400">Fetching YouTube data…</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !activeKeyword && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">📺</div>
                <p className="text-slate-400 text-sm font-semibold">Enter a keyword to see YouTube results</p>
              </div>
            )}

            {/* Results */}
            {!loading && activeKeyword && (
              <LiveFeed
                videos={videos}
                clientName={activeKeyword}
                youtubeStatus={videos.length > 0 ? "ok" : "error"}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
