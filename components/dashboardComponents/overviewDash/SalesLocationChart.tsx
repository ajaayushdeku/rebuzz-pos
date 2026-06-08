"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export interface LocationData {
  name: string;
  value: number;
}

interface LocationDataWithColor extends LocationData {
  color: string;
}
interface SalesLocationChartProps {
  data: LocationData[];
}

const COLOR_PALETTE = [
  "#60a5fa",
  "#a78bfa",
  "#ec4899",
  "#34d399",
  "#f59e0b",
  "#f87171",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  if (active && payload?.length) {
    const entry = payload[0].payload as LocationDataWithColor;
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-500 text-xs">{entry.name}</p>
        <p className="font-bold text-sm" style={{ color: entry.color }}>
          {entry.value}%
        </p>
      </div>
    );
  }
  return null;
};

const SalesLocationChart = ({ data }: SalesLocationChartProps) => {
  const coloredData: LocationDataWithColor[] = data.map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
  }));

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 md:p-8 shadow-md hover:shadow-lg transition duration-300">
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Sales by Location
        </h2>

        <p className="text-xs text-gray-400 mt-0.5">
          Revenue share across branches
        </p>
      </div>

      <div className="flex items-center justify-center py-2">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {coloredData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 space-y-3 px-2">
        {coloredData.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: entry.color,
                }}
              />
              <span className="text-sm text-gray-700">{entry.name}</span>
            </div>

            <div className="flex-1 mx-4">
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${entry.value}%`,
                    backgroundColor: entry.color,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>

            <span className="text-sm font-semibold text-gray-700 w-10 text-right">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesLocationChart;
