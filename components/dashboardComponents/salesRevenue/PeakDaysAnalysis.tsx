"use client";

import { ComponentHeader } from "@/components/ComponentHeader";
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

export interface PeakDayData {
  day: string;
  averageOrders: number;
  averageSales: number;
}

interface PeakDayDataProps {
  data: PeakDayData[];
}

const ORDERS_COLOR = "#8B5CF6";
const SALES_COLOR = "#3d98ee";

interface DayTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
    payload: PeakDayData;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: DayTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 min-w-44">
        <p className="text-gray-400 text-xs mb-1.5">{label}</p>
        {payload.map((entry) => (
          <div
            key={entry.dataKey as string}
            className="flex items-center justify-between gap-4 mb-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color as string }}
              />
              <span className="text-xs text-gray-600">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-gray-800">
              {(entry.value as number).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {[
      { label: "Avg. Orders", color: ORDERS_COLOR },
      { label: "Avg. Sales", color: SALES_COLOR },
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

const PeakDaysAnalysis = ({ data }: PeakDayDataProps) => {
  // const hasData = data.some((d) => d.averageOrders > 0 || d.averageSales > 0);

  // ── Y-axis for counts (integers) ──
  const formatYAxis = (value: number): string =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.averageOrders, d.averageSales]),
    0,
  );
  const domainMax = maxVal <= 0 ? 5 : Math.max(5, Math.ceil(maxVal * 1.15));
  const tickStep = Math.max(1, Math.ceil(domainMax / 5));
  const ticks = Array.from(
    { length: Math.floor(domainMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  const OrdersBar = (props: BarShapeProps) => (
    <Rectangle {...props} radius={[6, 6, 0, 0]} fill={ORDERS_COLOR} />
  );
  const SalesBar = (props: BarShapeProps) => (
    <Rectangle {...props} radius={[6, 6, 0, 0]} fill={SALES_COLOR} />
  );

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full">
      {/* HEADER */}
      <div className="mb-4 md:mb-6">
        <ComponentHeader
          title="Peak Days Analysis"
          subHeader="Average orders and sales per weekday across the selected period"
        />
      </div>

      {/* CHART */}
      <div
        className="overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div style={{ minWidth: 560 }}>
          {/* {hasData ? ( */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              barCategoryGap="15%"
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke="#f3f4f6" />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                dy={8}
              />

              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                ticks={ticks}
                domain={[0, domainMax]}
                allowDecimals={false}
                width={45}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(58,124,237,0.06)" }}
              />

              <Legend content={<CustomLegend />} />

              <Bar
                dataKey="averageOrders"
                name="Avg. Orders"
                shape={OrdersBar}
                fill={ORDERS_COLOR}
              />
              <Bar
                dataKey="averageSales"
                name="Avg. Sales"
                shape={SalesBar}
                fill={SALES_COLOR}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* // ) : (
          //   <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          //     <p className="text-sm">No data for the selected period</p>
          //     <p className="text-xs mt-1">Try adjusting the date range above</p>
          //   </div>
          // )} */}
        </div>
      </div>
    </div>
  );
};

export default PeakDaysAnalysis;
