interface DeltaChipProps {
  delta: number;
  positiveIsGood?: boolean;
}

export default function DeltaChip({ delta, positiveIsGood = true }: DeltaChipProps) {
  const isPositive = delta >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  const tone = isGood
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  );
}
