"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ChartColumnBig } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useMonthlyTaxTrend } from "@/hooks/useMonthlyTaxTrend";
import {
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  getAxisTick,
  yAxisTitle,
} from "../chartCard";
import { TaxTrendChartSkeleton } from "./TaxAnalyticsSkeletons";
import { useEffect, useState } from "react";

const RATE_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);
  const total = payload.reduce((s, e) => s + (Number(e.value) || 0), 0);

  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: entry.color ?? CHART_PALETTE.blue,
        value: fmt(Number(entry.value) || 0),
      }))}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#5f6368] dark:text-[#a9b4c7]">
            Total
          </span>
          <span className="text-xs font-medium text-[#3c4043] dark:text-[#e8ecf4]">
            {fmt(total)}
          </span>
        </div>
      }
    />
  );
};

export default function MonthlyTaxTrendChart() {
  const { currency } = useCurrency();
  const { data, isLoading, isError } = useMonthlyTaxTrend();

  const rows = data?.rows ?? [];
  const series = data?.series ?? [];

  const formatY = (v: number) =>
    formatCompactCurrency(v, currency.symbol, currency.locale);

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
      icon={ChartColumnBig}
      title="Monthly Tax Trend"
      info={{
        heading: "Reading this chart",
        // From useMonthlyTaxTrend, and the note this card used to carry.
        body: "Each bar stacks the tax generated that month by the rate applied on the bills, so you can see your total tax load trending over time. It covers the last six calendar months and ignores the date range at the top of the page; refunded bills are left out.",
      }}
      subtitle="Tax generated over the last 6 months, broken down by applied rate"
      className="h-full"
    >
      {isLoading ? (
        <TaxTrendChartSkeleton />
      ) : isError ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-[#d93025] dark:text-[#f87171]">
          Failed to load tax trend
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={rows}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              barCategoryGap="30%"
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
                tickFormatter={formatY}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={80}
                label={yAxisTitle("Tax generated")}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: CHART_PALETTE.hover }}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="tax"
                  fill={RATE_COLORS[i % RATE_COLORS.length]}
                  // Soft corners on the top of the stack only.
                  radius={i === series.length - 1 ? BAR_RADIUS : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <ChartLegend
            items={series.map((s, i) => ({
              label: s.label,
              color: RATE_COLORS[i % RATE_COLORS.length],
              shape: "square" as const,
            }))}
          />
        </>
      )}
    </ChartCard>
  );
}
