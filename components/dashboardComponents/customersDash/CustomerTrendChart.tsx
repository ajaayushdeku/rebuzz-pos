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

// Types

export interface CustomerTrendData {
  month: string;
  active: number;
  inactive: number;
  new: number;
  newActive: number;
  totalCustomers?: number; // Optional, can be calculated from active + inactive
}

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

// Sub-components

// Bottom bar — Active
const ActiveBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[0, 0, 0, 0]} fill="#2581eb" />
);

// Inactive
const InactiveBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[0, 0, 0, 0]} fill="#94a3b8" />
);

// New Customer
const NewBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[0, 0, 0, 0]} fill="#22c55e" />
);

// New & Active Customer (top segment)
const NewActiveBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[6, 6, 0, 0]} fill="#16f9a2" />
);
const CustomLegend = () => (
  <div className="flex items-center justify-center gap-4 md:gap-6 mt-2 flex-wrap">
    {[
      { label: "Active", color: "#2581eb" },
      { label: "Inactive", color: "#94a3b8" },
      { label: "New", color: "#22c55e" },
      { label: "New & Active", color: "#16f9a2" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs md:text-sm text-gray-600">{label}</span>
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
    <div className="bg-white rounded-xl px-4 py-3 my-4 shadow-lg border border-gray-100 min-w-32">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {[...payload].reverse().map((entry) => (
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
            <span className="text-xs text-gray-600 capitalize">
              {entry.name}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {entry.value as number}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
        <span className="text-xs text-gray-400">Total</span>
        <span className="text-xs font-bold text-gray-800">{total}</span>
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
  const maxStackHeight = Math.max(
    ...displayData.map(
      (d) =>
        (d.active || 0) + (d.inactive || 0) + (d.new || 0) + (d.newActive || 0),
    ),
    1,
  );
  const { ticks: yTicks, max: yMax } = getYAxisConfig(maxStackHeight);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4">
      {isEmpty && <SampleDataBadge />}
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Customer Trend
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Monthly breakdown over the last 6 months
        </p>
      </div>

      {/* Chart */}
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
              fontSize: 13,
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
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Legend content={<CustomLegend />} />

          {/* stackId ties all bars together — stacked from bottom to top */}
          <Bar
            dataKey="inactive"
            name="Inactive"
            stackId="customers"
            shape={InactiveBar}
            fill="#94a3b8"
          />
          <Bar
            dataKey="active"
            name="Active"
            stackId="customers"
            shape={ActiveBar}
            fill="#2581eb"
          />
          <Bar
            dataKey="new"
            name="New"
            stackId="customers"
            shape={NewBar}
            fill="#22c55e"
          />
          <Bar
            dataKey="newActive"
            name="New & Active"
            stackId="customers"
            shape={NewActiveBar}
            fill="#16f9a2"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
