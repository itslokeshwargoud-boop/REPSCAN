import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendDataPoint } from "@/lib/mockData";

interface TrendChartsProps {
  data: TrendDataPoint[];
  clientName: string;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    fontSize: 12,
    padding: "6px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
};

export default function TrendCharts({ data, clientName }: TrendChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Audience Interaction Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900">Audience Interaction Over Time</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How many people are engaging with {clientName}&apos;s content each month
          </p>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: unknown) => [`${value}%`, "Audience Interaction"]}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 3, fill: "#2563EB" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Public Opinion + Media Presence Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900">Public Opinion &amp; Media Presence</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How people feel about {clientName} and media coverage trends
          </p>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: unknown, name: unknown) => [
                  `${value}${name === "sentiment" ? "%" : "/100"}`,
                  name === "sentiment" ? "Public Opinion" : "Media Presence",
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) =>
                  value === "sentiment" ? "Public Opinion" : "Media Presence"
                }
                wrapperStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ r: 3, fill: "#16A34A" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="mediaPresence"
                stroke="#7C3AED"
                strokeWidth={2}
                dot={{ r: 3, fill: "#7C3AED" }}
                activeDot={{ r: 5 }}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
