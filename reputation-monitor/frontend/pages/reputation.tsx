/**
 * Reputation Dashboard — KPI cards, trend chart, alerts banner.
 *
 * Shows real-time reputation data from ingested reviews.
 * Degrades gracefully when APIs are unavailable.
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import {
  useReviews,
  useReputationScore,
  useAlerts,
} from "@/hooks/useReputationAI";

// ---------------------------------------------------------------------------
// Tooltip style
// ---------------------------------------------------------------------------

const DARK_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #334155",
  backgroundColor: "#0F172A",
  color: "#E2E8F0",
  fontSize: 12,
};

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KPICard({
  label,
  value,
  subtitle,
  color = "text-slate-100",
  icon,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert Banner
// ---------------------------------------------------------------------------

function AlertBanner({
  alerts,
}: {
  alerts: Array<{ message: string; severity: string }>;
}) {
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (highAlerts.length === 0) return null;

  return (
    <div className="mb-6 animate-slide-in">
      {highAlerts.map((alert, i) => (
        <div
          key={i}
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 animate-glow-pulse"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-rose-400">{alert.message}</p>
              <p className="text-xs text-rose-400/70">
                Immediate attention recommended
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Gauge
// ---------------------------------------------------------------------------

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400"
      : score >= 40
      ? "text-amber-400"
      : "text-rose-400";
  const bgColor =
    score >= 70
      ? "bg-emerald-500/20"
      : score >= 40
      ? "bg-amber-500/20"
      : "bg-rose-500/20";
  const label =
    score >= 70 ? "Excellent" : score >= 40 ? "Needs Attention" : "At Risk";

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className={`mb-3 flex h-28 w-28 items-center justify-center rounded-full ${bgColor}`}
      >
        <span className={`text-4xl font-black ${color}`}>{score}</span>
      </div>
      <p className={`text-sm font-semibold ${color}`}>{label}</p>
      <p className="text-xs text-slate-500">out of 100</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReputationDashboard() {
  const { data: reviews, isLoading: reviewsLoading } = useReviews();
  const { data: scoreData, isLoading: scoreLoading } = useReputationScore();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

  // Compute derived stats
  const stats = useMemo(() => {
    const now = new Date();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
    const twentyFourHoursAgo = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);

    const recent30d = (reviews ?? []).filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    );
    const recent24h = (reviews ?? []).filter(
      (r) => new Date(r.createdAt) >= twentyFourHoursAgo
    );
    const negative24h = recent24h.filter(
      (r) => r.sentiment === "negative"
    ).length;

    return {
      totalReviews30d: recent30d.length,
      negative24h,
    };
  }, [reviews]);

  const isLoading = reviewsLoading || scoreLoading || alertsLoading;
  const hasData = reviews && reviews.length > 0;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="ml-16 flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Reputation Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Real-time reputation monitoring and insights
            </p>
          </div>
          <Link
            href="/reviews"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            View All Reviews →
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-500 animate-pulse">
              Loading dashboard…
            </p>
          </div>
        )}

        {/* Alerts Banner */}
        {!isLoading && alerts && <AlertBanner alerts={alerts} />}

        {/* Empty state */}
        {!isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20">
            <div className="mb-4 text-5xl">📊</div>
            <h2 className="mb-2 text-lg font-semibold text-slate-200">
              No reputation data yet
            </h2>
            <p className="mb-6 max-w-md text-center text-sm text-slate-500">
              Import your reviews to see reputation score, sentiment trends, and
              get AI-powered response suggestions.
            </p>
            <Link
              href="/reviews"
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              Import Reviews to Get Started
            </Link>
          </div>
        )}

        {/* Dashboard content */}
        {!isLoading && hasData && (
          <>
            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KPICard
                label="Reputation Score"
                value={scoreData?.score ?? 0}
                subtitle="Last 30 days"
                color={
                  (scoreData?.score ?? 0) >= 70
                    ? "text-emerald-400"
                    : (scoreData?.score ?? 0) >= 40
                    ? "text-amber-400"
                    : "text-rose-400"
                }
                icon="⭐"
              />
              <KPICard
                label="Total Reviews"
                value={stats.totalReviews30d}
                subtitle="Last 30 days"
                icon="📝"
              />
              <KPICard
                label="Negative Reviews"
                value={stats.negative24h}
                subtitle="Last 24 hours"
                color={
                  stats.negative24h >= 3
                    ? "text-rose-400"
                    : stats.negative24h >= 1
                    ? "text-amber-400"
                    : "text-emerald-400"
                }
                icon="🔴"
              />
            </div>

            {/* Score + Breakdown */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Score Gauge */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
                <h3 className="mb-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Reputation Score
                </h3>
                <ScoreGauge score={scoreData?.score ?? 0} />
                {scoreData && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-400">
                        {scoreData.breakdown.positive}
                      </p>
                      <p className="text-xs text-slate-500">Positive</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-400">
                        {scoreData.breakdown.neutral}
                      </p>
                      <p className="text-xs text-slate-500">Neutral</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-rose-400">
                        {scoreData.breakdown.negative}
                      </p>
                      <p className="text-xs text-slate-500">Negative</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trend Chart */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  7-Day Sentiment Trend
                </h3>
                {scoreData?.trend && scoreData.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scoreData.trend}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                      />
                      <Bar
                        dataKey="positive"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        name="Positive"
                      />
                      <Bar
                        dataKey="neutral"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        name="Neutral"
                      />
                      <Bar
                        dataKey="negative"
                        fill="#EF4444"
                        radius={[4, 4, 0, 0]}
                        name="Negative"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-500">
                    No trend data yet — analyze sentiment to see trends
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reviews Preview */}
            <div className="rounded-xl border border-slate-800/60 bg-[#0F172A]/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Reviews
                </h3>
                <Link
                  href="/reviews"
                  className="text-xs font-medium text-brand-blue hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {(reviews ?? []).slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/30 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-200">
                          {review.author}
                        </span>
                        <span className="inline-flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i <= review.rating
                                  ? "text-amber-400"
                                  : "text-slate-700"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </span>
                        {review.sentiment && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              review.sentiment === "positive"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : review.sentiment === "negative"
                                ? "bg-rose-500/15 text-rose-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {review.sentiment === "positive"
                              ? "🟢"
                              : review.sentiment === "negative"
                              ? "🔴"
                              : "🟡"}{" "}
                            {review.sentiment}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {review.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
