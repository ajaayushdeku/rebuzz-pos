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
import {
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  getAxisTick,
  yAxisTitle,
} from "../chartCard";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

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

const SERIES = [
  { key: "inactive", label: "Inactive", color: "#EF4444" },
  { key: "active", label: "Active", color: "#10B981" },
  { key: "new", label: "New", color: "#F59E0B" },
  { key: "newActive", label: "New & Active", color: "#3b96ff" },
] as const;

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

/**
 * The two figures the stack hides.
 *
 * The four series are disjoint buckets, so the bar's height is every customer
 * on the books that month — and because `inactive` carries the whole back
 * catalogue, that height barely moves and says almost nothing about the month.
 * What actually happened in a month is who bought and who joined, and each of
 * those spans two buckets: someone who signed up and bought sits in
 * `newActive` and belongs in both counts.
 */
const boughtInMonth = (d: CustomerTrendData) =>
  (d.active || 0) + (d.newActive || 0);

const joinedInMonth = (d: CustomerTrendData) =>
  (d.new || 0) + (d.newActive || 0);

// Sub-components

/** Reversed, so it reads top-of-stack down — the order the bars appear in. */
const CustomLegend = () => (
  <ChartLegend
    items={[...SERIES].reverse().map(({ label, color }) => ({
      label,
      color,
      shape: "square" as const,
    }))}
  />
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
    <ChartTooltipBox
      label={label}
      rows={[...payload].reverse().map((entry) => ({
        name: String(entry.name ?? ""),
        color: (entry.color as string) ?? CHART_PALETTE.blue,
        value: (entry.value as number).toLocaleString(),
      }))}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#5f6368] dark:text-[#a9b4c7]">
            Total
          </span>
          <span className="text-xs font-medium text-[#3c4043] dark:text-[#e8ecf4]">
            {total.toLocaleString()}
          </span>
        </div>
      }
    />
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

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const AXIS_TICK = getAxisTick(isDark);

  return (
    <ChartCard
      icon={TrendingUp}
      title="Customer Trend"
      info={{
        heading: "Reading this chart",
        // Each bar is the whole base that month, split by activity.
        body: "Six months of your customer base, one bar per month. The bar is everyone on the books that month, split by how they behaved — so the bar's height is the base, not new sign-ups. The readout on the right is the latest month: how many bought, and how many joined.",
      }}
      subtitle="Monthly breakdown over the last 6 months"
      controls={
        !isEmpty &&
        latest && (
          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              {latest.month} · total customers
            </span>
            <p className="mt-0.5 text-base font-semibold leading-tight tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
              {stackTotal(latest).toLocaleString()}
            </p>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              <span className="tabular-nums">
                <span className="text-[#3c4043] dark:text-[#e8ecf4]">
                  {boughtInMonth(latest).toLocaleString()}
                </span>{" "}
                bought
              </span>
              <span className="tabular-nums">
                <span className="text-[#3c4043] dark:text-[#e8ecf4]">
                  {joinedInMonth(latest).toLocaleString()}
                </span>{" "}
                joined
              </span>
            </div>
          </div>
        )
      }
      className="min-w-0"
    >
      {isEmpty && <SampleDataBadge />}

      {/* Chart */}
      <div className="mt-5">
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
            <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              ticks={yTicks}
              domain={[0, yMax]}
              width={80}
              allowDecimals={false}
              label={yAxisTitle("Customers")}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: CHART_PALETTE.hover }}
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
    </ChartCard>
  );
}
