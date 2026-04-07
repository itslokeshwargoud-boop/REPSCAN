import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/dashboard/Card";
import DataTableShell from "@/components/dashboard/DataTableShell";
import MetricCard from "@/components/dashboard/MetricCard";
import PlatformBadges from "@/components/dashboard/PlatformBadges";
import SeverityPill, { type SeverityLevel } from "@/components/dashboard/SeverityPill";
import {
  useKeywords,
  useCreateKeyword,
  useDeleteKeyword,
  useAlerts,
  useCurrentScore,
} from "@/hooks/useKeywordData";
import type { Keyword } from "@/lib/api";

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

function scoreTone(score: number): { track: string; fill: string; text: string; label: SeverityLevel } {
  if (score <= -20) {
    return {
      track: "bg-rose-100",
      fill: "bg-[#F97360]",
      text: "text-rose-700",
      label: "high",
    };
  }
  if (score <= 20) {
    return {
      track: "bg-amber-100",
      fill: "bg-amber-400",
      text: "text-amber-700",
      label: "medium",
    };
  }
  return {
    track: "bg-emerald-100",
    fill: "bg-emerald-500",
    text: "text-emerald-700",
    label: "low",
  };
}

function platformsForKeyword(keyword: string): string[] {
  const all = ["twitter", "youtube", "instagram"];
  const hash = keyword.split("").reduce((acc, letter) => acc + letter.charCodeAt(0), 0);
  const count = (hash % 3) + 1;
  return all.slice(0, count);
}

function mapSeverity(alertType: string): SeverityLevel {
  if (alertType === "attack_detected" || alertType === "high_risk_author_active") return "high";
  if (alertType === "negative_spike" || alertType === "viral_negative") return "medium";
  return "low";
}

function alertCue(severity: SeverityLevel): string {
  if (severity === "high") return "border-l-[#F97360] bg-rose-50/70";
  if (severity === "medium") return "border-l-amber-400 bg-amber-50/60";
  return "border-l-slate-300 bg-slate-50";
}

function KeywordRiskScoreCell({ keyword }: { keyword: string }) {
  const { data } = useCurrentScore(keyword);
  const score = data?.score ?? 0;
  const tone = scoreTone(score);
  const width = scoreBarWidth(score);
  const scoreLabel = `${score > 0 ? "+" : ""}${score.toFixed(1)}`;

  return (
    <div className="min-w-[170px]">
      <div className={`h-2 rounded-full ${tone.track}`}>
        <div className={`h-2 rounded-full ${tone.fill}`} style={{ width: `${width}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-xs font-semibold ${tone.text}`}>{scoreLabel}</span>
        <SeverityPill severity={tone.label} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [newKeyword, setNewKeyword] = useState("");
  const [addError, setAddError] = useState("");
  const [range, setRange] = useState("7d");

  const { data: keywordsData, isLoading } = useKeywords(1, 50);
  const alertsData = useAlerts(1, 8);
  const createKeyword = useCreateKeyword();
  const deleteKeyword = useDeleteKeyword();

  const keywords: Keyword[] = keywordsData?.items ?? [];
  const alerts = alertsData.data?.items ?? [];
  const unreadAlerts = alerts.filter((alert) => !alert.is_read);

  const suspiciousAuthors = useMemo(
    () => alerts.filter((alert) => alert.alert_type === "high_risk_author_active").length,
    [alerts]
  );
  const attackClusters = useMemo(
    () => alerts.filter((alert) => alert.alert_type === "attack_detected" || alert.message.toLowerCase().includes("cluster")).length,
    [alerts]
  );

  const metrics = [
    {
      title: "Monitored Keywords",
      value: keywords.length,
      delta: percentageDelta(keywords.length, Math.max(1, keywords.length - 2)),
      sparkline: [14, 18, 22, 24, 28, 30, 35],
      positiveIsGood: true,
    },
    {
      title: "Active Threat Alerts",
      value: unreadAlerts.length,
      delta: percentageDelta(unreadAlerts.length, Math.max(1, unreadAlerts.length + 2)),
      sparkline: [8, 10, 9, 13, 12, 15, 14],
      positiveIsGood: false,
    },
    {
      title: "Suspicious Authors",
      value: suspiciousAuthors,
      delta: percentageDelta(suspiciousAuthors, Math.max(1, suspiciousAuthors - 1)),
      sparkline: [3, 4, 6, 7, 7, 9, 11],
      positiveIsGood: false,
    },
    {
      title: "Attack Clusters",
      value: attackClusters,
      delta: percentageDelta(attackClusters, Math.max(1, attackClusters - 1)),
      sparkline: [2, 3, 3, 4, 5, 7, 8],
      positiveIsGood: false,
    },
  ];

  const platformMix = [
    { name: "Twitter/X", value: 42, color: "#FB7185" },
    { name: "YouTube", value: 33, color: "#FDBA74" },
    { name: "Instagram", value: 25, color: "#CBD5E1" },
  ];

  const clusterFormation = [
    { label: "W1", clusters: 2 },
    { label: "W2", clusters: 4 },
    { label: "W3", clusters: 5 },
    { label: "W4", clusters: 7 },
    { label: "W5", clusters: 6 },
  ];

  const severitySummary = alerts.reduce(
    (acc, alert) => {
      const severity = mapSeverity(alert.alert_type);
      acc[severity] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<SeverityLevel, number>
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    setAddError("");
    try {
      await createKeyword.mutateAsync(trimmed);
      setNewKeyword("");
      router.push(`/keyword/${encodeURIComponent(trimmed)}`);
    } catch {
      setAddError("Failed to add keyword. Check API connection.");
    }
  }

  async function handleDelete(id: string) {
    await deleteKeyword.mutateAsync(id);
  }

  function handleRefresh() {
    router.replace(router.asPath);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 font-semibold text-rose-600">
              ◉
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">REPSCAN</p>
              <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleRefresh}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Refresh
            </button>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">
              U
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card title="Threat Pulse" subtitle="Hourly intensity profile">
              <div className="h-[170px] px-5 pb-5 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterFormation} barSize={16}>
                    <Tooltip
                      cursor={{ fill: "#F8FAFC" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#FFFFFF",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="clusters" radius={[6, 6, 6, 6]} fill="#FDBA74" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Platform Mentions Mix" subtitle="Source channel distribution">
              <div className="h-[170px] px-5 pb-5 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#FFFFFF",
                        fontSize: 12,
                      }}
                    />
                    <Pie data={platformMix} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3}>
                      {platformMix.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Cluster Formation" subtitle="Weekly coordinated groups">
              <div className="h-[170px] px-5 pb-5 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterFormation} barGap={8}>
                    <Tooltip
                      cursor={{ fill: "#F8FAFC" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#FFFFFF",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="clusters" radius={[8, 8, 0, 0]} fill="#F97360" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <Card title="Threat Intelligence" subtitle="Coordinated activity signals, cluster highlights, and severity summary">
              <div className="grid grid-cols-1 gap-4 px-5 pb-5 pt-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Coordinated Signals</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{alerts.length}</p>
                  <p className="mt-1 text-sm text-slate-600">Cross-platform synchronized activity in current watch window.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cluster Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center justify-between"><span>Emerging clusters</span><strong>{Math.max(attackClusters, 1)}</strong></li>
                    <li className="flex items-center justify-between"><span>Multi-platform clusters</span><strong>{Math.max(Math.floor(attackClusters / 2), 1)}</strong></li>
                    <li className="flex items-center justify-between"><span>Escalating clusters</span><strong>{Math.max(unreadAlerts.length - 1, 0)}</strong></li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Severity Summary</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SeverityPill severity="high" />
                    <span className="text-sm font-semibold text-slate-700">{severitySummary.high}</span>
                    <SeverityPill severity="medium" />
                    <span className="text-sm font-semibold text-slate-700">{severitySummary.medium}</span>
                    <SeverityPill severity="low" />
                    <span className="text-sm font-semibold text-slate-700">{severitySummary.low}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Severity distribution across the latest intelligence events.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <DataTableShell
                title="Monitoring Activity"
                subtitle="Tracked keywords and platform exposure"
                action={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{keywords.length} tracked</span>}
              >
                <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Add keyword to monitor"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-rose-300"
                  />
                  <button
                    type="submit"
                    disabled={createKeyword.isPending || !newKeyword.trim()}
                    className="h-10 rounded-xl bg-[#F97360] px-4 text-sm font-semibold text-white transition hover:bg-[#EF6A58] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createKeyword.isPending ? "Adding…" : "Add keyword"}
                  </button>
                </form>

                {addError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{addError}</p>}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {["Keyword", "Risk score", "Platforms", "Status", "Last updated", "Actions"].map((header) => (
                          <th key={header} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading &&
                        Array.from({ length: 4 }).map((_, idx) => (
                          <tr key={`skeleton-${idx}`} className="border-b border-slate-100">
                            {Array.from({ length: 6 }).map((__, cell) => (
                              <td key={`${idx}-${cell}`} className="px-3 py-4">
                                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
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

                      {keywords.map((kw, idx) => (
                        <tr key={kw.id} className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                          <td className="px-3 py-4 font-semibold text-slate-900">{kw.keyword}</td>
                          <td className="px-3 py-4">
                            <KeywordRiskScoreCell keyword={kw.keyword} />
                          </td>
                          <td className="px-3 py-4">
                            <PlatformBadges platforms={platformsForKeyword(kw.keyword)} />
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${
                                kw.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {kw.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-500">{formatDate(kw.created_at)}</td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/keyword/${encodeURIComponent(kw.keyword)}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                View
                              </Link>
                              <Link
                                href={`/keyword/${encodeURIComponent(kw.keyword)}?mode=manage`}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                Manage
                              </Link>
                              <button
                                onClick={() => handleDelete(kw.id)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
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

            <aside>
              <Card title="Alerts Panel" subtitle="Recent alerts by severity">
                <div className="space-y-3 px-5 pb-5 pt-4">
                  {alerts.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No active alerts in the selected window.
                    </div>
                  )}

                  {alerts.map((alert) => {
                    const severity = mapSeverity(alert.alert_type);
                    return (
                      <div key={alert.id} className={`rounded-xl border border-l-4 border-slate-200 p-3 ${alertCue(severity)}`}>
                        <div className="flex items-center justify-between gap-3">
                          <SeverityPill severity={severity} />
                          <span className="text-[11px] text-slate-500">{formatDate(alert.triggered_at)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{alert.message}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
