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
    <Card className="p-5 group relative overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(244,63,94,0.08), transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <DeltaChip delta={delta} positiveIsGood={positiveIsGood} />
        </div>
        <p className="mt-3 text-3xl font-black tracking-tighter text-slate-100 tabular-nums">{value}</p>
        <div className="mt-3 rounded-xl border border-slate-800/50 bg-slate-800/30 px-2">
          <Sparkline values={sparkline} />
        </div>
      </div>
    </Card>
  );
}
