import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineProps {
  values: number[];
  stroke?: string;
}

export default function Sparkline({ values, stroke = "#f43f5e" }: SparklineProps) {
  const data = values.map((value, idx) => ({ idx, value }));

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 2 }}>
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #334155",
              backgroundColor: "#0f172a",
              fontSize: 12,
              color: "#e2e8f0",
            }}
            labelStyle={{ display: "none" }}
          />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
