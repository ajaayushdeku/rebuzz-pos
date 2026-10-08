"use client";

import { useEffect, useState } from "react";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { Scale, Info, Loader2 } from "lucide-react";
import { ChartCard } from "../chartCard";
import { MonthYearFilter, MONTHS } from "@/components/ui/MonthYearFilter";
import ExpenseBadge from "@/components/ui/ExpenseBadge";
import type { BreakEvenData } from "@/services/dashboardServices/apiProfitCost";

export default function BreakEvenMarginSafety() {
  const { currency } = useCurrency();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  /**
   * One result, stamped with the month it belongs to.
   *
   * Loading is derived from that stamp rather than held in its own state:
   * setting a loading flag inside the effect body would trigger the cascading
   * render react-hooks/set-state-in-effect warns about, and deriving it also
   * means the spinner appears the instant the month changes rather than one
   * render later.
   */
  const [result, setResult] = useState<{
    key: string;
    data: BreakEvenData | null;
    isError: boolean;
  } | null>(null);

  const key = `${year}-${month}`;
  const isLoading = result?.key !== key;
  const data = result?.key === key ? result.data : null;
  const isError = result?.key === key && result.isError;

  useEffect(() => {
    let active = true;

    fetch(`/api/break-even?month=${month}&year=${year}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (active) {
          setResult({
            key: `${year}-${month}`,
            data: json?.data ?? null,
            isError: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setResult({ key: `${year}-${month}`, data: null, isError: true });
        }
      });

    return () => {
      active = false;
    };
  }, [month, year]);

  const money = (value: number) =>
    formatCurrencySymbol(value, currency.symbol, currency.locale);

  /** Every state sits in the same card, header and month picker included. */
  const shell = (children: React.ReactNode) => (
    <ChartCard
      icon={Scale}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Break-even & Margin of Safety"
      info={{
        heading: "Reading this card",
        // From /api/break-even (see apiProfitCost's break-even notes).
        body: "For the month chosen on this card — not the date range at the top of the page. Break-even is everything the month cost, fixed and variable together (tax sits in the variable costs); margin of safety is how far revenue, side income included, sits above it, as a share of revenue.",
      }}
      subtitle="How much revenue is required to cover all costs"
      expenseBadge={true}
      controls={
        <>
          <div className=" hidden md:block">
            <ExpenseBadge variant="pill" />
          </div>

          <MonthYearFilter
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </>
      }
      className="h-full select-none"
    >
      {children}
    </ChartCard>
  );

  if (isLoading) {
    return shell(
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#9aa0a6] dark:text-[#9aa6bd]">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Calculating break-even…</p>
      </div>,
    );
  }

  if (isError || !data) {
    return shell(
      <div className="py-14 text-center">
        <p className="text-sm text-[#5f6368] dark:text-[#a9b4c7]">
          Could not load break-even for {MONTHS[month - 1]} {year}
        </p>
      </div>,
    );
  }

  const {
    revenue,
    miscIncome,
    tax,
    breakEvenPoint,
    fixedCosts,
    variableCosts,
    contributionMarginRatio,
    unclassifiedPurposes,
    isPartialMonth,
    daysElapsed,
    daysInMonth,
  } = data;

  // Break-even is the month's total cost, fixed plus variable — the revenue it
  // needed to pay for itself. Null only when no cost was recorded at all,
  // where a target of zero would be trivially met and say nothing.
  const hasBreakEven = breakEvenPoint !== null;

  const marginOfSafety =
    hasBreakEven && revenue > 0
      ? ((revenue - breakEvenPoint) / revenue) * 100
      : 0;

  const isSafe = hasBreakEven && revenue >= breakEvenPoint;

  // The axis ends 20% past the break-even point, so the marker lands in the
  // same place every month (at 1/1.2 = 83.3%). That makes the bar readable at
  // a glance and comparable between months, which an axis that rescaled to
  // whichever of revenue and break-even happened to lead was not.
  //
  // Falls back to revenue only when break-even is 0 — with no fixed costs the
  // axis would otherwise be 0 and the whole bar would render empty.
  const axisMax = (breakEvenPoint || revenue) * 1.2;

  // Clamped: revenue past 1.2x break-even runs off the end of the axis. The
  // bar then reads "comfortably past break-even" and the exact figure stays on
  // the Current label below, so nothing is actually lost.
  const pct = (value: number) =>
    axisMax > 0 ? Math.min(100, (value / axisMax) * 100) : 0;

  const revenueWidth = pct(revenue);
  const breakEvenPos = pct(breakEvenPoint ?? 0);

  return shell(
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
            Break-even Point
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
            {hasBreakEven ? money(breakEvenPoint) : "—"}
          </p>
        </div>

        <div className="text-right">
          <p className="mb-1 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
            Margin of Safety
          </p>
          <p
            className={`text-2xl font-semibold tracking-tight tabular-nums ${
              !hasBreakEven
                ? "text-gray-400 dark:text-[#7b869b]"
                : isSafe
                  ? "text-green-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          >
            {hasBreakEven ? `${marginOfSafety.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {hasBreakEven ? (
        <>
          {/* Revenue fills from zero and the break-even sits on it as a marker.
              The bar used to be drawn from the break-even to revenue, which
              computes a negative width the moment revenue falls short — so the
              bar vanished in exactly the case worth showing. */}
          <div className="relative mt-6 h-3 overflow-hidden rounded-full bg-[#e8eaed] dark:bg-white/10">
            <div
              className="absolute bottom-0 left-0 top-0 transition-all duration-500"
              style={{
                width: `${revenueWidth}%`,
                // Past break-even in the palette's green, short of it in red.
                backgroundColor: isSafe ? "#34a853" : "#ea4335",
              }}
            />
            <div
              // Near-black against the track on white; the same mark has to be
              // near-white to read against the dark one.
              className="absolute bottom-0 top-0 z-10 w-1 bg-[#3c4043] dark:bg-[#e8ecf4]"
              style={{ left: `${breakEvenPos}%` }}
            />
          </div>

          {/* Labels — the right-hand figure is the axis end, not revenue. It
              previously printed axisMax / 1.2, understating the scale by 20%. */}
          <div className="mt-2 flex justify-between text-xs text-[#5f6368] dark:text-[#a9b4c7]">
            <span className="tracking-wide">{money(0)}</span>
            <span className="tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
              {/* Says what is in the figure only when something extra is —
                  otherwise the plain word is the whole truth. */}
              Current{miscIncome > 0 ? " (with misc income)" : ""}:{" "}
              {money(revenue)}
            </span>
            <span className="tracking-wide">{money(Math.round(axisMax))}</span>
          </div>

          <div
            className="relative mt-6"
            style={{ marginLeft: `${breakEvenPos}%` }}
          >
            <div className="absolute -translate-x-1/2 -top-5">
              <span className="whitespace-nowrap bg-white px-1 text-[10px] font-medium tracking-wide text-[#5f6368] dark:text-[#a9b4c7] dark:bg-white/5">
                BREAK-EVEN
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 dark:bg-amber-400/10 dark:border-amber-400/25">
          <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
            No costs recorded for this month, so there is nothing to break even
            against. Add expenses, or check that sales have cost prices set.
          </p>
        </div>
      )}

      {/* The working behind the two figures. */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-4 border-[#e8eaed] dark:border-white/10">
        <div>
          <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Fixed costs
          </p>
          <p className="mt-0.5 text-sm font-medium tracking-wide tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
            {money(fixedCosts)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Variable costs
          </p>
          <p className="mt-0.5 text-sm font-medium tracking-wide tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
            {money(variableCosts)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Contribution margin
          </p>
          <p className="mt-0.5 text-sm font-medium tracking-wide tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
            {(contributionMarginRatio * 100).toFixed(1)}%
          </p>
        </div>

        {/* Shown only when the tracker recorded some. A tile reading zero would
            invite every business to wonder what it was missing, and the figure
            is already inside the revenue above either way. */}
        {miscIncome > 0 && (
          <div>
            <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              Misc income
            </p>
            <p className="mt-0.5 text-sm font-medium tracking-wide tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
              {money(miscIncome)}
            </p>
          </div>
        )}

        {/* Broken out of the variable costs beside it, because a reader who
            knows their stock bill will otherwise wonder why that figure is
            larger than expected. Same rule as misc income: shown only when
            there is some. */}
        {tax > 0 && (
          <div>
            <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              Tax (in variable)
            </p>
            <p className="mt-0.5 text-sm font-medium tracking-wide tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
              {money(tax)}
            </p>
          </div>
        )}
      </div>

      {/* A month still in progress compares part of its revenue against all of
          its fixed costs, so an early-month shortfall is expected rather than a
          warning. Say which, instead of leaving it to be misread. */}
      {isPartialMonth && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 dark:text-blue-200 dark:bg-blue-400/10">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-blue-400" />
          <p className="text-[11px] leading-relaxed text-blue-800 dark:text-[#a8c4ee]">
            {MONTHS[month - 1]} is still in progress — revenue covers{" "}
            {daysElapsed} of {daysInMonth} days, while fixed costs are the
            month&apos;s full commitment. Expect the margin of safety to improve
            as the month runs.
          </p>
        </div>
      )}

      {/* An unrecognised fixed cost is counted as variable, which lowers the
          break-even point and flatters the margin of safety. Say so rather than
          let the optimism pass unremarked. */}
      {unclassifiedPurposes.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-white/5">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-[#7b869b]" />
          <p className="text-[11px] leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
            {unclassifiedPurposes.length} expense{" "}
            {unclassifiedPurposes.length === 1 ? "category" : "categories"}{" "}
            counted as variable ({unclassifiedPurposes.slice(0, 3).join(", ")}
            {unclassifiedPurposes.length > 3 &&
              ` +${unclassifiedPurposes.length - 3} more`}
            ). If any are actually fixed, the true break-even is higher than
            shown.
          </p>
        </div>
      )}
    </>,
  );
}
