import { useEffect } from "react";
import { RHIMetric } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricModalProps {
  metric: RHIMetric | null;
  onClose: () => void;
}

const STATUS_CONFIG = {
  good: { color: "text-green-700", bg: "bg-green-50", badge: "bg-green-100 text-green-700", bar: "bg-green-500" },
  attention: { color: "text-yellow-700", bg: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-500" },
  risky: { color: "text-red-700", bg: "bg-red-50", badge: "bg-red-100 text-red-700", bar: "bg-red-500" },
};

// Simulated historical data for drill-down
function generateHistory(currentValue: number): Array<{ month: string; value: number }> {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  return months.map((month, i) => ({
    month,
    value: Math.max(0, currentValue - (months.length - 1 - i) * (currentValue * 0.05)),
  }));
}

export default function MetricModal({ metric, onClose }: MetricModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!metric) return null;

  const cfg = STATUS_CONFIG[metric.status];
  const historyData = generateHistory(metric.value);
  const changePositive = metric.higherIsBetter ? metric.change >= 0 : metric.change <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{metric.technicalLabel}</p>
            <h2 className="text-xl font-bold text-gray-900">{metric.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Score + change */}
          <div className="flex items-center gap-4">
            <div className={`flex-1 p-4 rounded-xl ${cfg.bg}`}>
              <p className="text-xs text-gray-500 mb-1">Current Value</p>
              <p className={`text-3xl font-black tabular-nums ${cfg.color}`}>{metric.displayValue}</p>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Change This Period</p>
              <p className={`text-2xl font-black tabular-nums ${changePositive ? "text-green-600" : "text-red-600"}`}>
                {metric.changeLabel}
              </p>
            </div>
            <div className={`self-stretch flex items-center px-4 py-3 rounded-xl ${cfg.badge}`}>
              <span className="text-sm font-bold whitespace-nowrap">
                {metric.status === "good" ? "✓ Good" : metric.status === "attention" ? "⚠ Watch" : "✗ Risky"}
              </span>
            </div>
          </div>

          {/* What it means */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">What this means</p>
            <p className="text-sm text-gray-700">{metric.tooltip}</p>
          </div>

          {/* Trend chart */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">7-Month Trend</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={metric.status === "good" ? "#16A34A" : metric.status === "attention" ? "#D97706" : "#DC2626"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weight explanation */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Contribution to RHI Score</p>
            <p className="text-sm font-bold text-gray-700">{(metric.weight * 100).toFixed(0)}% weight</p>
          </div>
        </div>
      </div>
    </div>
  );
}
