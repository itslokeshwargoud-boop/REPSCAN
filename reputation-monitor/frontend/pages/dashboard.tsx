import { useState } from "react";
import Head from "next/head";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useKeyword } from "@/contexts/KeywordContext";
import Sidebar from "@/components/Sidebar";
import type { YouTubeVideo } from "./api/youtube";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const CHART_COLORS = ["#EF4444", "#F97316", "#FBBF24", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6366F1"];

const DARK_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #334155",
  backgroundColor: "#0f172a",
  fontSize: 12,
  color: "#e2e8f0",
};

/* ─── KPI Card ────────────────────────────────────────────────────────────── */

function KPICard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

/* ─── Video Card ──────────────────────────────────────────────────────────── */

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <a
      href={video.proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl border border-slate-800/60 bg-[#0F172A]/60 hover:border-rose-500/30 transition-all group"
    >
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt={video.title} className="w-24 h-16 object-cover rounded-lg shrink-0 bg-slate-800" />
      ) : (
        <div className="w-24 h-16 rounded-lg shrink-0 bg-slate-800 flex items-center justify-center">
          <span className="text-red-400 text-xl">▶</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
          {video.title}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">{video.channelTitle}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-slate-400">👁 {formatNumber(video.viewCount)}</span>
          <span className="text-[11px] text-slate-400">👍 {formatNumber(video.likeCount)}</span>
          <span className="text-[11px] text-slate-400">💬 {formatNumber(video.commentCount)}</span>
          <span className="text-[11px] text-slate-600">{timeAgo(video.publishedAt)}</span>
        </div>
      </div>
      <div className="shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DASHBOARD                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const shared = useKeyword();
  const {
    keyword,
    setKeyword,
    search,
    videos,
    kpis,
    channelBreakdown,
    trend,
    isLoading,
    error,
    hasSearched,
    refresh,
  } = useDashboardData(shared.activeKeyword);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    search();
    // Persist keyword to shared context
    shared.commitKeyword(keyword.trim());
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== keyword.trim());
      return [keyword.trim(), ...filtered].slice(0, 5);
    });
  }

  function handleQuickSearch(kw: string) {
    setKeyword(kw);
  }

  const channelPieData = channelBreakdown.slice(0, 6).map((ch, i) => ({
    name: ch.channel,
    value: ch.totalViews,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <>
      <Head>
        <title>REPSCAN — YouTube Intelligence Dashboard</title>
        <meta name="description" content="Real-time YouTube analytics and reputation monitoring" />
      </Head>

      <div className="min-h-screen bg-[#030712] text-slate-200">
        <Sidebar />
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#030712]/80 backdrop-blur-sm ml-16">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #f97316)" }}
                >
                  RS
                </span>
                <div className="leading-tight hidden sm:block">
                  <p className="text-sm font-black tracking-tighter text-slate-100">REPSCAN</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">YouTube Intelligence</p>
                </div>
              </div>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-xl flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword to search YouTube…"
                  className="flex-1 h-10 rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-rose-500/50 focus:shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                />
                <button
                  type="submit"
                  disabled={!keyword.trim() || isLoading}
                  className="h-10 rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Searching…" : "Search"}
                </button>
              </form>

              {/* Refresh */}
              {hasSearched && (
                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="h-10 rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
                >
                  ↻ Refresh
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ml-16">
          {/* ── RECENT SEARCHES ────────────────────────────────────────────── */}
          {recentSearches.length > 0 && !hasSearched && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Recent:</span>
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickSearch(s)}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ── EMPTY STATE ───────────────────────────────────────────────── */}
          {!hasSearched && !isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-xl font-bold text-slate-200 mb-2">Search YouTube</h2>
              <p className="text-sm text-slate-500 max-w-md">
                Enter a keyword above to fetch real-time YouTube data. You&apos;ll see video results, KPIs, trend charts, and channel breakdowns.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Next.js tutorial", "machine learning", "web development"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setKeyword(suggestion); }}
                    className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:border-rose-500/30 transition"
                  >
                    Try &quot;{suggestion}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LOADING STATE ─────────────────────────────────────────────── */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                <p className="text-sm text-slate-400">Fetching YouTube data…</p>
              </div>
            </div>
          )}

          {/* ── ERROR BANNER ──────────────────────────────────────────────── */}
          {error && hasSearched && !isLoading && (
            <div className="rounded-xl border border-orange-800/40 bg-orange-950/20 px-4 py-3 text-sm text-orange-400">
              ⚠️ {error}
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────────────────────── */}
          {hasSearched && !isLoading && (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard label="Videos Found" value={kpis.totalVideos} icon="📹" />
                <KPICard label="Total Views" value={formatNumber(kpis.totalViews)} icon="👁" />
                <KPICard label="Total Likes" value={formatNumber(kpis.totalLikes)} icon="👍" />
                <KPICard label="Total Comments" value={formatNumber(kpis.totalComments)} icon="💬" />
                <KPICard label="Avg Views" value={formatNumber(kpis.avgViewsPerVideo)} icon="📊" />
                <KPICard label="Engagement" value={`${kpis.engagementRate}%`} icon="🔥" />
              </div>

              {/* Charts Row — 2:1 split */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Trend Chart */}
                <div className="xl:col-span-2 rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                    📈 Trend — Views &amp; Likes by Month
                  </h3>
                  {trend.length > 0 ? (
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="likeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} fill="url(#viewGrad)" name="Views" />
                          <Area type="monotone" dataKey="likes" stroke="#10B981" strokeWidth={2} fill="url(#likeGrad)" name="Likes" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[240px] text-sm text-slate-500">
                      No trend data available
                    </div>
                  )}
                </div>

                {/* Channel Breakdown Donut */}
                <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                    📺 Channel Breakdown
                  </h3>
                  {channelPieData.length > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-[160px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                            <Pie
                              data={channelPieData}
                              dataKey="value"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={3}
                              strokeWidth={0}
                            >
                              {channelPieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1.5 w-full">
                        {channelPieData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-400 truncate flex-1">{item.name}</span>
                            <span className="font-semibold tabular-nums text-slate-300">{formatNumber(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[240px] text-sm text-slate-500">
                      No channel data
                    </div>
                  )}
                </div>
              </div>

              {/* Video Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    🎬 Video Results — Every item links to YouTube
                  </h3>
                  <span className="text-xs text-slate-600">{videos.length} videos</span>
                </div>
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-12 text-center">
                    <p className="text-sm text-slate-500">No videos found for this keyword</p>
                  </div>
                )}
              </div>

              {/* Video Table */}
              {videos.length > 0 && (
                <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-800/60">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      📋 Detailed Video Data
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/60">
                          {["Title", "Channel", "Views", "Likes", "Comments", "Published", "Proof"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {videos.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 max-w-[260px]">
                              <p className="text-slate-200 font-medium truncate">{v.title}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{v.channelTitle}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-300">{formatNumber(v.viewCount)}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-300">{formatNumber(v.likeCount)}</td>
                            <td className="px-4 py-3 tabular-nums text-slate-300">{formatNumber(v.commentCount)}</td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{timeAgo(v.publishedAt)}</td>
                            <td className="px-4 py-3">
                              <a
                                href={v.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                              >
                                Open →
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
