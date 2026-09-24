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

import SampleDataBadge from "@/components/ui/sampledatabadge";
import { CustomTooltipProps } from "@/lib/types/chart";
import { mockYearOverYearData } from "@/lib/mockData/mock-growthtrackerdata";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  yAxisTitle,
} from "@/components/dashboardComponents/chartCard";
import { ChartColumnBig } from "lucide-react";

/** The two years' colours, shared by the bars, legend and hover box. */
const LAST_YEAR_COLOR = CHART_PALETTE.control;
const THIS_YEAR_COLOR = CHART_PALETTE.blue;
// Types

export interface YoYData {
  month: string;
  lastYear: number;
  thisYear: number;
}

// Helpers

const getYAxisTicks = (data: YoYData[]): number[] => {
  const max = Math.max(...data.flatMap((d) => [d.lastYear, d.thisYear]), 1);
  const rawStep = max / 4;
  // Round step up to nice human-readable numbers
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep) || 0));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  return [0, step, step * 2, step * 3, step * 4];
};

// Sub-components

const LastYearBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={BAR_RADIUS} fill={LAST_YEAR_COLOR} />
);

const ThisYearBar = (props: BarShapeProps) => (
  <Rectangle {...props} radius={BAR_RADIUS} fill={THIS_YEAR_COLOR} />
);

const CustomLegend = () => (
  <ChartLegend
    items={[
      { label: "Last Year", color: LAST_YEAR_COLOR, shape: "square" },
      { label: "This Year", color: THIS_YEAR_COLOR, shape: "square" },
    ]}
  />
);

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const lastYear = payload.find((p) => p.dataKey === "lastYear");
  const thisYear = payload.find((p) => p.dataKey === "thisYear");
  const lastVal = (lastYear?.value as number) ?? 0;
  const thisVal = (thisYear?.value as number) ?? 0;

  // Compute YoY growth percentage
  // When last year was $0 and this year has revenue → show +100% growth
  // When both are $0 → show 0%
  let growth: string | null = null;
  if (lastVal === 0 && thisVal === 0) {
    growth = "0.0";
  } else if (lastVal === 0 && thisVal > 0) {
    growth = "100.0";
  } else if (lastVal === 0 && thisVal < 0) {
    growth = "-100.0";
  } else {
    const pct = ((thisVal - lastVal) / lastVal) * 100;
    if (isFinite(pct)) {
      growth = pct.toFixed(1);
    } else {
      growth = "0.0";
    }
  }

  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: (entry.color as string) ?? THIS_YEAR_COLOR,
        value: formatCurrencySymbol(
          entry.value as number,
          currency.symbol,
          currency.locale,
        ),
      }))}
      footer={
        growth !== null ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs" style={{ color: CHART_PALETTE.axis }}>
              YoY Growth
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{
                color:
                  Number(growth) >= 0 ? CHART_PALETTE.good : CHART_PALETTE.bad,
              }}
            >
              {Number(growth) >= 0 ? "+" : ""}
              {growth}%
            </span>
          </div>
        ) : undefined
      }
    />
  );
};

// Chart
export interface YearOverYearProps {
  data: YoYData[];
}
export default function YearOverYearChart({ data }: YearOverYearProps) {
  const isEmpty = !data || data.length === 0;
  const displayData = isEmpty ? mockYearOverYearData : data;

  const { currency } = useCurrency();

  const formatYAxis = (value: number): string =>
    formatCompactCurrency(value, currency.symbol, currency.locale);

  const yTicks = getYAxisTicks(displayData);
  const yMax = yTicks[yTicks.length - 1] * 1.05;

  return (
    <ChartCard
      icon={ChartColumnBig}
      title="Year-over-Year Revenue"
      info={{
        heading: "Reading this chart",
        // Same month, two years, side by side.
        body: "Each month's revenue this year beside the same month last year. Hover a month for both figures and the growth between them. A month last year with no sales counts as +100% growth rather than an impossible percentage.",
      }}
      subtitle="This year vs last year — monthly comparison"
    >
      {isEmpty && <SampleDataBadge />}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={displayData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
          }}
          barCategoryGap="25%"
          barGap={3}
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
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            ticks={yTicks}
            domain={[0, yMax]}
            width={80}
            label={yAxisTitle("Revenue")}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: CHART_PALETTE.hover }}
          />

          <Legend content={<CustomLegend />} />

          <Bar dataKey="lastYear" name="Last Year" shape={LastYearBar} />

          <Bar dataKey="thisYear" name="This Year" shape={ThisYearBar} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
