"use client";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Raw shape from backend — no color
export interface SegmentData {
  name: string;
  value: number;
}

// Internal shape with color assigned client-side
interface SegmentDataWithColor extends SegmentData {
  color: string;
}

interface CustomerSegmentationChartProps {
  data: SegmentData[];
}
const COLOR_PALETTE = [
  "#2581eb", // Active
  "#94a3b8", // Inactive
  "#22c55e", // New
  "#16f9a2", // New & Active
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  if (active && payload?.length) {
    const entry = payload[0].payload as SegmentDataWithColor;
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-500 text-xs">{entry.name}</p>
        <p className="font-bold text-sm" style={{ color: entry.color }}>
          {entry.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function CustomerSegmentationChart({
  data,
}: CustomerSegmentationChartProps) {
  const isEmpty = !data || data.length === 0;
  const coloredData: SegmentDataWithColor[] = (
    isEmpty
      ? [
          { name: "Active", value: 1020 },
          { name: "Inactive", value: 400 },
          { name: "New", value: 150 },
          { name: "New & Active", value: 80 },
        ]
      : data
  ).map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
  }));

  return (
    <div className="relative bg-white rounded-2xl px-4 py-3 border min-w-0 border-gray-100 shadow-md">
      {isEmpty && <SampleDataBadge />}

      <div>
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Customer Segmentation
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Active, Inactive, & New Customer distribution over the last 15 days
        </p>
      </div>

      <div className="h-44 sm:h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="65%"
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

      <div className="flex items-center justify-center gap-4 md:gap-6 mt-1 mb-1">
        {coloredData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 md:gap-2">
            <span
              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color,
              }}
            />
            <span className="text-xs md:text-sm text-gray-600">
              {entry.name}:{" "}
              <span className="font-bold text-gray-700">
                {entry.value.toLocaleString()}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
