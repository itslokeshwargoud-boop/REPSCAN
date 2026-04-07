interface DeltaChipProps {
  delta: number;
  positiveIsGood?: boolean;
}

export default function DeltaChip({ delta, positiveIsGood = true }: DeltaChipProps) {
  const isPositive = delta >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  const tone = isGood
    ? "border-emerald-700/40 bg-emerald-900/30 text-emerald-400"
    : "border-rose-700/40 bg-rose-900/30 text-rose-400";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}>
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}
