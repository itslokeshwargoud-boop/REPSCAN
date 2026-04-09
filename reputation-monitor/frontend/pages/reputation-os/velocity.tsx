import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Activity,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { TenantProvider } from "@/contexts/TenantContext";
import { useReputationOs } from "@/hooks/useReputationOs";
import ROLayout from "@/components/reputation-os/ROLayout";
import ROCard from "@/components/reputation-os/ROCard";
import ROBadge from "@/components/reputation-os/ROBadge";
import ROMetricCard from "@/components/reputation-os/ROMetricCard";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />
  );
}

const SPEED_BADGE_VARIANT: Record<string, "critical" | "medium" | "positive"> =
  {
    rapid: "critical",
    moderate: "medium",
    slow: "positive",
  };

const TREND_ICON: Record<string, React.ReactNode> = {
  accelerating: <TrendingUp size={16} />,
  decelerating: <TrendingDown size={16} />,
  stable: <Minus size={16} />,
};

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function VelocityContent() {
  const { velocity } = useReputationOs();

  const data = velocity.data;

  const trendMap: Record<string, "up" | "down" | "stable"> = {
    accelerating: "up",
    decelerating: "down",
    stable: "stable",
  };

  const insightText = useMemo(() => {
    if (!data) return "";
    switch (data.speed) {
      case "rapid":
        return "⚡ Sentiment is changing rapidly. Immediate attention required.";
      case "moderate":
        return "📊 Moderate sentiment movement detected. Monitor closely.";
      case "slow":
        return "✅ Sentiment is stable. No immediate action needed.";
      default:
        return "";
    }
  }, [data]);

  const insightBorder = useMemo(() => {
    if (!data) return "border-slate-700";
    switch (data.speed) {
      case "rapid":
        return "border-red-500/50";
      case "moderate":
        return "border-yellow-500/50";
      case "slow":
        return "border-emerald-500/50";
      default:
        return "border-slate-700";
    }
  }, [data]);

  if (velocity.isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-red-400">Failed to load velocity data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-white">Sentiment Velocity</h1>
        {data && (
          <ROBadge
            variant={SPEED_BADGE_VARIANT[data.speed] ?? "neutral"}
            pulse={data.speed === "rapid"}
          >
            {data.speed}
          </ROBadge>
        )}
      </div>

      {/* Top metrics */}
      {velocity.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ROMetricCard
            label="Speed"
            value={data.speed.charAt(0).toUpperCase() + data.speed.slice(1)}
            icon={<Zap size={18} />}
          />
          <ROMetricCard
            label="Rate / Hour"
            value={`${data.rate_per_hour}`}
            icon={<Clock size={18} />}
            trend={data.rate_per_hour > 50 ? "up" : "stable"}
          />
          <ROMetricCard
            label="Trend Direction"
            value={
              data.trend_direction.charAt(0).toUpperCase() +
              data.trend_direction.slice(1)
            }
            icon={TREND_ICON[data.trend_direction] ?? <Activity size={18} />}
            trend={trendMap[data.trend_direction] ?? "stable"}
          />
          <ROMetricCard
            label="Acceleration"
            value={`${data.acceleration > 0 ? "+" : ""}${data.acceleration}`}
            icon={<ArrowUpRight size={18} />}
            trend={
              data.acceleration > 0
                ? "up"
                : data.acceleration < 0
                  ? "down"
                  : "stable"
            }
            trendValue={`${Math.abs(data.acceleration)}`}
          />
        </div>
      ) : null}

      {/* Main stacked area chart */}
      <ROCard title="Sentiment Timeline" subtitle="Positive / Negative / Neutral over time" icon={<Activity size={18} />}>
        {velocity.isLoading ? (
          <SkeletonBlock className="h-80 w-full" />
        ) : data ? (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="velPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="velNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="velNeu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke="#10b981"
                fill="url(#velPos)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke="#ef4444"
                fill="url(#velNeg)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke="#64748b"
                fill="url(#velNeu)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {[
            { label: "Positive", color: "#10b981" },
            { label: "Negative", color: "#ef4444" },
            { label: "Neutral", color: "#64748b" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </ROCard>

      {/* Velocity Insight */}
      {data && (
        <ROCard title="Velocity Insight" icon={<Gauge size={18} />}>
          <div
            className={`rounded-lg border ${insightBorder} bg-slate-900/30 px-5 py-4`}
          >
            <p className="text-sm leading-relaxed text-slate-300">
              {insightText}
            </p>
          </div>
          {data.spike_proof_urls && data.spike_proof_urls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/40">
              <p className="text-xs text-slate-500 mb-2">Spike Evidence</p>
              <div className="flex flex-wrap gap-3">
                {data.spike_proof_urls.map((s) => (
                  <span
                    key={s.hour}
                    className="text-[10px] text-slate-400"
                  >
                    Spike at {s.hour}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ROCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported page
// ---------------------------------------------------------------------------

export default function VelocityPage() {
  return (
    <TenantProvider>
      <ROLayout activeModule="velocity">
        <VelocityContent />
      </ROLayout>
    </TenantProvider>
  );
}
