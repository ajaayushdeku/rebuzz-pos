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
import { ComponentHeader } from "@/components/ComponentHeader";
import type {
  ProfitVariance,
  VarianceBar,
} from "@/services/dashboardServices/apiProfitCost";

const BAR_COLORS: Record<VarianceBar["type"], string> = {
  base: "#94a3b8",
  revenue: "#3b82f6",
  positive: "#22c55e",
  negative: "#f43f5e",
  result: "#94a3b8",
};

/**
 * A running total that has fallen below zero — the business is in a loss at
 * that point in the chain.
 *
 * Deeper than the red used for a cause that merely hurt, because it says
 * something stronger: not "this went the wrong way" but "everything up to here
 * adds up to a loss".
 */
const BELOW_ZERO = "#b91c1c";

/**
 * Bars that keep their own colour below the axis.
 *
 * Revenue and the two net-profit bars are identified by colour rather than
 * judged by it, so recolouring them where the chain dips would cost the reader
 * the one thing those columns are for.
 */
const KEEPS_COLOUR: VarianceBar["type"][] = ["revenue", "base", "result"];

const barFill = (bar: VarianceBar) =>
  bar.value < 0 && !KEEPS_COLOUR.includes(bar.type)
    ? BELOW_ZERO
    : BAR_COLORS[bar.type];

const LEGEND_ITEMS = [
  { label: "Revenue", color: BAR_COLORS.revenue },
  { label: "Helped profit", color: BAR_COLORS.positive },
  { label: "Hurt profit", color: BAR_COLORS.negative },
  { label: "Net profit", color: BAR_COLORS.base },
];

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

  // The two end bars are net profit itself rather than a cause of it, so they
  // carry no impact. Their variance is simply the difference between the two
  // months, where a rise is unambiguously good.
  const isEnd = bar.type === "base" || bar.type === "result";
  const variance = isEnd ? bar.current - bar.previous : bar.impact;
  const helped = variance > 0;

  return (
    <div className="min-w-44 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>

      <p className="flex flex-row justify-between gap-4 text-gray-500">
        This month
        <span className="font-bold tabular-nums text-gray-800">
          {money(bar.current)}
        </span>
      </p>
      <p className="flex flex-row justify-between gap-4 text-gray-500">
        Last month
        <span className="tabular-nums text-gray-700">
          {money(bar.previous)}
        </span>
      </p>

      {/* On a cost line this is not the difference of the two figures above —
          spending less is a smaller number and a better result, so the sign is
          flipped to read as an effect on profit. */}
      <p
        className={`mt-1 flex flex-row justify-between gap-4 border-t border-gray-100 pt-1 ${
          variance === 0
            ? "text-gray-400"
            : helped
              ? "text-green-600"
              : "text-red-500"
        }`}
      >
        Variance
        <span className="font-bold tabular-nums">
          {variance === 0
            ? "—"
            : `${helped ? "+" : "−"}${money(Math.abs(variance))}`}
        </span>
      </p>

      {/* The bar is drawn at the running total, not at either month's figure,
          so without this line its height would go unexplained. */}
      {!isEnd && (
        <p className="mt-1 flex flex-row justify-between gap-4 border-t border-gray-100 pt-1 text-gray-500">
          Profit so far
          <span
            className={`font-bold tabular-nums ${
              bar.value < 0 ? "text-red-700" : "text-gray-800"
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

  const money = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const from = bars[0]?.value ?? 0;
  const to = bars[bars.length - 1]?.value ?? 0;
  const change = to - from;
  const up = change >= 0;

  // Two end bars and nothing between them means every cause cancelled to zero,
  // which is not a chart worth drawing.
  const hasData = bars.length > 2;

  // Wide enough that every cause keeps a readable label; the container scrolls
  // once that exceeds the space available. Sized off the longest label rather
  // than fixed, because a bar named after a purpose the business chose — or
  // the combined revenue line — can be far wider than "Rent", and recharts
  // prints axis ticks on one line whatever the column width.
  const longestLabel = Math.max(...bars.map((b) => b.label.length), 0);
  const chartWidth = bars.length * Math.max(90, longestLabel * 6);

  /**
   * The month a window falls in, by name.
   *
   * Built from the parts rather than `new Date(iso)`, which reads a bare date
   * as UTC midnight and in any negative offset renders the month before.
   */
  const monthName = (iso: string, withYear = true) => {
    const [y, m] = iso.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(currency.locale, {
      month: "long",
      ...(withYear ? { year: "numeric" as const } : {}),
    });
  };

  /** Days of this month the figures actually cover, the 1st included. */
  const dayCount = Number(current.end.slice(8, 10));

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
          <ArrowLeftRight size={15} className="text-sky-600" />
        </div>
        <ComponentHeader
          title="Profit Variance Bridge"
          subHeader={`Why did net profit move in ${monthName(current.start)} vs ${monthName(previous.start)}?`}
        />
      </div>

      {!hasData ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-14 text-center text-[12px] text-gray-400">
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
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    interval={0}
                    dy={8}
                  />
                  {/* Axis left to the data. A fixed domain would clip a real
                      loss, and net profit here is free to go below zero. */}
                  <YAxis
                    tickFormatter={(v) =>
                      formatCompactCurrency(v, currency.symbol, currency.locale)
                    }
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={56}
                  />
                  <Tooltip
                    content={<CauseTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {bars.map((bar) => (
                      <Cell key={bar.label} fill={barFill(bar)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {LEGEND_ITEMS.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          {/* 
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[12px] tracking-wide">
            <span className="text-gray-500 text-[12px] tracking-wide">
              vs{" "}
              <span className="font-semibold text-gray-700">
                {monthName(previous.start)}
              </span>
            </span>
            <span className="text-gray-500">
              Net profit{" "}
              <span
                className={`font-semibold tabular-nums ${
                  up ? "text-green-600" : "text-red-600"
                }`}
              >
                {up ? "up" : "down"} {money(Math.abs(change))}
              </span>
            </span>
          </div> */}

          {inProgress && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                This month covers {dayCount} {dayCount === 1 ? "day" : "days"}{" "}
                so far, against a full {monthName(previous.start, false)}. Costs
                will look lower than they will end up. Expect the gap to close
                as the month fills in.
              </span>
            </p>
          )}

          {/* <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Fixed to whole months, so the date range at the top of the page
              does not change it. Revenue moves as one cause: splitting it into
              how much you sold and what you charged needs per-item quantities
              and prices for both months, which isn&apos;t tracked yet.
            </span>
          </p> */}

          {missing.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Some figures could not be loaded ({missing.join(", ")}), so
                these causes cover only part of the picture.
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
