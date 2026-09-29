"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeftRight, Info } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import ExpenseBadge from "@/components/ui/ExpenseBadge";
import type {
  ProfitVariance,
  VarianceBar,
} from "@/services/dashboardServices/apiProfitCost";
import {
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  getAxisTick,
  niceTicks,
  yAxisTitle,
} from "../chartCard";
import { useEffect, useState } from "react";

// The same colours as the Profit Waterfall Bridge above it: revenue in the
// muted blue, a cost in its red, a gain in the light green, and the two
// net-profit ends in a neutral grey.
const BAR_COLORS: Record<VarianceBar["type"], string> = {
  base: CHART_PALETTE.subtitle,
  revenue: CHART_PALETTE.darkBlue,
  positive: "#34a853",
  negative: "#F43F5E",
  result: CHART_PALETTE.subtitle,
};

const BELOW_ZERO = "#b91c1c";
const KEEPS_COLOUR: VarianceBar["type"][] = ["revenue", "base", "result"];

const barFill = (bar: VarianceBar) =>
  bar.value < 0 && !KEEPS_COLOUR.includes(bar.type)
    ? BELOW_ZERO
    : BAR_COLORS[bar.type];

const LEGEND_ITEMS = [
  { label: "Revenue", color: BAR_COLORS.revenue, shape: "dot" as const },
  {
    label: "Helped profit",
    color: BAR_COLORS.positive,
    shape: "square" as const,
  },
  {
    label: "Hurt profit",
    color: BAR_COLORS.negative,
    shape: "square" as const,
  },
  { label: "Net profit", color: BAR_COLORS.base, shape: "square" as const },
];

/**
 * An X-axis label over up to two lines, as on the waterfall: cause names wider
 * than their column wrap at the space nearest the middle.
 */
function WrappedTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const text = String(payload?.value ?? "");
  let lines = [text];
  if (text.length > 14) {
    const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
    if (spaces.length > 0) {
      const middle = text.length / 2;
      const at = spaces.reduce((best, i) =>
        Math.abs(i - middle) < Math.abs(best - middle) ? i : best,
      );
      lines = [text.slice(0, at), text.slice(at + 1)];
    }
  }
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
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fill={AXIS_TICK.fill}
      fontSize={11}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function CauseTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: VarianceBar }[];
  label?: string;
}) {
  const { currency } = useCurrency();

  if (!active || !payload?.length) return null;
  const bar = payload[0].payload;

  const money = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const isEnd = bar.type === "base" || bar.type === "result";
  const variance = isEnd ? bar.current - bar.previous : bar.impact;
  const helped = variance > 0;
  const row = "flex flex-row justify-between gap-4";

  return (
    <div className="min-w-44 rounded-lg border border-[#dadce0] bg-white px-3 py-2.5 text-xs text-[#5f6368] shadow-sm dark:border-white/15 dark:bg-[#1b2436] dark:text-[#a9b4c7]">
      <p className="mb-1.5 text-[#3c4043] dark:text-[#e8ecf4]">{label}</p>

      <p className={row}>
        This month
        <span className="font-medium tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
          {money(bar.current)}
        </span>
      </p>
      <p className={row}>
        Last month
        <span className="tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
          {money(bar.previous)}
        </span>
      </p>

      <p
        className={`${row} mt-1 border-t border-[#e8eaed] pt-1 dark:border-white/10 ${
          variance === 0
            ? "text-[#9aa0a6] dark:text-[#9aa6bd]"
            : helped
              ? "text-[#1e8e3e] dark:text-[#10b981]"
              : "text-[#d93025] dark:text-[#f87171]"
        }`}
      >
        Variance
        <span className="font-medium tabular-nums">
          {variance === 0
            ? "—"
            : `${helped ? "+" : "−"}${money(Math.abs(variance))}`}
        </span>
      </p>

      {!isEnd && (
        <p
          className={`${row} mt-1 border-t pt-1 border-[#e8eaed] dark:border-white/10`}
        >
          Profit so far
          <span
            className={`font-medium tabular-nums ${
              bar.value < 0
                ? "text-[#b91c1c] dark:text-[#fca5a5]"
                : "text-[#3c4043] dark:text-[#e8ecf4]"
            }`}
          >
            {money(bar.value)}
          </span>
        </p>
      )}
    </div>
  );
}

export default function ProfitVarianceBridge({
  data,
}: {
  data: ProfitVariance;
}) {
  const { currency } = useCurrency();
  const { bars, current, previous, inProgress, missing } = data;

  // const money = (v: number) =>
  //   formatCurrencySymbol(v, currency.symbol, currency.locale);

  // const from = bars[0]?.value ?? 0;
  // const to = bars[bars.length - 1]?.value ?? 0;
  // const change = to - from;
  // const up = change >= 0;

  const hasData = bars.length > 2;
  const longestLabel = Math.max(...bars.map((b) => b.label.length), 0);
  const chartWidth = bars.length * Math.max(90, longestLabel * 4);
  const monthName = (iso: string, withYear = true) => {
    const [y, m] = iso.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(currency.locale, {
      month: "long",
      ...(withYear ? { year: "numeric" as const } : {}),
    });
  };

  const dayCount = Number(current.end.slice(8, 10));

  // Round-number steps; below zero when profit went negative on the way.
  const values = bars.map((b) => b.value);
  const ticks = niceTicks(
    values.length > 0 ? Math.min(...values) : 0,
    values.length > 0 ? Math.max(...values) : 0,
  );

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
      icon={ArrowLeftRight}
      // Sky, as before: Tailwind's sky-600 / sky-200 / sky-50.
      iconColor="#0284c7"
      iconBorder="#bae6fd"
      iconBg="#f0f9ff"
      title="Profit Variance Bridge"
      info={{
        heading: "Reading this chart",
        // From getProfitVariance and its wrapper: fixed to this calendar
        // month against the last; bars run from last month's net through
        // each cause's impact to this month's net.
        body: "This calendar month against the last one; the date range at the top of the page does not change it. It starts from last month's net profit, then each bar adds how much one cause moved it — revenue as a whole, then each cost — ending at this month's net profit. Hover a bar for both months' figures.",
      }}
      subtitle={`Why did net profit move in ${monthName(current.start)} vs ${monthName(previous.start)}?`}
      controls={<ExpenseBadge variant="pill" />}
    >
      {!hasData ? (
        <p className="rounded-xl border border-dashed px-4 py-14 text-center text-xs border-[#dadce0] dark:border-white/15 text-[#9aa0a6] dark:text-[#9aa6bd]">
          Nothing moved between these two months, so there is no change to
          explain yet.
        </p>
      ) : (
        <>
          {/* Scrollbar left out of the layout entirely, as elsewhere on this
              page: with nothing drawn there is nothing to appear on one card
              and not the next. Wheel, touch, keyboard and drag still scroll. */}
          <div className="overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div style={{ minWidth: chartWidth }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={bars}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  barCategoryGap="10%"
                >
                  <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={{ stroke: CHART_PALETTE.control }}
                    tickSize={6}
                    tick={<WrappedTick />}
                    height={40}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      formatCompactCurrency(v, currency.symbol, currency.locale)
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    ticks={ticks}
                    domain={[ticks[0], ticks[ticks.length - 1]]}
                    width={72}
                    label={yAxisTitle("Net profit")}
                  />
                  <Tooltip
                    content={<CauseTooltip />}
                    cursor={{ fill: "rgba(60,64,67,0.04)" }}
                  />
                  <Bar dataKey="value" radius={BAR_RADIUS}>
                    {bars.map((bar) => (
                      <Cell key={bar.label} fill={barFill(bar)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ChartLegend items={LEGEND_ITEMS} />
          {/* 
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[12px] tracking-wide dark:border-white/10">
            <span className="text-gray-500 text-[12px] tracking-wide dark:text-[#9aa6bd]">
              vs{" "}
              <span className="font-semibold text-gray-700 dark:text-[#c3ccdc]">
                {monthName(previous.start)}
              </span>
            </span>
            <span className="text-gray-500 dark:text-[#9aa6bd]">
              Net profit{" "}
              <span
                className={`font-semibold tabular-nums ${
                  up ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {up ? "up" : "down"} {money(Math.abs(change))}
              </span>
            </span>
          </div> */}

          {inProgress && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 dark:bg-amber-400/10">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />

              <span>
                Sales cover {dayCount} {dayCount === 1 ? "day" : "days"} so far,
                against a full {monthName(previous.start, false)}. Expenses
                count the whole month, including any dated later, so takings
                will catch up as the month fills in.
              </span>
            </p>
          )}

          {/* <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500 dark:bg-white/5 dark:text-[#9aa6bd]">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Fixed to whole months, so the date range at the top of the page
              does not change it. Revenue moves as one cause: splitting it into
              how much you sold and what you charged needs per-item quantities
              and prices for both months, which isn&apos;t tracked yet.
            </span>
          </p> */}

          {missing.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 dark:bg-amber-400/10">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Some figures could not be loaded ({missing.join(", ")}), so
                these causes cover only part of the picture.
              </span>
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
