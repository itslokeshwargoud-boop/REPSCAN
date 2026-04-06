import { InsightAlert } from "@/lib/mockData";

interface InsightsPanelProps {
  insights: InsightAlert[];
  apiStatus: {
    status: "ok" | "partial_data" | "error";
    reason?: "rate_limit" | "api_error" | "timeout";
    tweetsFetched: number;
    youtubeFetched: number;
  };
}

/** Renders detail text, extracting any "Source: <url>" suffix as a clickable proof link */
function InsightDetail({ detail, className }: { detail: string; className: string }) {
  const sourceMatch = detail.match(/Source:\s*(https?:\/\/\S+)$/);
  if (!sourceMatch) {
    return <p className={className}>{detail}</p>;
  }
  const text = detail.slice(0, sourceMatch.index).replace(/·\s*$/, "").trim();
  const url = sourceMatch[1];
  return (
    <p className={className}>
      {text}{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="View original source"
      >
        View source ↗
      </a>
    </p>
  );
}

const TYPE_CONFIG = {
  positive: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "✓",
    iconBg: "bg-green-100 text-green-700",
    title: "text-green-800",
    text: "text-green-700",
  },
  warning: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "!",
    iconBg: "bg-red-100 text-red-700",
    title: "text-red-800",
    text: "text-red-700",
  },
  neutral: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "i",
    iconBg: "bg-gray-100 text-gray-600",
    title: "text-gray-800",
    text: "text-gray-600",
  },
};

export default function InsightsPanel({ insights, apiStatus }: InsightsPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Latest Insights</h3>
          <p className="text-xs text-gray-400 mt-0.5">What&apos;s happening with your brand right now</p>
        </div>

        {/* API status badge */}
        {apiStatus.status === "partial_data" && (
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span className="text-[11px] font-semibold text-yellow-700">Partial data</span>
          </div>
        )}
        {apiStatus.status === "ok" && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] font-semibold text-green-700">Live data</span>
          </div>
        )}
      </div>

      {/* API info bar */}
      <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Posts fetched:</span>
          <span className="text-[11px] font-semibold text-gray-600">
            {apiStatus.tweetsFetched} tweets
          </span>
        </div>
        <div className="h-3 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Videos analyzed:</span>
          <span className="text-[11px] font-semibold text-gray-600">
            {apiStatus.youtubeFetched} videos
          </span>
        </div>
        {apiStatus.reason === "rate_limit" && (
          <>
            <div className="h-3 w-px bg-gray-200" />
            <span className="text-[11px] text-yellow-600 font-medium">Rate limit reached — showing available data</span>
          </>
        )}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const cfg = TYPE_CONFIG[insight.type];
          return (
            <div
              key={insight.id}
              className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${cfg.iconBg}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${cfg.title}`}>
                  {insight.message}
                </p>
                <InsightDetail detail={insight.detail} className={`text-xs mt-1 leading-relaxed ${cfg.text}`} />
                <p className="text-[11px] text-gray-400 mt-1.5">{insight.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
