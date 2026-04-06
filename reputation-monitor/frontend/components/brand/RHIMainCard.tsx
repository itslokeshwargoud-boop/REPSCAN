import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ClientData } from "@/lib/mockData";

interface RHIMainCardProps {
  data: ClientData;
}

const STATUS_CONFIG = {
  good: {
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Good",
    badge: "bg-green-100 text-green-800",
    lineColor: "#16A34A",
  },
  attention: {
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Needs Attention",
    badge: "bg-yellow-100 text-yellow-800",
    lineColor: "#D97706",
  },
  risky: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Risky",
    badge: "bg-red-100 text-red-800",
    lineColor: "#DC2626",
  },
};

// Coefficients for the sparkline approximation of the RHI trend.
// These are visual-only weights and do not need to match the exact RHI formula.
const SPARKLINE_SENTIMENT_COEFF = 0.35;
const SPARKLINE_ENGAGEMENT_COEFF = 5;
const SPARKLINE_MEDIA_COEFF = 0.30;

export default function RHIMainCard({ data }: RHIMainCardProps) {
  const { rhi, trendData, metrics } = data;
  const cfg = STATUS_CONFIG[rhi.status];
  const trendPositive = rhi.trend >= 0;

  // Compute mini RHI trend for sparkline
  const sparklineData = trendData.map((d) => ({
    date: d.date,
    value: (
      d.sentiment * SPARKLINE_SENTIMENT_COEFF +
      d.engagement * SPARKLINE_ENGAGEMENT_COEFF +
      d.mediaPresence * SPARKLINE_MEDIA_COEFF
    ).toFixed(1),
  }));

  // Show formula breakdown
  const topMetrics = metrics.slice(0, 4);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Reputation Health Index
          </p>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-black text-gray-900 tabular-nums leading-none">
              {rhi.score.toFixed(1)}
            </span>
            <div className="pb-1">
              <span
                className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${
                  trendPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trendPositive ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {rhi.trendLabel}
              </span>
              <p className="text-xs text-gray-400">vs last period</p>
            </div>
          </div>
        </div>

        <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${cfg.badge}`}>
          ● {cfg.label}
        </span>
      </div>

      {/* Sparkline */}
      <div className="h-16 mb-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <XAxis dataKey="date" hide />
            <Tooltip
              contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6 }}
              formatter={(v: unknown) => [String(v), "Score"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={cfg.lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg border ${cfg.bg} ${cfg.border} mb-5`}>
        <p className="text-sm text-gray-700 leading-relaxed">{rhi.summary}</p>
      </div>

      {/* Formula transparency — top 4 metrics */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          How this score is calculated
        </p>
        <div className="space-y-2">
          {topMetrics.map((m) => (
            <div key={m.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-32 shrink-0">{m.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    m.status === "good"
                      ? "bg-green-500"
                      : m.status === "attention"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, m.value)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-12 text-right tabular-nums">
                {m.displayValue}
              </span>
              <span className="text-xs text-gray-400 w-10 text-right">{(m.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Weights shown. All 8 metrics contribute to the final score.</p>
      </div>
    </div>
  );
}
