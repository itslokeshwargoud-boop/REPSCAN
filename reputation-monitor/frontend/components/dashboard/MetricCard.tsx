import Card from "@/components/dashboard/Card";
import DeltaChip from "@/components/dashboard/DeltaChip";
import Sparkline from "@/components/dashboard/Sparkline";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta: number;
  positiveIsGood?: boolean;
  sparkline: number[];
}

export default function MetricCard({ title, value, delta, positiveIsGood = true, sparkline }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        <DeltaChip delta={delta} positiveIsGood={positiveIsGood} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-2">
        <Sparkline values={sparkline} />
      </div>
    </Card>
  );
}
