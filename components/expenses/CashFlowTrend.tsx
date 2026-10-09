"use client";

import {
  LineChart,
  Line,
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
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import {
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  getAxisTick,
  yAxisTitle,
} from "../dashboardComponents/chartCard";
import { ArrowLeftRight, AlertTriangle } from "lucide-react";
import { useCashFlowTrend } from "@/hooks/useCashFlowTrend";
import { CashFlowTrendSkeleton } from "./ExpenseAnalyticsSkeletons";
import { useEffect, useState } from "react";

const INFLOW_COLOR = "#22c55e";
const OUTFLOW_COLOR = "#ef4444";

/** Coerce a recharts payload value (number | string | array) to a number. */
const toNumber = (v: ValueType | undefined): number =>
  typeof v === "number" ? v : Number(v) || 0;

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string | number;
}) => {
  const { currency } = useCurrency();

  const fmtK = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  if (!active || !payload?.length) return null;
  const inflow = payload.find((p) => p.dataKey === "inflow");
  const outflow = payload.find((p) => p.dataKey === "outflow");
  const net = toNumber(inflow?.value) - toNumber(outflow?.value);

  return (
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.name ?? ""),
        color: entry.color ?? CHART_PALETTE.blue,
        value: fmtK(toNumber(entry.value)),
      }))}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#5f6368] dark:text-[#a9b4c7]">
            Net
          </span>
          <span
            className={`text-xs font-medium ${net >= 0 ? "text-[#1e8e3e] dark:text-[#10b981]" : "text-[#d93025] dark:text-[#f87171]"}`}
          >
            {net >= 0 ? "+" : ""}
            {fmtK(net)}
          </span>
        </div>
      }
    />
  );
};

export default function CashFlowTrend() {
  const { currency } = useCurrency();

  // Fixed six-month window — deliberately not the page's month/year filter.
  // See useCashFlowTrend for why.
  const { data, isLoading, isError, failedMonths } = useCashFlowTrend();

  const hasData = data.some((d) => d.inflow > 0 || d.outflow > 0);

  const fmtK = (v: number) => {
    return formatCompactCurrency(v, currency.symbol, currency.locale);
  };

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

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const updateScreenSize = () => {
      setIsSmallScreen(mediaQuery.matches);
    };

    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);

    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  if (isLoading)
    return (
      <>
        <CashFlowTrendSkeleton />
      </>
    );

  return (
    <ChartCard
      icon={ArrowLeftRight}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Cash Flow Trend"
      info={{
        heading: "Reading this chart",
        // From useCashFlowTrend: income is inflow, everything else outflow.
        body: "Six months to date, always — it ignores the month picked at the top of the page. Inflow is everything you logged as income that month; outflow is every other entry, so expenses. The hover box shows the two and what they leave behind.",
      }}
      subtitle="Monthly comparison of cash inflows vs outflows"
      buttons={
        // States plainly that this card ignores the page's month filter —
        // otherwise the fixed window looks like the filter is broken.
        <span className="shrink-0 rounded-full border bg-white dark:bg-white/5 px-2 py-0.5 text-[11px] border-[#dadce0] dark:border-white/15 text-[#3c4043] dark:text-[#e8ecf4]">
          Last 6 months
        </span>
      }
    >
      {failedMonths > 0 && !isError && (
        <p className="mb-3 flex items-center gap-1.5 text-[11px] text-[#e37400] dark:text-amber-400">
          <AlertTriangle size={12} className="shrink-0" />
          {failedMonths} of 6 months could not be loaded — the chart is
          incomplete.
        </p>
      )}
      {isError ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-400/10">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            Could not load cash flow
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            None of the last six months could be fetched.
          </p>
        </div>
      ) : !hasData ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <ArrowLeftRight
              size={22}
              className="text-[#9aa0a6] dark:text-[#9aa6bd]"
            />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No income or expenses recorded
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
            Nothing was logged in the last six months.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
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
                tickFormatter={fmtK}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={isSmallScreen ? 55 : 80}
                label={!isSmallScreen ? yAxisTitle("Amount") : undefined}
              />
              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey="inflow"
                name="Cash Inflow"
                stroke={INFLOW_COLOR}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "white",
                  stroke: INFLOW_COLOR,
                  strokeWidth: 2,
                }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="outflow"
                name="Cash Outflow"
                stroke={OUTFLOW_COLOR}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "white",
                  stroke: OUTFLOW_COLOR,
                  strokeWidth: 2,
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <ChartLegend
            items={[
              { label: "Cash Inflow", color: INFLOW_COLOR, shape: "line" },
              { label: "Cash Outflow", color: OUTFLOW_COLOR, shape: "line" },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}
