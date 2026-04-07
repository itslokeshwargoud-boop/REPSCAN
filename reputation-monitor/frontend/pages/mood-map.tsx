import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import { useMoodMap } from "@/hooks/useMoodMap";
import type { MoodMapReport, SegmentAnalysis, KeyMoment, RiskAlert, EmotionDistribution, ModalityStatus } from "@/lib/moodMap";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function sentimentColor(s: string): string {
  switch (s) {
    case "positive": return "text-emerald-400";
    case "negative": return "text-red-400";
    default: return "text-slate-400";
  }
}

function sentimentBg(s: string): string {
  switch (s) {
    case "positive": return "bg-emerald-500/15 border-emerald-500/30";
    case "negative": return "bg-red-500/15 border-red-500/30";
    default: return "bg-slate-500/15 border-slate-500/30";
  }
}

function emotionEmoji(e: string): string {
  switch (e) {
    case "joy": return "😊";
    case "anger": return "😠";
    case "sadness": return "😢";
    case "fear": return "😨";
    case "disgust": return "🤢";
    case "surprise": return "😲";
    default: return "😐";
  }
}

function scoreColor(score: number): string {
  if (score > 0.3) return "text-emerald-400";
  if (score > 0) return "text-emerald-300";
  if (score > -0.3) return "text-slate-400";
  if (score > -0.6) return "text-red-300";
  return "text-red-400";
}

function scoreBgBar(score: number): string {
  if (score > 0.3) return "bg-emerald-500";
  if (score > 0) return "bg-emerald-400";
  if (score > -0.3) return "bg-slate-500";
  if (score > -0.6) return "bg-red-400";
  return "bg-red-500";
}

function confidenceBadge(c: string): string {
  switch (c) {
    case "high": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "medium": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default: return "bg-red-500/15 text-red-400 border-red-500/30";
  }
}

function severityBadge(s: string): string {
  switch (s) {
    case "high": return "bg-red-500/15 text-red-400 border-red-500/30";
    case "medium": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

/* ─── Report Overview ─────────────────────────────────────────────────────── */

function ReportOverview({ report }: { report: MoodMapReport }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Overall Score */}
      <div className="glass-card rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Overall Score
        </div>
        <div className={`text-4xl font-bold ${scoreColor(report.overallScore)}`}>
          {report.overallScore > 0 ? "+" : ""}
          {report.overallScore.toFixed(2)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sentimentBg(report.overallSentiment)} ${sentimentColor(report.overallSentiment)}`}>
            {report.overallSentiment === "positive" ? "👍" : report.overallSentiment === "negative" ? "👎" : "😐"}{" "}
            {report.overallSentiment.charAt(0).toUpperCase() + report.overallSentiment.slice(1)}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="glass-card rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Confidence
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${confidenceBadge(report.confidence)}`}>
            {report.confidence.charAt(0).toUpperCase() + report.confidence.slice(1)}
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {report.segments.length} segments analyzed • {Math.round(report.durationSeconds)}s duration
        </div>
      </div>

      {/* Risk Alerts Count */}
      <div className="glass-card rounded-xl p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Risk Alerts
        </div>
        <div className={`text-4xl font-bold ${report.riskAlerts.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
          {report.riskAlerts.length}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {report.riskAlerts.length === 0
            ? "No reputation risks detected"
            : `${report.riskAlerts.filter((a) => a.severity === "high").length} high severity`}
        </div>
      </div>
    </div>
  );
}

/* ─── Modality Status ─────────────────────────────────────────────────────── */

function ModalityStatusCard({ modalities }: { modalities: ModalityStatus[] }) {
  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
        Modality Fusion
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modalities.map((m) => (
          <div
            key={m.kind}
            className={`rounded-lg border p-3 ${
              m.available
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-slate-700/50 bg-slate-800/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${m.available ? "bg-emerald-400" : "bg-slate-600"}`} />
              <span className="text-xs font-medium text-slate-300 capitalize">
                {m.kind}
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                {(m.weight * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Emotion Distribution ────────────────────────────────────────────────── */

function EmotionDistributionCard({
  distribution,
}: {
  distribution: EmotionDistribution[];
}) {
  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
        Top Emotions Distribution
      </h3>
      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.emotion} className="flex items-center gap-3">
            <span className="text-lg w-7 text-center">{emotionEmoji(item.emotion)}</span>
            <span className="text-sm text-slate-300 w-20 capitalize">{item.emotion}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.emotion === "joy"
                    ? "bg-emerald-500"
                    : item.emotion === "anger" || item.emotion === "disgust"
                      ? "bg-red-500"
                      : item.emotion === "sadness" || item.emotion === "fear"
                        ? "bg-amber-500"
                        : item.emotion === "surprise"
                          ? "bg-purple-500"
                          : "bg-slate-500"
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-14 text-right">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Segment Timeline ────────────────────────────────────────────────────── */

function SegmentTimeline({ segments }: { segments: SegmentAnalysis[] }) {
  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
        Emotional Journey (Segment Timeline)
      </h3>

      {/* Visual bar chart */}
      <div className="flex items-end gap-1 mb-4 h-24">
        {segments.map((seg) => {
          const normalizedHeight = ((seg.score + 1) / 2) * 100; // Map -1..1 to 0..100
          return (
            <div
              key={seg.index}
              className="flex-1 flex flex-col items-center justify-end group relative"
              title={`${seg.timeLabel}: ${seg.emotion} (${seg.score.toFixed(2)})`}
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${scoreBgBar(seg.score)} opacity-80 hover:opacity-100`}
                style={{ height: `${Math.max(4, normalizedHeight)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="glass-card rounded-lg px-2 py-1 text-xs text-slate-300 whitespace-nowrap border border-slate-700/50">
                  {seg.timeLabel} • {emotionEmoji(seg.emotion)} {seg.emotion} • {seg.score.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Segment detail table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="text-left py-2 px-2 text-slate-500 font-medium">Time</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium">Sentiment</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium">Emotion</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium">Score</th>
              <th className="text-left py-2 px-2 text-slate-500 font-medium hidden md:table-cell">Snippet</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg) => (
              <tr
                key={seg.index}
                className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
              >
                <td className="py-2 px-2 text-slate-300 font-mono">{seg.timeLabel}</td>
                <td className="py-2 px-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${sentimentBg(seg.sentiment)} ${sentimentColor(seg.sentiment)}`}>
                    {seg.sentiment === "positive" ? "👍" : seg.sentiment === "negative" ? "👎" : "😐"}
                    {" "}{seg.sentiment.charAt(0).toUpperCase() + seg.sentiment.slice(1)}
                  </span>
                </td>
                <td className="py-2 px-2 text-slate-300">
                  {emotionEmoji(seg.emotion)} {seg.emotion}
                </td>
                <td className={`py-2 px-2 font-mono font-semibold ${scoreColor(seg.score)}`}>
                  {seg.score > 0 ? "+" : ""}{seg.score.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-slate-500 max-w-xs truncate hidden md:table-cell">
                  {seg.snippet}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Key Moments ─────────────────────────────────────────────────────────── */

function KeyMomentsCard({ moments }: { moments: KeyMoment[] }) {
  if (moments.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
        Key Moments
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {moments.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${
              m.type === "peak"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{m.type === "peak" ? "📈" : "📉"}</span>
              <span className={`text-xs font-semibold ${m.type === "peak" ? "text-emerald-400" : "text-red-400"}`}>
                {m.type === "peak" ? "Positive Peak" : "Negative Dip"}
              </span>
              <span className="text-xs text-slate-500 ml-auto font-mono">
                {m.timeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {emotionEmoji(m.emotion)} {m.emotion}
              </span>
              <span className={`text-xs font-mono font-semibold ${scoreColor(m.score)}`}>
                {m.score > 0 ? "+" : ""}{m.score.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Risk Alerts ─────────────────────────────────────────────────────────── */

function RiskAlertsCard({ alerts }: { alerts: RiskAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 mb-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Reputation Risk Alerts
        </h3>
        <div className="flex items-center gap-3 text-emerald-400">
          <span className="text-2xl">✅</span>
          <span className="text-sm">No reputation risk alerts detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
        ⚠️ Reputation Risk Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${severityBadge(alert.severity)}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{alert.type}</span>
              <span className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${severityBadge(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs opacity-80">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Loading Spinner ─────────────────────────────────────────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="h-10 w-10 rounded-full border-2 border-slate-700 border-t-rose-500 animate-spin" />
      <p className="text-sm text-slate-500">Analyzing video mood…</p>
      <p className="text-xs text-slate-600">
        Fetching video data and running emotional analysis. This may take a moment.
      </p>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl">🎭</div>
      <h3 className="text-lg font-semibold text-slate-300">
        Analyze Video Mood &amp; Reputation Risk
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Enter a YouTube video URL above to generate a MoodMap report. The analysis
        will show the emotional journey, key moments, and reputation risk alerts.
      </p>
    </div>
  );
}

/* ─── Full Report View ────────────────────────────────────────────────────── */

function MoodMapReportView({ report }: { report: MoodMapReport }) {
  return (
    <div>
      {/* Video info header */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              🎭 MoodMap Report
            </h2>
            <p className="text-sm text-slate-300">{report.videoTitle}</p>
            <a
              href={report.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors mt-1 font-mono break-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {report.videoUrl}
            </a>
            {report.keywordContext && (
              <p className="text-xs text-slate-500 mt-1">
                Context: <span className="text-slate-400">{report.keywordContext}</span>
              </p>
            )}
          </div>
          <div className="text-xs text-slate-600 text-right flex-shrink-0">
            <p>Generated: {new Date(report.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <ReportOverview report={report} />
      <ModalityStatusCard modalities={report.modalities} />
      <EmotionDistributionCard distribution={report.emotionDistribution} />
      <SegmentTimeline segments={report.segments} />
      <KeyMomentsCard moments={report.keyMoments} />
      <RiskAlertsCard alerts={report.riskAlerts} />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function MoodMapPage() {
  const moodMap = useMoodMap();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    moodMap.analyze();
  }

  return (
    <>
      <Head>
        <title>MoodMap | REPSCAN</title>
      </Head>

      <div className="flex min-h-screen bg-[#030712]">
        <Sidebar />

        <main className="flex-1 ml-16">
          {/* ── Header ─────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#030712]/80 backdrop-blur-md">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <h1 className="text-lg font-bold text-white tracking-tight">MoodMap</h1>
              </div>

              {/* Video URL input */}
              <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3 max-w-3xl">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={moodMap.videoUrl}
                    onChange={(e) => moodMap.setVideoUrl(e.target.value)}
                    placeholder="Paste YouTube video URL…"
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-colors"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>

                <input
                  type="text"
                  value={moodMap.keywordContext}
                  onChange={(e) => moodMap.setKeywordContext(e.target.value)}
                  placeholder="Context (optional)…"
                  className="w-40 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-colors"
                />

                <button
                  type="submit"
                  disabled={moodMap.isLoading || !moodMap.videoUrl.trim()}
                  className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {moodMap.isLoading ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </form>
            </div>
          </header>

          {/* ── Content ────────────────────────────────────────── */}
          <div className="px-6 py-6 max-w-6xl mx-auto">
            {/* Error banner */}
            {moodMap.error && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                ⚠️ {moodMap.error}
              </div>
            )}

            {moodMap.isLoading ? (
              <LoadingSpinner />
            ) : moodMap.report ? (
              <MoodMapReportView report={moodMap.report} />
            ) : (
              <EmptyState />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
