"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import { mockCustomerTrendData } from "@/lib/mockData/mock-customer-data";
import { ComponentHeader } from "@/components/ComponentHeader";
import { TrendingUp } from "lucide-react";

// Types

export interface CustomerTrendData {
  month: string;
  active: number;
  inactive: number;
  new: number;
  newActive: number;
  totalCustomers?: number; // Optional, can be calculated from active + inactive
}

// Series

/**
 * Bottom of the stack first. One list drives the bars, the legend and the
 * colours together — previously the four `<Bar>`s, four near-identical shape
 * components and a hand-written legend array each repeated the same hex codes,
 * and the legend was ordered Active/Inactive/New/… while the stack was ordered
 * Inactive/Active/New/…, so the two could not be read against each other.
 *
 * Colours match CustomerSegmentationChart's segments, which are the same four
 * categories.
 */
const SERIES = [
  { key: "inactive", label: "Inactive", color: "#EF4444" },
  { key: "active", label: "Active", color: "#10B981" },
  { key: "new", label: "New", color: "#F59E0B" },
  { key: "newActive", label: "New & Active", color: "#3b96ff" },
] as const;

/**
 * One shape per series, built once at module scope. Defining these inside the
 * component would hand Recharts a new component type on every render.
 */
const BAR_SHAPES = SERIES.map(({ color }, i) => {
  const isTop = i === SERIES.length - 1;
  const radius: [number, number, number, number] = isTop
    ? [6, 6, 0, 0]
    : [0, 0, 0, 0];
  return function SeriesBar(props: BarShapeProps) {
    return <Rectangle {...props} radius={radius} fill={color} />;
  };
});

// Helpers

const getYAxisConfig = (maxStackValue: number) => {
  if (maxStackValue <= 10) {
    return {
      max: 10,
      ticks: [0, 2, 4, 6, 8, 10],
    };
  }

  const step = Math.ceil(maxStackValue / 5);
  const max = Math.ceil((maxStackValue * 1.15) / step) * step;

  const ticks = Array.from(
    { length: Math.floor(max / step) + 1 },
    (_, i) => i * step,
  );

  return { max, ticks };
};

const stackTotal = (d: CustomerTrendData) =>
  (d.active || 0) + (d.inactive || 0) + (d.new || 0) + (d.newActive || 0);

// Sub-components

/** Reversed, so it reads top-of-stack down — the order the bars appear in. */
const CustomLegend = () => (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-x-6">
    {[...SERIES].reverse().map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
    ))}
  </div>
);

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value as number), 0);
  return (
    <div className="min-w-36 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-2 text-xs font-medium text-gray-400">{label}</p>
      {[...payload].reverse().map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs capitalize text-gray-600">
              {entry.name}
            </span>
          </div>
          <span className="text-xs font-bold tabular-nums text-gray-800">
            {(entry.value as number).toLocaleString()}
          </span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2">
        <span className="text-xs text-gray-400">Total</span>
        <span className="text-xs font-bold tabular-nums text-gray-900">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// Chart

export interface CustomerTrendProps {
  data: CustomerTrendData[];
}

export default function CustomerTrendChart({ data }: CustomerTrendProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockCustomerTrendData : data;

  // Find the max stacked bar height across all months
  const maxStackHeight = Math.max(...displayData.map(stackTotal), 1);
  const { ticks: yTicks, max: yMax } = getYAxisConfig(maxStackHeight);

  const latest = displayData[displayData.length - 1];

  return (
    <div className=" w-full min-w-0 rounded-2xl p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      {isEmpty && <SampleDataBadge />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <TrendingUp size={15} className="text-blue-600" />
          </div>
          <ComponentHeader
            title="Customer Trend"
            subHeader="Monthly breakdown over the last 6 months"
          />
        </div>

        {/* Latest month's total — the stack shows the mix but never the size
            of the most recent bar as a figure. Hidden while showing samples. */}
        {!isEmpty && latest && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {latest.month}
            </span>
            <p className="mt-0.5 text-base font-bold leading-tight tabular-nums text-gray-900">
              {stackTotal(latest).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mt-8">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={displayData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 10,
            }}
            barCategoryGap="20%"
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />

            <XAxis
              dataKey="month"
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
              domain={[0, yMax]}
              width={35}
              allowDecimals={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Legend content={<CustomLegend />} />

            {/* stackId ties all bars together — stacked from bottom to top */}
            {SERIES.map(({ key, label, color }, i) => (
              <Bar
                key={key}
                dataKey={key}
                name={label}
                stackId="customers"
                shape={BAR_SHAPES[i]}
                fill={color}
                maxBarSize={56}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
