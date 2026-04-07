export type SeverityLevel = "low" | "medium" | "high";

interface SeverityPillProps {
  severity: SeverityLevel;
}

export default function SeverityPill({ severity }: SeverityPillProps) {
  const tone: Record<SeverityLevel, string> = {
    high: "border-rose-200 bg-rose-50 text-rose-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${tone[severity]}`}>
      {severity}
    </span>
  );
}
