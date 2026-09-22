"use client";

import { useMemo, useState } from "react";
import {
  Info,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import RangeBadge from "@/components/ui/RangeBadge";
import ExpenseBadge from "@/components/ui/ExpenseBadge";
import type { ScenarioBaseline } from "@/services/dashboardServices/apiProfitCost";
import { CHART_PALETTE, ChartCard } from "../chartCard";

interface ScenarioAdjustments {
  priceAdjustment: number;
  volumeAdjustment: number;
  cogsAdjustment: number;
  laborAdjustment: number;
}

const DEFAULTS: ScenarioAdjustments = {
  priceAdjustment: 0,
  volumeAdjustment: 0,
  cogsAdjustment: 0,
  laborAdjustment: 0,
};

/**
 * The levers, in the order an owner would reach for them.
 *
 * `locked` keeps a lever visible but inert. Labor is the one case: shifts
 * record hours, but no employee carries a pay rate, so hours cannot become
 * money. Any payroll the business records as an expense is already counted
 * inside fixed costs and cannot be pulled back out to move on its own.
 */
const SLIDERS: {
  key: keyof ScenarioAdjustments;
  label: string;
  hint: string;
  min: number;
  max: number;
  /** True when a rise is bad — cost levers read the opposite way to revenue. */
  isCost: boolean;
  locked?: string;
}[] = [
  {
    key: "priceAdjustment",
    label: "Price",
    hint: "Charge more or less per item",
    min: -20,
    max: 20,
    isCost: false,
  },
  {
    key: "volumeAdjustment",
    label: "Sales volume",
    hint: "Sell more or fewer items",
    min: -30,
    max: 30,
    isCost: false,
  },
  {
    key: "cogsAdjustment",
    label: "Cost of goods",
    hint: "What your stock costs you",
    min: -30,
    max: 30,
    isCost: true,
  },
  {
    key: "laborAdjustment",
    label: "Labor cost",
    hint: "Needs a pay rate on each employee",
    min: -30,
    max: 30,
    isCost: true,
    locked:
      "Staff pay carries no rate per employee, so labor can't be modelled on its own. Any payroll you record is counted inside other costs.",
  },
];

export default function WhatIfScenarioPlanner({
  baseline,
}: {
  baseline: ScenarioBaseline;
}) {
  const { currency } = useCurrency();
  const [adjustments, setAdjustments] = useState<ScenarioAdjustments>(DEFAULTS);

  const money = (value: number) =>
    formatCurrencySymbol(value, currency.symbol, currency.locale);

  const set = (key: keyof ScenarioAdjustments, value: number) =>
    setAdjustments((prev) => ({ ...prev, [key]: value }));

  const touched = Object.values(adjustments).some((v) => v !== 0);

  /**
   * Everything spent that is not cost of goods.
   *
   * Fixed costs and variable expenses are summed because neither has a lever
   * of its own: the sliders move price, volume and stock cost, and this is
   * what sits underneath them.
   */
  const otherCosts = baseline.fixedCosts + baseline.variableExpenses;
  const baselineProfit =
    baseline.revenue +
    baseline.miscIncome -
    baseline.cogs -
    baseline.tax -
    otherCosts;

  /**
   * Named for what the line actually contains.
   *
   * A business with no side income sees the plain word and is never asked to
   * wonder what has been folded in.
   */
  const revenueLabel =
    baseline.miscIncome > 0 ? "Revenue + Misc income" : "Revenue";

  const projected = useMemo(() => {
    const priceFactor = 1 + adjustments.priceAdjustment / 100;
    const volumeFactor = 1 + adjustments.volumeAdjustment / 100;
    const cogsFactor = 1 + adjustments.cogsAdjustment / 100;

    // Side income is added after the sliders, never through them: charging
    // 10% more per item does not raise a supplier rebate or a sublet, and
    // scaling it would credit the business with money it does not earn that
    // way. It counts towards profit, it just does not move.
    const revenue =
      baseline.revenue * priceFactor * volumeFactor + baseline.miscIncome;

    // Stock cost follows volume as well as its own slider: selling 20% more
    // means buying 20% more, which a cost-only factor would miss.
    const cogs = baseline.cogs * cogsFactor * volumeFactor;

    // Tax has no slider — nobody chooses their rate — but it is not fixed
    // either. It is a share of takings, so it rides the same price and volume
    // factors as the sales it sits inside. Holding it still would credit every
    // extra sale with tax the business does not get to keep.
    const tax = baseline.tax * priceFactor * volumeFactor;

    const profit = revenue - cogs - tax - otherCosts;

    return {
      revenue,
      cogs,
      tax,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      orders: Math.round(baseline.orders * volumeFactor),
    };
  }, [adjustments, baseline, otherCosts]);

  const baselineMargin =
    baseline.revenue > 0 ? (baselineProfit / baseline.revenue) * 100 : 0;
  const marginChange = projected.margin - baselineMargin;
  const profitChange = projected.profit - baselineProfit;
  const better = profitChange >= 0;

  const hasData = baseline.revenue > 0;

  return (
    <ChartCard
      icon={SlidersHorizontal}
      // Violet, as before: Tailwind's violet-600 / violet-200 / violet-50.
      iconColor="#7c3aed"
      iconBorder="#ddd6fe"
      iconBg="#f5f3ff"
      title="What-If Scenario Planner"
      info={{
        heading: "Reading this card",
        // From the projection below and getScenarioBaseline.
        body: "It starts from the date range at the top of the page: revenue plus side income, less cost of goods, tax and your recorded expenses. Price and volume move revenue and the tax inside it; volume and the stock-cost lever move cost of goods. Side income and other costs stay put. Labor is locked until employees carry a pay rate.",
      }}
      subtitle="Move a lever to see what it would do to profit"
      controls={
        <>
          <RangeBadge variant="pill" />
          <ExpenseBadge variant="pill" />
          {touched && (
            <button
              type="button"
              onClick={() => setAdjustments(DEFAULTS)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] transition-colors hover:bg-[#f8f9fa]"
              style={{
                borderColor: CHART_PALETTE.control,
                color: CHART_PALETTE.title,
              }}
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </>
      }
      className="h-full"
    >
      {!hasData ? (
        <p
          className="rounded-xl border border-dashed px-4 py-10 text-center text-xs"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.subtitle,
          }}
        >
          No sales in this period, so there is nothing to model yet.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Outcome */}
          <div>
            <div className="rounded-xl bg-slate-900 p-5 text-white">
              <p className="text-[11px] text-slate-400">Projected net profit</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">
                  {money(projected.profit)}
                </p>
                {touched && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      better
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {better ? (
                      <TrendingUp size={11} />
                    ) : (
                      <TrendingDown size={11} />
                    )}
                    {better ? "+" : "−"}
                    {money(Math.abs(profitChange))}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Margin
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
                    {projected.margin.toFixed(1)}%
                    {touched && (
                      <span
                        className={`ml-1.5 text-[11px] font-semibold ${
                          marginChange >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {marginChange >= 0 ? "+" : ""}
                        {marginChange.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Orders
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
                    {projected.orders.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* The figures the projection is built from, so the number above
                  can be checked rather than trusted. */}
              <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-[11px]">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">{revenueLabel}</span>
                  <span className="tabular-nums text-slate-200">
                    {money(projected.revenue)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Cost of goods</span>
                  <span className="tabular-nums text-slate-200">
                    −{money(projected.cogs)}
                  </span>
                </div>
                {/* Shown only where tax was charged, so a business that
                    charges none is not asked to read a row of zeroes. */}
                {baseline.tax > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Tax</span>
                    <span className="tabular-nums text-slate-200">
                      −{money(projected.tax)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Other costs (Expenses)</span>
                  <span className="tabular-nums text-slate-200">
                    −{money(otherCosts)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-white/10 pt-1.5 font-semibold">
                  <span className="text-slate-300">Baseline profit</span>
                  <span className="tabular-nums text-slate-200">
                    {money(baselineProfit)}
                  </span>
                </div>
              </div>
            </div>

            {baseline.missing.length > 0 && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
                <Info className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>
                  Some figures could not be loaded (
                  {baseline.missing.join(", ")}), so this projection covers only
                  part of the picture.
                </span>
              </p>
            )}
          </div>

          {/* Levers */}
          <div className="grid gap-5 sm:grid-cols-2">
            {SLIDERS.map((slider) => {
              const value = adjustments[slider.key];
              const isLocked = Boolean(slider.locked);

              // A cost going up is bad; revenue going up is good. Without this
              // the colour would congratulate a rising stock bill.
              const good = slider.isCost ? value < 0 : value > 0;
              const bad = slider.isCost ? value > 0 : value < 0;

              return (
                <div
                  key={slider.key}
                  className={isLocked ? "opacity-50" : undefined}
                >
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span
                      className="flex items-center gap-1.5 text-[13px] font-medium"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {isLocked && <Lock size={11} className="shrink-0" />}
                      {slider.label}
                    </span>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${
                        good
                          ? "text-green-600"
                          : bad
                            ? "text-red-600"
                            : "text-gray-400"
                      }`}
                    >
                      {value > 0 ? "+" : ""}
                      {value}%
                    </span>
                  </div>

                  <p
                    className="mb-2 text-[11px] leading-relaxed"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {slider.locked ?? slider.hint}
                  </p>

                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={1}
                    value={value}
                    disabled={isLocked}
                    aria-label={slider.label}
                    onChange={(e) => set(slider.key, Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e8eaed] accent-violet-600 disabled:cursor-not-allowed"
                  />

                  <div
                    className="mt-1 flex justify-between text-[10px] tabular-nums"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    <span>{slider.min}%</span>
                    <span>0</span>
                    <span>+{slider.max}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
