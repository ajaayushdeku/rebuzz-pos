"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { mockStaffHourlyOrderData } from "../../../lib/mockData/mock-staffdata";
import SampleDataBadge from "@/components/ui/sampledatabadge";

export interface StaffDataPoint {
  name: string;
  value: number | null;
}

export interface StaffHourlyData {
  hour: string;
  staff: StaffDataPoint[];
}

interface StaffOrdersChartProps {
  data: StaffHourlyData[];
}

const COLOR_PALETTE = [
  "#f472b6",
  "#60a5fa",
  "#f59e0b",
  "#34d399",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
];

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const activeEntries = payload.filter((p) => (p.value as number) > 0);
  if (!activeEntries.length) return null;

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-32">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {activeEntries.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color as string,
              }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {entry.value as number}
          </span>
        </div>
      ))}
    </div>
  );
};

interface CustomLegendProps {
  staffLines: { key: string; color: string }[];
}

const CustomLegend = ({ staffLines }: CustomLegendProps) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
    {staffLines.map(({ key, color }) => (
      <div key={key} className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-600">{key}</span>
      </div>
    ))}
  </div>
);

export default function StaffOrdersChart({ data }: StaffOrdersChartProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockStaffHourlyOrderData : data;
  const staffLines = (displayData[0]?.staff ?? []).map((s, i) => ({
    key: s.name,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
  }));

  const flatData = displayData.map(({ hour, staff }) => ({
    hour,
    ...Object.fromEntries(staff.map((s) => [s.name, s.value])),
  }));

  // Dynamic Y-axis: find the max value across all staff hours, add padding
  const allValues = flatData.flatMap((entry) =>
    Object.entries(entry)
      .filter(([key]) => key !== "hour")
      .map(([, val]) => Number(val) || 0),
  );
  const dataMax = Math.max(...allValues, 0);
  const paddedMax = Math.ceil((dataMax * 1.2) / 10) * 10 || 60; // 20% padding, round to nearest 10
  const tickStep = Math.max(1, Math.ceil(paddedMax / 5 / 5) * 5); // ~5 ticks, round to 5
  const yTicks = Array.from(
    { length: Math.floor(paddedMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg p-6 transition duration-300 w-full">
      {isEmpty && <SampleDataBadge />}
      <div className="mb-6">
        <h2 className="text-[16px] md:text-xl font-bold text-gray-900">
          Orders Per Hour by Staff
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Throughput breakdown across the day per team member.
        </p>
      </div>

      <div className="h-55 md:h-75">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={flatData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9ca3af",
                fontSize: 12,
              }}
              ticks={yTicks}
              domain={[0, paddedMax]}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend staffLines={staffLines} />} />
            {staffLines.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: color,
                  stroke: color,
                }}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
