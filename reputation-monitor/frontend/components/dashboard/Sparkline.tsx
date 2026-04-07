import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineProps {
  values: number[];
  stroke?: string;
}

export default function Sparkline({ values, stroke = "#F97360" }: SparklineProps) {
  const data = values.map((value, idx) => ({ idx, value }));

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 2 }}>
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: 12,
              color: "#334155",
            }}
            labelStyle={{ display: "none" }}
          />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
