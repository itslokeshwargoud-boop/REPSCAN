import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Brain,
  Star,
  BarChart3,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import {
  useReputationOs,
  type MoodMapReport,
} from "@/hooks/useReputationOs";
import ROLayout from "@/components/reputation-os/ROLayout";
import ROCard from "@/components/reputation-os/ROCard";
import ROBadge from "@/components/reputation-os/ROBadge";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />
  );
}

function sentimentColor(score: number): string {
  if (score > 0.3) return "#10b981";
  if (score < -0.3) return "#ef4444";
  return "#eab308";
}

function moodBadgeVariant(
  mood: string,
): "positive" | "negative" | "neutral" {
  const lower = mood.toLowerCase();
  if (
    lower.includes("positive") ||
    lower.includes("happy") ||
    lower.includes("joy")
  )
    return "positive";
  if (
    lower.includes("negative") ||
    lower.includes("angry") ||
    lower.includes("sad")
  )
    return "negative";
  return "neutral";
}

function intensityColor(intensity: number): string {
  if (intensity >= 0.7) return "text-red-400";
  if (intensity >= 0.4) return "text-yellow-400";
  return "text-emerald-400";
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function MoodMapContent() {
  const { tenantId } = useTenant();
  const { moodmap } = useReputationOs(tenantId);

  const data: MoodMapReport | undefined = moodmap.data;

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.segments.map((seg) => ({
      name: `${seg.start_time} - ${seg.end_time}`,
      score: seg.sentiment_score,
      isSpike: seg.is_spike,
      emotion: seg.dominant_emotion,
      comments: seg.comment_count,
    }));
  }, [data]);

  if (moodmap.isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-red-400">Failed to load MoodMap data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-white">MoodMap Intelligence</h1>
        {data && (
          <ROBadge variant={moodBadgeVariant(data.overall_mood)}>
            {data.overall_mood}
          </ROBadge>
        )}
      </div>

      {/* Summary card */}
      {moodmap.isLoading ? (
        <SkeletonBlock className="h-28 w-full" />
      ) : data ? (
        <ROCard title="Summary" icon={<Brain size={18} />}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Overall Mood</p>
              <p className="text-lg font-semibold text-white">
                {data.overall_mood}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Segments</p>
              <p className="text-lg font-semibold text-white">
                {data.segments.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Spike Count</p>
              <p className="text-lg font-semibold text-white">
                {data.spikes.length}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-500">Summary</p>
              <p className="text-sm text-slate-300">{data.summary}</p>
            </div>
          </div>
        </ROCard>
      ) : null}

      {/* Bar chart */}
      <ROCard
        title="Sentiment by Segment"
        subtitle="Bar color by sentiment score"
        icon={<BarChart3 size={18} />}
      >
        {moodmap.isLoading ? (
          <SkeletonBlock className="h-80 w-full" />
        ) : data ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 9 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[-1, 1]}
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
                formatter={(value) => [Number(value).toFixed(2), "Score"]}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={sentimentColor(entry.score)}
                    stroke={entry.isSpike ? "#f59e0b" : "transparent"}
                    strokeWidth={entry.isSpike ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4">
          {[
            { label: "Positive (>0.3)", color: "#10b981" },
            { label: "Neutral (-0.3 to 0.3)", color: "#eab308" },
            { label: "Negative (<-0.3)", color: "#ef4444" },
            { label: "★ Spike", color: "#f59e0b" },
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

      {/* Spike Events */}
      {data && data.spikes.length > 0 && (
        <ROCard title="Spike Events" icon={<Sparkles size={18} />}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.spikes.map((spike, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {spike.emotion}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Time: {spike.time}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Intensity:</span>
                  <span
                    className={`text-sm font-bold ${intensityColor(spike.intensity)}`}
                  >
                    {(spike.intensity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ROCard>
      )}

      {/* Segment Detail Table */}
      {data && (
        <ROCard title="Segment Details" icon={<MessageCircle size={18} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Time Range</th>
                  <th className="px-3 py-2">Emotion</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Comments</th>
                  <th className="px-3 py-2">Spike</th>
                </tr>
              </thead>
              <tbody>
                {data.segments.map((seg, idx) => (
                  <tr
                    key={seg.segment_index}
                    className={`border-b border-slate-800/40 ${
                      idx % 2 === 0 ? "bg-slate-900/20" : "bg-slate-900/40"
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">
                      {seg.segment_index}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {seg.start_time} – {seg.end_time}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {seg.dominant_emotion}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="font-mono font-semibold"
                        style={{ color: sentimentColor(seg.sentiment_score) }}
                      >
                        {seg.sentiment_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {seg.comment_count}
                    </td>
                    <td className="px-3 py-2">
                      {seg.is_spike ? (
                        <Star size={14} className="text-yellow-400" />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ROCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported page
// ---------------------------------------------------------------------------

export default function MoodMapPage() {
  return (
    <TenantProvider>
      <ROLayout activeModule="moodmap">
        <MoodMapContent />
      </ROLayout>
    </TenantProvider>
  );
}
