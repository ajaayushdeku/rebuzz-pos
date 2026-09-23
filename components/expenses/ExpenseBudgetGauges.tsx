"use client";

import { useMemo, useState } from "react";
import {
  DollarSign,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  AlertTriangle,
  Gauge,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { CHART_PALETTE, ChartCard } from "../dashboardComponents/chartCard";
import { ExpenseBudgetGaugesSkeleton } from "./ExpenseAnalyticsSkeletons";

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
        className="max-w-full truncate text-[13px]"
        style={{ color: CHART_PALETTE.title }}
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
            stroke={CHART_PALETTE.grid}
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
            className="text-lg font-semibold tracking-tight tabular-nums"
            style={{
              color: pct > 100 ? CHART_PALETTE.bad : CHART_PALETTE.title,
            }}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
          Actual / Budget
        </p>
        <p
          className="mt-0.5 text-xs tabular-nums"
          style={{ color: CHART_PALETTE.axis }}
        >
          {fmtK(actual)} / {fmtK(budget)}
        </p>
      </div>
    </div>
  );
}

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
      className="rounded-2xl border bg-white px-5 py-4"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p
          className="truncate text-[13px]"
          style={{ color: CHART_PALETTE.axis }}
        >
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
        >
          <Icon size={16} />
        </span>
      </div>
      <p
        className="truncate text-xl font-semibold tracking-tight tabular-nums"
        style={{ color: CHART_PALETTE.title }}
      >
        {display}
      </p>
    </div>
  );
}

export default function ExpenseBudgetGauges() {
  const { currency } = useCurrency();
  const { transactions, budgets, expensePurposes, isLoading } = useTracker();

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

  // Visible gauge count — initially 5 (matches the largest grid column count),
  // expand/collapse in batches of 5.
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleGauges = gauges.slice(0, visibleCount);
  const canLoadMore = visibleCount < gauges.length;
  const canHide = visibleCount > 5;

  const stats = [
    {
      label: "Total expenses",
      display: fmt(totalExpenses),
      icon: DollarSign,
      iconClass: "bg-red-50 text-red-600",
    },
    {
      label: "Budgeted",
      display: fmt(budgeted),
      icon: Clock,
      iconClass: "bg-gray-50 text-gray-600",
    },
    {
      label: underBudget ? "Under budget" : "Over budget",
      display: fmt(Math.abs(variance)),
      icon: underBudget ? TrendingDown : TrendingUp,
      iconClass: underBudget
        ? "bg-green-50 text-green-600"
        : "bg-red-50 text-red-600",
    },
    {
      label: "% of revenue",
      display: pctOfRevenue === null ? "—" : `${pctOfRevenue.toFixed(1)}%`,
      icon: Percent,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Over threshold",
      display: `${overCount} ${overCount === 1 ? "category" : "categories"}`,
      icon: AlertTriangle,
      iconClass:
        overCount > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500",
    },
  ];

  if (isLoading)
    return (
      <>
        <ExpenseBudgetGaugesSkeleton />
      </>
    );

  const moreButton =
    "inline-flex cursor-pointer items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] transition-colors hover:bg-[#f8f9fa]";

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
        controls={<RangeBadge scope="month" variant="pill" />}
      >
        {gauges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: CHART_PALETTE.hover }}
            >
              <Gauge size={24} style={{ color: CHART_PALETTE.subtitle }} />
            </div>
            <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
              No budgets set yet
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Use “Set Budget” to add spending thresholds per category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {visibleGauges.map((g) => (
                <RadialGauge
                  key={g.category}
                  label={g.category}
                  pct={g.pct}
                  actual={g.actual}
                  budget={g.budget}
                />
              ))}
            </div>

            {/* Load More / Hide buttons */}
            {gauges.length > 5 && (
              <div className="mt-5 flex items-center justify-center gap-2">
                {canLoadMore && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 5, gauges.length),
                      )
                    }
                    className={moreButton}
                    style={{
                      borderColor: CHART_PALETTE.control,
                      color: CHART_PALETTE.title,
                    }}
                  >
                    <ChevronDown size={12} />
                    Show {gauges.length - visibleCount} more
                  </button>
                )}
                {canHide && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) => Math.max(prev - 5, 5))
                    }
                    className={moreButton}
                    style={{
                      borderColor: CHART_PALETTE.control,
                      color: CHART_PALETTE.title,
                    }}
                  >
                    <ChevronUp size={12} />
                    Show less
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </ChartCard>

      {/* Spend Overview — 5 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
