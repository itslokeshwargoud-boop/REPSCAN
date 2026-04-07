export type SeverityLevel = "low" | "medium" | "high";

interface SeverityPillProps {
  severity: SeverityLevel;
}

export default function SeverityPill({ severity }: SeverityPillProps) {
  const tone: Record<SeverityLevel, string> = {
    high: "border-rose-700/40 bg-rose-900/30 text-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.2)]",
    medium: "border-orange-700/40 bg-orange-900/30 text-orange-400",
    low: "border-slate-700/40 bg-slate-800/40 text-slate-400",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${tone[severity]}`}>
      {severity}
    </span>
  );
}
