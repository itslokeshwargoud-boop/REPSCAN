import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/dashboard/Card";
import DataTableShell from "@/components/dashboard/DataTableShell";
import MetricCard from "@/components/dashboard/MetricCard";
import PlatformBadges from "@/components/dashboard/PlatformBadges";
import SeverityPill, { type SeverityLevel } from "@/components/dashboard/SeverityPill";
import { useDashboardData } from "@/hooks/useDashboardData";
import { SUPPORTED_PLATFORMS, type Keyword } from "@/lib/api";

/* ─── Lucide-style inline SVG icons ───────────────────────────────────────── */
function IconActivity({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}
function IconShieldAlert({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  );
}
function IconZap({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}
function IconFlame({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

/* ─── Shared tooltip style for dark theme ─────────────────────────────────── */
const DARK_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #334155",
  backgroundColor: "#0f172a",
  fontSize: 12,
  color: "#e2e8f0",
};

/* ─── Helpers (data logic preserved) ──────────────────────────────────────── */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function scoreBarWidth(score: number): number {
  const pct = Math.round(((score + 100) / 200) * 100);
  return Math.min(100, Math.max(0, pct));
}

function percentageDelta(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function parseDateOrZero(iso: string): number {
  const timestamp = new Date(iso).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function scoreTone(score: number): { track: string; fill: string; text: string; label: SeverityLevel } {
  if (score <= -20) {
    return {
      track: "bg-rose-900/30",
      fill: "bg-rose-500",
      text: "text-rose-400",
      label: "high",
    };
  }
  if (score <= 20) {
    return {
      track: "bg-orange-900/30",
      fill: "bg-orange-500",
      text: "text-orange-400",
      label: "medium",
    };
  }
  return {
    track: "bg-emerald-900/30",
    fill: "bg-emerald-500",
    text: "text-emerald-400",
    label: "low",
  };
}

function bucketTimestamps(timestamps: string[], days: number, bins = 7): number[] {
  const now = Date.now();
  const totalMs = days * 24 * 60 * 60 * 1000;
  const start = now - totalMs;
  const bucketMs = totalMs / bins;
  const counts = Array.from({ length: bins }, () => 0);

  timestamps.forEach((timestamp) => {
    const value = parseDateOrZero(timestamp);
    if (value < start || value > now) return;
    const index = Math.min(bins - 1, Math.floor((value - start) / bucketMs));
    counts[Math.max(0, index)] += 1;
  });

  return counts;
}

function inferPlatform(message: string): (typeof SUPPORTED_PLATFORMS)[number] | null {
  const text = message.toLowerCase();
  if (text.includes("twitter") || text.includes("tweet")) return "twitter";
  if (text.includes("youtube") || text.includes("video")) return "youtube";
  if (text.includes("instagram") || text.includes("insta")) return "instagram";
  return null;
}

function isClusterAlert(alertType: string, message: string): boolean {
  return alertType === "attack_detected" || message.toLowerCase().includes("cluster");
}

function mapSeverity(alertType: string): SeverityLevel {
  if (alertType === "attack_detected" || alertType === "high_risk_author_active") return "high";
  if (alertType === "negative_spike" || alertType === "viral_negative") return "medium";
  return "low";
}

function alertCue(severity: SeverityLevel): string {
  if (severity === "high") return "border-l-rose-500 bg-rose-950/30";
  if (severity === "medium") return "border-l-orange-500 bg-orange-950/20";
  return "border-l-slate-600 bg-slate-800/30";
}

/* ─── Risk Score Cell ─────────────────────────────────────────────────────── */

function KeywordRiskScoreCell({ keyword, score: scoreProp }: { keyword: string; score?: number }) {
  const score = scoreProp ?? 0;
  const tone = scoreTone(score);
  const width = scoreBarWidth(score);
  const scoreLabel = `${score > 0 ? "+" : ""}${score.toFixed(1)}`;

  return (
    <div className="min-w-[170px]">
      <div className={`h-2 rounded-full ${tone.track}`}>
        <div className={`h-2 rounded-full ${tone.fill}`} style={{ width: `${width}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-xs font-semibold tabular-nums ${tone.text}`}>{scoreLabel}</span>
        <SeverityPill severity={tone.label} />
      </div>
    </div>
  );
}

/* ─── Custom Donut Legend ─────────────────────────────────────────────────── */

function DonutLegend({ items }: { items: { name: string; value: number; color: string }[] }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div className="flex flex-col gap-2 pl-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-400">{item.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-slate-300">
            {total > 0 ? Math.round((item.value / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DASHBOARD                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const router = useRouter();
  const [newKeyword, setNewKeyword] = useState("");
  const [addError, setAddError] = useState("");
  const [range, setRange] = useState("7d");
  const [liveMode, setLiveMode] = useState(true);

  const {
    keywords,
    alerts,
    isLoading,
    error: dataError,
    platformCounts: realPlatformCounts,
    rhiScore,
  } = useDashboardData();

  const unreadAlerts = alerts.filter((alert) => !alert.is_read);
  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const now = Date.now();
  const periodMs = rangeDays * 24 * 60 * 60 * 1000;
  const currentStart = now - periodMs;
  const previousStart = now - periodMs * 2;

  const currentKeywords = keywords.filter((keyword) => parseDateOrZero(keyword.created_at) >= currentStart);
  const previousKeywords = keywords.filter((keyword) => {
    const created = parseDateOrZero(keyword.created_at);
    return created >= previousStart && created < currentStart;
  });
  const currentAlerts = alerts.filter((alert) => parseDateOrZero(alert.triggered_at) >= currentStart);
  const previousAlerts = alerts.filter((alert) => {
    const triggered = parseDateOrZero(alert.triggered_at);
    return triggered >= previousStart && triggered < currentStart;
  });

  const suspiciousAuthors = useMemo(
    () => currentAlerts.filter((alert) => alert.alert_type === "high_risk_author_active").length,
    [currentAlerts]
  );
  const previousSuspiciousAuthors = useMemo(
    () => previousAlerts.filter((alert) => alert.alert_type === "high_risk_author_active").length,
    [previousAlerts]
  );
  const attackClusters = useMemo(
    () => currentAlerts.filter((alert) => isClusterAlert(alert.alert_type, alert.message)).length,
    [currentAlerts]
  );
  const previousAttackClusters = useMemo(
    () => previousAlerts.filter((alert) => isClusterAlert(alert.alert_type, alert.message)).length,
    [previousAlerts]
  );

  const metrics = [
    {
      title: "Monitored Keywords",
      value: keywords.length,
      delta: percentageDelta(currentKeywords.length, previousKeywords.length),
      sparkline: bucketTimestamps(keywords.map((keyword) => keyword.created_at), rangeDays),
      positiveIsGood: true,
    },
    {
      title: "Active Threat Alerts",
      value: unreadAlerts.filter((alert) => parseDateOrZero(alert.triggered_at) >= currentStart).length,
      delta: percentageDelta(currentAlerts.length, previousAlerts.length),
      sparkline: bucketTimestamps(currentAlerts.map((alert) => alert.triggered_at), rangeDays),
      positiveIsGood: false,
    },
    {
      title: "Suspicious Authors",
      value: suspiciousAuthors,
      delta: percentageDelta(suspiciousAuthors, previousSuspiciousAuthors),
      sparkline: bucketTimestamps(
        currentAlerts
          .filter((alert) => alert.alert_type === "high_risk_author_active")
          .map((alert) => alert.triggered_at),
        rangeDays
      ),
      positiveIsGood: false,
    },
    {
      title: "Attack Clusters",
      value: attackClusters,
      delta: percentageDelta(attackClusters, previousAttackClusters),
      sparkline: bucketTimestamps(
        currentAlerts
          .filter((alert) => isClusterAlert(alert.alert_type, alert.message))
          .map((alert) => alert.triggered_at),
        rangeDays
      ),
      positiveIsGood: false,
    },
  ];

  // Use real platform counts from the API data (not inferred from alert text)
  const platformCounts = { ...realPlatformCounts };
  // Also augment with inferred platforms from alert messages for any remaining
  currentAlerts.forEach((alert) => {
    const platform = inferPlatform(alert.message);
    // Counts are already set from API data; inferPlatform is a fallback
    if (platform && !alert.id.startsWith("tw-") && !alert.id.startsWith("yt-")) {
      platformCounts[platform] += 1;
    }
  });
  const hasPlatformMixData = platformCounts.twitter + platformCounts.youtube + platformCounts.instagram > 0;

  const platformMix = [
    { name: "Twitter/X", value: platformCounts.twitter, color: "#f43f5e" },
    { name: "YouTube", value: platformCounts.youtube, color: "#f97316" },
    { name: "Instagram", value: platformCounts.instagram, color: "#64748b" },
  ];

  /* Threat intensity data for AreaChart (same data, expanded bins for smooth area) */
  const threatIntensityData = bucketTimestamps(
    currentAlerts.map((alert) => alert.triggered_at),
    rangeDays,
    12
  ).map((intensity, index) => ({ label: `T${index + 1}`, intensity }));

  const clusterFormation = bucketTimestamps(
    currentAlerts
      .filter((alert) => isClusterAlert(alert.alert_type, alert.message))
      .map((alert) => alert.triggered_at),
    rangeDays,
    5
  ).map((clusters, index) => ({ label: `T${index + 1}`, clusters }));
  const clusterAlerts = currentAlerts.filter((alert) => isClusterAlert(alert.alert_type, alert.message));
  const distinctClusterPlatforms = new Set(clusterAlerts.map((alert) => inferPlatform(alert.message)).filter(Boolean));
  const multiPlatformClusters = distinctClusterPlatforms.size > 1 ? attackClusters : 0;

  const severitySummary = currentAlerts.reduce(
    (acc, alert) => {
      const severity = mapSeverity(alert.alert_type);
      acc[severity] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<SeverityLevel, number>
  );

  const severityTotal = severitySummary.high + severitySummary.medium + severitySummary.low;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    setAddError("");
    // Navigate to the brand intelligence page with the keyword context
    setNewKeyword("");
    router.push(`/brand-intelligence`);
  }

  async function handleDelete(_id: string) {
    // Keywords are derived from client search queries and cannot be deleted
    // This is a no-op in the real-API mode
  }

  function handleRefresh() {
    router.replace(router.asPath);
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen bg-[#030712] text-slate-200">
      <Sidebar />

      {/* Main content — offset for 64px sidebar */}
      <div className="ml-16 flex min-h-screen flex-1 flex-col">
        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-800/60 bg-[#030712]/80 px-6 backdrop-blur-sm lg:px-8">
          {/* Left: Mission Briefing */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconShieldAlert className="w-5 h-5 text-rose-500" />
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Mission Briefing</p>
                  {liveMode && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-900/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      Live
                    </span>
                  )}
                </div>
                <h1 className="text-sm font-black tracking-tighter text-slate-100">Threat Intelligence Dashboard</h1>
              </div>
            </div>
          </div>

          {/* Right: Toggles + Profile */}
          <div className="flex items-center gap-3">
            {/* Real-Time / Archive toggle */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-0.5">
              <button
                onClick={() => setLiveMode(true)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  liveMode
                    ? "bg-rose-500/20 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.2)]"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                Real-Time
              </button>
              <button
                onClick={() => setLiveMode(false)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  !liveMode
                    ? "bg-slate-700/60 text-slate-300"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                Archive
              </button>
            </div>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleRefresh}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              Refresh
            </button>

            {/* Rotated-square avatar */}
            <div className="relative h-9 w-9">
              <div
                className="absolute inset-0 flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300"
                style={{ transform: "rotate(45deg)" }}
              >
                <span style={{ transform: "rotate(-45deg)" }}>U</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          {/* ── TOP: 4-COLUMN STAT CARDS ───────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                delta={metric.delta}
                positiveIsGood={metric.positiveIsGood}
                sparkline={metric.sparkline}
              />
            ))}
          </div>

          {/* ── MIDDLE: 2:1 split — Area Chart + Donut Chart ──────────────── */}
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Threat Intensity Area Chart (spans 2 cols) */}
            <Card title="Threat Intensity" subtitle="Aggregated alert frequency over time" className="xl:col-span-2">
              <div className="h-[240px] px-5 pb-5 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={threatIntensityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "#334155", strokeDasharray: "4 4" }}
                      contentStyle={DARK_TOOLTIP_STYLE}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#threatGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Channel Share Donut Chart */}
            <Card title="Channel Share" subtitle="Source distribution">
              <div className="flex h-[240px] items-center gap-4 px-5 pb-5 pt-3">
                {hasPlatformMixData ? (
                  <>
                    <div className="h-full w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                          <Pie
                            data={platformMix}
                            dataKey="value"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={4}
                            strokeWidth={0}
                          >
                            {platformMix.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <DonutLegend items={platformMix} />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-800/50 bg-slate-800/20 text-sm text-slate-500">
                    No platform mentions in range
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── BOTTOM: Full-width Intercept Log ──────────────────────────── */}
          <div className="mt-6">
            <DataTableShell
              title="Intercept Log"
              subtitle="Tracked keywords and platform exposure"
              action={
                <span className="rounded-full border border-slate-700/40 bg-slate-800/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-400">
                  {keywords.length} tracked
                </span>
              }
            >
              <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Add keyword to monitor"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-rose-500/50 focus:shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                />
                <button
                  type="submit"
                  disabled={!newKeyword.trim()}
                  className="h-10 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 hover:shadow-[0_0_12px_rgba(244,63,94,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add keyword
                </button>
              </form>

              {addError && (
                <p className="mb-4 rounded-xl border border-rose-800/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-400">
                  {addError}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {["Keyword", "Risk score", "Platforms", "Status", "Last updated", "Actions"].map((header) => (
                        <th key={header} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading &&
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={`skeleton-${idx}`} className="border-b border-slate-800/30">
                          {Array.from({ length: 6 }).map((__, cell) => (
                            <td key={`${idx}-${cell}`} className="px-3 py-4">
                              <div className="h-4 w-full animate-pulse rounded bg-slate-800/50" />
                            </td>
                          ))}
                        </tr>
                      ))}

                    {!isLoading && keywords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                          No monitored keywords yet. Add one to start reputation tracking.
                        </td>
                      </tr>
                    )}

                    {keywords.map((kw) => (
                      <tr
                        key={kw.id}
                        className="border-b border-slate-800/30 transition-colors hover:bg-rose-500/[0.03] hover:shadow-[inset_0_0_30px_rgba(244,63,94,0.02)]"
                      >
                        <td className="px-3 py-4 font-semibold text-slate-200">{kw.keyword}</td>
                        <td className="px-3 py-4">
                          <KeywordRiskScoreCell keyword={kw.keyword} score={rhiScore} />
                        </td>
                        <td className="px-3 py-4">
                          <PlatformBadges platforms={[...SUPPORTED_PLATFORMS]} />
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${
                              kw.is_active
                                ? "border-emerald-700/40 bg-emerald-900/30 text-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.15)]"
                                : "border-slate-700/40 bg-slate-800/40 text-slate-500"
                            }`}
                          >
                            {kw.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs tabular-nums text-slate-500">{formatDate(kw.created_at)}</td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/keyword/${encodeURIComponent(kw.keyword)}`}
                              className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700/60 hover:text-slate-100"
                            >
                              View
                            </Link>
                            <Link
                              href={`/keyword/${encodeURIComponent(kw.keyword)}?mode=manage`}
                              className="rounded-lg border border-rose-800/40 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-900/40"
                            >
                              Manage
                            </Link>
                            <button
                              onClick={() => handleDelete(kw.id)}
                              className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-700/60 hover:text-slate-300"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataTableShell>
          </div>

          {/* ── FOOTER: 1:1 split — Breach Mitigation CTA + Severity Vector ─ */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Breach Mitigation CTA Card */}
            <div
              className="relative overflow-hidden rounded-2xl border border-rose-800/30 p-6"
              style={{
                background: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #9a3412 100%)",
              }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-30"
                style={{
                  background: "radial-gradient(circle, rgba(244,63,94,0.6) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <IconFlame className="w-5 h-5 text-orange-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-300/80">
                    Breach Mitigation
                  </h3>
                </div>
                <p className="mt-3 text-xl font-black tracking-tighter text-white">
                  {currentAlerts.length} Active Threat{currentAlerts.length !== 1 ? "s" : ""} Detected
                </p>
                <p className="mt-2 text-sm leading-relaxed text-rose-200/70">
                  Cross-platform synchronized activity detected in the current watch window. Immediate investigation recommended.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/alerts"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <IconZap className="w-4 h-4" />
                    Review Alerts
                  </Link>
                  <Link
                    href="/clusters"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    <IconActivity className="w-4 h-4" />
                    View Clusters
                  </Link>
                </div>
              </div>
            </div>

            {/* Severity Vector Map */}
            <Card title="Severity Vector Map" subtitle="Distribution of threat severity levels">
              <div className="space-y-4 px-5 pb-5 pt-4">
                {/* High */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-rose-400">{severitySummary.high}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-700"
                      style={{ width: `${severityTotal > 0 ? (severitySummary.high / severityTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                {/* Medium */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Warning</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-orange-400">{severitySummary.medium}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
                      style={{ width: `${severityTotal > 0 ? (severitySummary.medium / severityTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                {/* Low */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nominal</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-emerald-400">{severitySummary.low}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${severityTotal > 0 ? (severitySummary.low / severityTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Cluster Highlights sub-section */}
                <div className="mt-2 rounded-xl border border-slate-800/50 bg-slate-800/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Cluster Intel</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    <li className="flex items-center justify-between text-slate-400">
                      <span>Emerging clusters</span>
                      <strong className="tabular-nums text-slate-300">{attackClusters}</strong>
                    </li>
                    <li className="flex items-center justify-between text-slate-400">
                      <span>Multi-platform</span>
                      <strong className="tabular-nums text-slate-300">{multiPlatformClusters}</strong>
                    </li>
                    <li className="flex items-center justify-between text-slate-400">
                      <span>Escalating</span>
                      <strong className="tabular-nums text-slate-300">
                        {currentAlerts.filter((alert) => mapSeverity(alert.alert_type) === "high").length}
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
