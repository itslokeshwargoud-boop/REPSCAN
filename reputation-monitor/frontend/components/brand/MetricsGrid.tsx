import { useState } from "react";
import { RHIMetric } from "@/lib/mockData";
import MetricModal from "./MetricModal";

interface MetricsGridProps {
  metrics: RHIMetric[];
}

const STATUS_CONFIG = {
  good: {
    badge: "bg-green-50 text-green-700 border-green-100",
    value: "text-green-700",
    change: "text-green-600",
    bar: "bg-green-500",
    label: "Good",
    dot: "bg-green-500",
  },
  attention: {
    badge: "bg-yellow-50 text-yellow-700 border-yellow-100",
    value: "text-yellow-700",
    change: "text-yellow-600",
    bar: "bg-yellow-500",
    label: "Needs Attention",
    dot: "bg-yellow-500",
  },
  risky: {
    badge: "bg-red-50 text-red-700 border-red-100",
    value: "text-red-700",
    change: "text-red-600",
    bar: "bg-red-500",
    label: "Risky",
    dot: "bg-red-500",
  },
};

function MetricCard({ metric, onClick }: { metric: RHIMetric; onClick: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cfg = STATUS_CONFIG[metric.status];
  const changePositive = metric.higherIsBetter ? metric.change >= 0 : metric.change <= 0;
  const barWidth = `${Math.min(100, Math.max(0, metric.value))}%`;

  return (
    <button
      onClick={onClick}
      className="relative text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-gray-500 leading-tight">{metric.label}</p>
          {/* Tooltip trigger */}
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-500 transition-colors"
            aria-label={`What is ${metric.label}?`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-20 top-full left-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg leading-relaxed pointer-events-none">
          {metric.tooltip}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}

      {/* Value */}
      <p className={`text-2xl font-black tabular-nums leading-none mb-1 ${cfg.value}`}>
        {metric.displayValue}
      </p>

      {/* Change */}
      <p className={`text-xs font-semibold tabular-nums mb-3 ${changePositive ? "text-green-600" : "text-red-600"}`}>
        {metric.changeLabel}
      </p>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: barWidth }}
        />
      </div>

      {/* Click hint */}
      <p className="text-[10px] text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        Click for details →
      </p>
    </button>
  );
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const [selectedMetric, setSelectedMetric] = useState<RHIMetric | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            onClick={() => setSelectedMetric(metric)}
          />
        ))}
      </div>

      <MetricModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
      />
    </>
  );
}
