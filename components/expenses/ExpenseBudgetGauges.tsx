"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  AlertTriangle,
  Gauge,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { CHART_PALETTE, ChartCard } from "../dashboardComponents/chartCard";
import { ExpenseBudgetGaugesSkeleton } from "./ExpenseAnalyticsSkeletons";
import {
  STAT_ROW,
  STAT_ROW_ITEM,
} from "../dashboardComponents/overviewDash/statRow";
import { cn } from "@/lib/utils";

// ── Radial gauge built with SVG ───────────────────────────────────────────

function RadialGauge({
  pct,
  label,
  actual,
  budget,
}: {
  pct: number;
  label: string;
  actual: number;
  budget: number;
}) {
  const { currency } = useCurrency();
  const clamped = Math.min(pct, 133); // cap arc at 133% for visual
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(clamped, 100) / 100) * circ;
  // Over budget reads red, close to it amber, otherwise green.
  const strokeColor =
    pct > 100
      ? CHART_PALETTE.bad
      : pct >= 90
        ? CHART_PALETTE.warn
        : CHART_PALETTE.good;

  const fmtK = (v: number) =>
    v >= 1000
      ? formatCompactCurrency(v, currency.symbol, currency.locale)
      : `${currency.symbol} ${v}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className="max-w-full truncate text-[13px] text-[#3c4043] dark:text-[#e8ecf4]"
        title={label}
      >
        {label}
      </p>

      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg width="96" height="96" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            className="stroke-[#e8eaed] dark:stroke-[#2d3443]"
            strokeWidth="8"
          />
          {/* Fill */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-lg font-semibold tracking-tight tabular-nums ${
              pct > 100
                ? "text-[#d93025] dark:text-[#f87171]"
                : "text-[#3c4043] dark:text-[#e8ecf4]"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Actual / Budget
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-[#5f6368] dark:text-[#a9b4c7]">
          {fmtK(actual)} / {fmtK(budget)}
        </p>
      </div>
    </div>
  );
}

/**
 * The gauge grid, used by the first row and by every group revealed after it.
 *
 * One constant because a revealed group has to be its own grid — a grid cannot
 * animate part of itself — and a group whose columns did not match the first
 * row's would put its gauges out of line with the ones above.
 */
const GAUGE_GRID = "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5";

/** One of the five figures under the gauges. */
function StatTile({
  label,
  display,
  icon: Icon,
  iconClass,
}: {
  label: string;
  display: string;
  icon: LucideIcon;
  /** Icon tile colours; its border takes the icon's own hue. */
  iconClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-[#161d2e] px-5 py-4 border-[#e3e3e3] dark:border-white/10",
        STAT_ROW_ITEM,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="truncate text-[13px] text-[#5f6368] dark:text-[#a9b4c7]">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="truncate text-xl font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
        {display}
      </p>
    </div>
  );
}

export default function ExpenseBudgetGauges() {
  const { currency } = useCurrency();
  const { transactions, budgets, expensePurposes, isLoading } = useTracker();

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  useEffect(() => {
    const smQuery = window.matchMedia("(max-width: 639px)");
    const mdQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)",
    );

    const updateScreenSize = () => {
      setIsSmallScreen(smQuery.matches);
      setIsMediumScreen(mdQuery.matches);
    };

    updateScreenSize();

    smQuery.addEventListener("change", updateScreenSize);
    mdQuery.addEventListener("change", updateScreenSize);

    return () => {
      smQuery.removeEventListener("change", updateScreenSize);
      mdQuery.removeEventListener("change", updateScreenSize);
    };
  }, []);
  /** How many gauges one click brings in — a full row at the widest layout. */
  const STEP = isSmallScreen ? 2 : isMediumScreen ? 3 : 5;

  // Build purposeId → { name } lookup
  const purposeLookup = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const p of expensePurposes) {
      map.set(p._id, { name: p.name, icon: p.icon ?? "" });
    }
    return map;
  }, [expensePurposes]);

  const getPurposeName = (purposeId: string) =>
    purposeLookup.get(purposeId)?.name ?? purposeId;

  // ── Derive real spend + budget metrics ──────────────────────────────────
  const { gauges, totalExpenses, budgeted, variance, pctOfRevenue, overCount } =
    useMemo(() => {
      // Actual expense spend per category.
      const spendByCategory = new Map<string, number>();
      let expenses = 0;
      let income = 0;

      for (const t of transactions) {
        if (t.kind === "expense") {
          expenses += t.amount;
          spendByCategory.set(
            t.purposeId,
            (spendByCategory.get(t.purposeId) ?? 0) + t.amount,
          );
        } else {
          income += t.amount;
        }
      }

      // One gauge per budget threshold: actual spend vs allocated amount.
      const gaugeData = budgets.map((b) => {
        const purposeName = getPurposeName(b.purposeId);
        const actual = spendByCategory.get(b.purposeId) ?? 0;
        const pct = b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0;
        return { category: purposeName, actual, budget: b.amount, pct };
      });

      const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
      // Actual spend only within budgeted categories → meaningful variance.
      const budgetedSpend = gaugeData.reduce((sum, g) => sum + g.actual, 0);

      return {
        gauges: gaugeData,
        totalExpenses: expenses,
        budgeted: totalBudgeted,
        variance: totalBudgeted - budgetedSpend,
        pctOfRevenue: income > 0 ? (expenses / income) * 100 : null,
        overCount: gaugeData.filter((g) => g.actual > g.budget).length,
      };
    }, [transactions, budgets, getPurposeName]);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const underBudget = variance >= 0;

  /**
   * How many groups beyond the first row are open. 0 is the resting state.
   *
   * A count of groups rather than of gauges, because each group animates on its
   * own: a click moves only the row it brings in, and the rows already open do
   * not re-run their transition underneath it.
   */
  const [revealed, setRevealed] = useState(0);

  const head = gauges.slice(0, STEP);

  // The remainder in groups of five, each its own grid so it can be expanded
  // independently of the rows above it.
  const chunks: (typeof gauges)[] = [];
  for (let i = STEP; i < gauges.length; i += STEP) {
    chunks.push(gauges.slice(i, i + STEP));
  }

  const allShown = revealed >= chunks.length;
  const nextCount = allShown
    ? 0
    : Math.min(STEP, gauges.length - STEP - revealed * STEP);

  const stats = [
    {
      label: "Total expenses",
      display: fmt(totalExpenses),
      icon: DollarSign,
      iconClass: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
    },
    {
      label: "Budgeted",
      display: fmt(budgeted),
      icon: Clock,
      iconClass: "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-[#a9b4c7]",
    },
    {
      label: underBudget ? "Under budget" : "Over budget",
      display: fmt(Math.abs(variance)),
      icon: underBudget ? TrendingDown : TrendingUp,
      iconClass: underBudget
        ? "bg-green-50 text-green-600 dark:bg-emerald-400/10 dark:text-emerald-400"
        : "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400",
    },
    {
      label: "% of revenue",
      display: pctOfRevenue === null ? "—" : `${pctOfRevenue.toFixed(1)}%`,
      icon: Percent,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
    },
    {
      label: "Over threshold",
      display: `${overCount} ${overCount === 1 ? "category" : "categories"}`,
      icon: AlertTriangle,
      iconClass:
        overCount > 0
          ? "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400"
          : "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-[#9aa6bd]",
    },
  ];

  if (isLoading)
    return (
      <>
        <ExpenseBudgetGaugesSkeleton />
      </>
    );

  return (
    <div className="relative flex flex-col gap-4">
      {/* Gauges card */}
      <ChartCard
        icon={Gauge}
        title="Expense Budget Gauges"
        info={{
          heading: "Reading these gauges",
          // What the old hover note said, plus what the ring shows.
          body: "Only the categories you have set a budget for appear here — a category with no budget is left out entirely. Each ring is what you spent against that budget in the month picked at the top of the page: green under 90%, amber close to the limit, red once you are over it. The ring stops at full even when the figure does not.",
        }}
        subtitle="Current spending vs allocated budget per category"
        buttons={<RangeBadge scope="month" variant="pill" />}
      >
        {gauges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
              <Gauge size={24} className="text-[#9aa0a6] dark:text-[#9aa6bd]" />
            </div>
            <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
              No budgets set yet
            </p>
            <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
              Use “Set Budget” to add spending thresholds per category.
            </p>
          </div>
        ) : (
          <>
            <div className={GAUGE_GRID}>
              {head.map((g) => (
                <RadialGauge
                  key={g.category}
                  label={g.category}
                  pct={g.pct}
                  actual={g.actual}
                  budget={g.budget}
                />
              ))}
            </div>

            {chunks.length > 0 && (
              <>
                {/* A grid track per group rather than a height: a group's
                    height is not known in advance — the gauges reflow from five
                    columns to two — and `0fr` → `1fr` is the one way to
                    transition to `auto`. The rows stay mounted so there is
                    something to reveal; `inert` keeps the closed ones out of
                    tab order and away from screen readers. */}
                {chunks.map((chunk, index) => (
                  <div
                    key={index}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      index < revealed ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden" inert={index >= revealed}>
                      {/* The gap above a revealed group lives inside the
                          clipped box, so it collapses with it. On the wrapper
                          it would leave 24px of space under the first row
                          while nothing was open. */}
                      <div className={`${GAUGE_GRID} pt-6`}>
                        {chunk.map((g) => (
                          <RadialGauge
                            key={g.category}
                            label={g.category}
                            pct={g.pct}
                            actual={g.actual}
                            budget={g.budget}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* The same pair of pills as the tax breakdown's lists: one
                    step forward, one jump back. The chevron turns with the
                    rows it opens. */}
                <div className="mt-5 flex items-center justify-center gap-2">
                  {!allShown && (
                    <button
                      type="button"
                      onClick={() => setRevealed((prev) => prev + 1)}
                      aria-expanded={revealed > 0}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:hover:bg-white/10"
                    >
                      Show {nextCount} more
                      <ChevronDown size={12} className="shrink-0" />
                    </button>
                  )}

                  {revealed > 0 && (
                    <button
                      type="button"
                      onClick={() => setRevealed(0)}
                      aria-expanded={revealed > 0}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300"
                    >
                      Hide
                      <ChevronDown size={12} className="rotate-180 shrink-0" />
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </ChartCard>

      {/* Spend Overview — 5 stat cards */}
      <div className={STAT_ROW}>
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
            label={stat.label}
            display={stat.display}
            icon={stat.icon}
            iconClass={stat.iconClass}
          />
        ))}
      </div>
    </div>
  );
}
