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
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ComponentHeader } from "../ComponentHeader";
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
  // Color logic
  const strokeColor = pct > 100 ? "#ef4444" : pct >= 90 ? "#f59e0b" : "#22c55e";
  const textColor = pct > 100 ? "text-red-500" : "text-gray-900";

  const fmtK = (v: number) =>
    v >= 1000
      ? `${currency.symbol} ${formatCompactNumber(v, currency.locale)}`
      : `${currency.symbol} ${v}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-gray-700">{label}</p>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg width="96" height="96" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="#e5e7eb"
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
          <span className={`text-lg font-bold ${textColor}`}>{pct}%</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-gray-300  uppercase tracking-widest">
          Actual / Budget
        </p>
        <p className="text-xs text-gray-500  font-bold text-gray-400 mt-0.5">
          {fmtK(actual)} / {fmtK(budget)}
        </p>
      </div>
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

  const getPurposeIcon = (purposeId: string) =>
    purposeLookup.get(purposeId)?.icon ?? "";

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
      label: "Total Expenses",
      display: fmt(totalExpenses),
      icon: <DollarSign size={16} />,
      color: "text-red-500",
    },
    {
      label: "Budgeted",
      display: fmt(budgeted),
      icon: <Clock size={16} />,
      color: "text-gray-500",
    },
    {
      label: underBudget ? "Under Budget" : "Over Budget",
      display: fmt(Math.abs(variance)),
      icon: underBudget ? <TrendingDown size={16} /> : <TrendingUp size={16} />,
      color: underBudget ? "text-green-500" : "text-red-500",
    },
    {
      label: "% of Revenue",
      display: pctOfRevenue === null ? "—" : `${pctOfRevenue.toFixed(1)}%`,
      icon: <Percent size={16} />,
      color: "text-violet-500",
    },
    {
      label: "Over Threshold",
      display: `${overCount} ${overCount === 1 ? "category" : "categories"}`,
      icon: <AlertTriangle size={16} />,
      color: overCount > 0 ? "text-red-500" : "text-gray-400",
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
      {/* Cost Health */}
      {/* Gauges card */}
      <div className=" bg-white rounded-2xl border border-gray-200 shadow-sm px-5 pt-5 pb-3">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Gauge size={15} className="text-blue-600" />
              </div>
              <ComponentHeader
                title="Expense Budget Gauges"
                subHeader="Current spending vs allocated budget per category"
              />
            </div>

            {/* Info tooltip */}
            <div className="relative group shrink-0">
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
                aria-label="About this chart"
              >
                <Info size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                These gauges show only the expense categories that have a budget
                set. Categories without a budget are not included here.
              </div>
            </div>
          </div>
        </div>

        {gauges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Gauge size={24} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No budgets set yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Use “Set Budget” to add spending thresholds per category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
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
              <div className="flex items-center justify-center gap-3 mt-5">
                {canLoadMore && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 5, gauges.length),
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <ChevronDown size={14} /> Load More
                    <span className="text-xs text-gray-400">
                      ( {gauges.length - visibleCount} more )
                    </span>
                  </button>
                )}
                {canHide && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) => Math.max(prev - 5, 5))
                    }
                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700  transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center gap-1 cursor-pointer"
                  >
                    <ChevronUp size={14} /> Hide
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Spend Overview */}
      {/* 5 stat cards */}
      <div className=" grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">
                {stat.label}
              </p>
              <span className={`${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.display}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
