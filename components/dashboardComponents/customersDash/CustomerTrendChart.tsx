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
  repeat: number;
  new: number;
}

export interface CustomerTrendProps {
  data: CustomerTrendData[];
  totalCustomers: number;
}

// Helpers

const getYAxisConfig = (totalCustomers: number) => {
  if (totalCustomers <= 10) {
    return {
      max: 10,
      ticks: [0, 2, 4, 6, 8, 10],
    };
  }

  const step = Math.ceil(totalCustomers / 5);
  const max = Math.ceil((totalCustomers * 1.1) / step) * step;

  const ticks = Array.from(
    { length: Math.floor(max / step) + 1 },
    (_, i) => i * step,
  );

  return { max, ticks };
};

// Sub-components

// Bottom bar — flat top since another bar sits on it
const RepeatBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[0, 0, 0, 0]} fill="#60a5fa" />
);

// Top bar — rounded top corners only
const NewBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={[6, 6, 0, 0]} fill="#34d399" />
);

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    {[
      { label: "New", color: "#34d399" },
      { label: "Repeat", color: "#60a5fa" },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
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
  const { ticks: yTicks, max: yMax } = getYAxisConfig(totalCustomers);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full mt-4">
      {isEmpty && <SampleDataBadge />}
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
          New vs Repeat Customer Trend
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
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

          {/* stackId ties both bars together — repeat on bottom, new on top */}
          <Bar
            dataKey="repeat"
            name="Repeat"
            stackId="customers"
            shape={RepeatBar}
          />
          <Bar dataKey="new" name="New" stackId="customers" shape={NewBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
