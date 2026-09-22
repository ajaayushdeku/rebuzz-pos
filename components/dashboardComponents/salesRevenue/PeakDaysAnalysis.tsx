"use client";

import RangeBadge from "@/components/ui/RangeBadge";
import { CalendarDays } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BAR_RADIUS,
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

export interface PeakDayData {
  day: string;
  averageOrders: number;
  averageSales: number;
}

interface PeakDayDataProps {
  data: PeakDayData[];
}

const ORDERS_COLOR = CHART_PALETTE.blue;
const SALES_COLOR = CHART_PALETTE.teal;

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
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name),
        color: entry.color as string,
        value: (entry.value as number).toFixed(2),
      }))}
    />
  );
};

const PeakDaysAnalysis = ({ data }: PeakDayDataProps) => {
  // const hasData = data.some((d) => d.averageOrders > 0 || d.averageSales > 0);

  // ── Y-axis for counts ──
  // Averages can be fractional, so a step can be too (2.5, 0.5).
  const formatYAxis = (value: number): string =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.averageOrders, d.averageSales]),
    0,
  );
  // At least 0–4, so a quiet (or empty) range still counts in whole numbers
  // instead of stretching a fraction of one over the full height.
  const ticks = niceTicks(0, Math.max(maxVal, 4));

  return (
    <ChartCard
      icon={CalendarDays}
      title="Peak Days Analysis"
      info={{
        heading: "Reading this chart",
        // Verified against getPeakDaysData / averageCountsByWeekday.
        body: "For each weekday, the average number of orders (tickets created) and sales (bills) per day, over the date range at the top of the page. Both are counts, not amounts, and each weekday is averaged over only the dates that had any. The days run left to right, ending on the range's last day. Hover a day for the exact figures.",
      }}
      subtitle="Average orders and sales per weekday across the selected period"
      controls={<RangeBadge variant="pill" />}
    >
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
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              barCategoryGap="22%"
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={{ stroke: CHART_PALETTE.control }}
                tickSize={6}
                tick={AXIS_TICK}
              />

              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                ticks={ticks}
                domain={[ticks[0], ticks[ticks.length - 1]]}
                width={56}
                label={yAxisTitle("Avg. per day")}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(60,64,67,0.04)" }}
              />

              <Bar
                dataKey="averageOrders"
                name="Avg. Orders"
                fill={ORDERS_COLOR}
                maxBarSize={44}
                radius={BAR_RADIUS}
              />
              <Bar
                dataKey="averageSales"
                name="Avg. Sales"
                fill={SALES_COLOR}
                maxBarSize={44}
                radius={BAR_RADIUS}
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

      <ChartLegend
        items={[
          { label: "Avg. Orders", color: ORDERS_COLOR, shape: "dot" },
          { label: "Avg. Sales", color: SALES_COLOR, shape: "square" },
        ]}
      />
    </ChartCard>
  );
};

export default PeakDaysAnalysis;
