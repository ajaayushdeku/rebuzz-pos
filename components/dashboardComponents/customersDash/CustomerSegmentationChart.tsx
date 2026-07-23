"use client";
import { ComponentHeader } from "@/components/ComponentHeader";
import { ChartPie } from "lucide-react";
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
  "#10B981", // New
  "#F59E0B", // Active
  "#EF4444", // Inactive
  "#3b96ff", // New & Active
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
  // An all-zero response draws no slices at all, so treat it as empty too.
  const isEmpty =
    !data || data.length === 0 || data.every((d) => d.value === 0);
  const coloredData: SegmentDataWithColor[] = (data ?? []).map((entry, i) => ({
    ...entry,
    color: COLOR_PALETTE[i % COLOR_PALETTE.length],
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full min-w-0">
      {/* Header */}
      <div className="mb-1 ">
        <ComponentHeader
          title="Customer Segmentation"
          subHeader=" Customer Activity distribution over the last 15 days"
        />
      </div>

      {/* Pie Chart + Legend */}
      {isEmpty ? (
        <div className="h-40 sm:h-60 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <ChartPie size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No customer activity
          </p>
          <p className="text-xs text-gray-400 max-w-[15rem]">
            Segments appear once customers place orders in the last 15 days.
          </p>
        </div>
      ) : (
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
                className="flex items-center justify-center gap-2 w-20 sm:w-24 md:w-28 lg:w-32 "
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
      )}
    </div>
  );
}
