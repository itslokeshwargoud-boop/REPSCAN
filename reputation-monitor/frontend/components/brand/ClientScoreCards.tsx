import type { ClientId } from "@/lib/mockData";

interface ClientSummary {
  clientId: ClientId;
  clientName: string;
  score: number;
  trend: number;
  trendLabel: string;
  status: "good" | "attention" | "risky";
}

interface ClientScoreCardsProps {
  activeClient: ClientId;
  onClientSelect: (id: ClientId) => void;
  summaries: ClientSummary[];
}

const STATUS_CONFIG = {
  good: {
    badge: "bg-green-50 text-green-700 border-green-200",
    scoreColor: "text-green-700",
    label: "Good",
    indicator: "bg-green-500",
  },
  attention: {
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    scoreColor: "text-yellow-700",
    label: "Needs Attention",
    indicator: "bg-yellow-500",
  },
  risky: {
    badge: "bg-red-50 text-red-700 border-red-200",
    scoreColor: "text-red-700",
    label: "Risky",
    indicator: "bg-red-500",
  },
};

export default function ClientScoreCards({ activeClient, onClientSelect, summaries }: ClientScoreCardsProps) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {summaries.map((s) => {
        const cfg = STATUS_CONFIG[s.status];
        const isActive = s.clientId === activeClient;
        const trendPositive = s.trend >= 0;

        return (
          <button
            key={s.clientId}
            onClick={() => onClientSelect(s.clientId)}
            className={`text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900/20 ${
              isActive
                ? "bg-white border-gray-900 shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cfg.indicator}`} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.clientName}</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black text-gray-900 tabular-nums leading-none">
                  {s.score.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 mt-1">RHI Score</p>
              </div>
              <div className={`text-sm font-bold tabular-nums ${trendPositive ? "text-green-600" : "text-red-600"}`}>
                {s.trendLabel}
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cfg.indicator}`}
                style={{ width: `${s.score}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
