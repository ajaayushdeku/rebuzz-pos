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
      <div className="flex flex-row gap-2 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: entry.color as string,
            }}
          />
          <span className="text-xs text-gray-600 capitalize">{entry.name}</span>
        </div>
        <span
          className={`text-xs font-bold text-gray-800 `}
          style={{ color: entry.color }}
        >
          {entry.value.toLocaleString()}
        </span>
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
          { name: "Active", value: 0 },
          { name: "Inactive", value: 0 },
          { name: "New", value: 0 },
          { name: "New & Active", value: 0 },
        ]
      : data
  ).map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full min-w-0">
      {isEmpty && <SampleDataBadge />}

      {/* Header */}
      <div className="mb-1 ">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Customer Segmentation
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Customer Activity distribution over the last 15 days
        </p>
      </div>

      {/* Pie Chart + Legend */}
      <div className="flex flex-col">
        <div className="h-40 sm:h-60 ">
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

        <div className="grid grid-cols-2 gap-1">
          {coloredData.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-center gap-2 w-20 sm:w-24 md:w-28 lg:w-32 rounded-lg bg-gray-50"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-500">{entry.name}: </span>
                <span className="text-xs font-bold text-gray-800">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
