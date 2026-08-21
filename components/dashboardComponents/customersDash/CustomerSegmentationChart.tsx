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
  share: number;
}

interface CustomerSegmentationChartProps {
  data: SegmentData[];
}

/**
 * Colour is bound to the segment name, not to its position in the array.
 * getCustomerSegmentation returns Active, Inactive, New, New & Active — while
 * the old positional palette was written for New, Active, Inactive, … so New
 * customers were drawn in red and Inactive ones in amber. Keying by name means
 * a reorder on the server can't silently swap the meanings again.
 */
const SEGMENT_COLORS: Record<string, string> = {
  Active: "#10B981", // emerald — buying
  "New & Active": "#3b96ff", // blue — new and already buying
  New: "#F59E0B", // amber — signed up, not yet buying
  Inactive: "#EF4444", // red — lapsed
};

/** Fallback for a segment name the map doesn't know. */
const FALLBACK_COLORS = ["#8B5CF6", "#06B6D4", "#F97316", "#64748B"];

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
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs capitalize text-gray-600">{entry.name}</span>
        </div>
        <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">
          {entry.value.toLocaleString()}
          <span className="ml-1.5 text-xs font-medium text-gray-400">
            {entry.share.toFixed(1)}%
          </span>
        </p>
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

  const total = (data ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0);

  const coloredData: SegmentDataWithColor[] = (data ?? []).map((entry, i) => ({
    ...entry,
    color:
      SEGMENT_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    share: total > 0 ? (entry.value / total) * 100 : 0,
  }));

  return (
    <div className=" w-full min-w-0 rounded-2xl  p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
          <ChartPie size={15} className="text-sky-600" />
        </div>
        <ComponentHeader
          title="Customer Segmentation"
          subHeader="Customer activity distribution over the last 15 days"
        />
      </div>

      {/* Pie Chart + Legend */}
      {isEmpty ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center sm:h-60">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ChartPie size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No customer activity
          </p>
          <p className="max-w-[15rem] text-xs text-gray-400">
            Segments appear once customers place orders in the last 15 days.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col">
          {/* The donut hole was empty; the total belongs there, where the eye
              lands first. The overlay ignores pointer events so slice hover
              and the tooltip still work through it. */}
          <div className="relative h-40 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coloredData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
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

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-bold tabular-nums leading-none text-gray-900 sm:text-2xl">
                {total.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Customers
              </p>
            </div>
          </div>

          {/* Legend — aligned rows rather than fixed-width centred blocks, so
              the counts line up in a column and long names can't push the
              value out of the card. */}
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-gray-100 pt-3 sm:grid-cols-2">
            {coloredData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                  {entry.name}
                </span>
                <span className="flex flex-row items-center">
                  {" "}
                  <span className="shrink-0 text-xs font-bold tabular-nums text-gray-800">
                    {entry.value.toLocaleString()}
                  </span>
                  <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-gray-400">
                    [ {entry.share.toFixed(0)}% ]
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
