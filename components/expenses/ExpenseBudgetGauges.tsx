"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

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
      ? `${currency.symbol} ${formatCompactNumber(v)}`
      : `${currency.symbol} ${v}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-gray-700">{label}</p>

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
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Actual / Budget
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {fmtK(actual)} / {fmtK(budget)}
        </p>
      </div>
    </div>
  );
}

export default function ExpenseBudgetGauges() {
  const { currency } = useCurrency();
  const { transactions, budgets } = useTracker();

  // ── Derive real spend + budget metrics ──────────────────────────────────
  const { gauges, totalExpenses, budgeted, variance, pctOfRevenue, overCount } =
    useMemo(() => {
      // Actual expense spend per category.
      const spendByCategory = new Map<string, number>();
      let expenses = 0;
      let income = 0;

      for (const t of transactions) {
        if (t.type === "expense") {
          expenses += t.amount;
          spendByCategory.set(
            t.purpose,
            (spendByCategory.get(t.purpose) ?? 0) + t.amount,
          );
        } else {
          income += t.amount;
        }
      }

      // One gauge per budget threshold: actual spend vs allocated amount.
      const gaugeData = budgets.map((b) => {
        const actual = spendByCategory.get(b.purpose) ?? 0;
        const pct = b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0;
        return { category: b.purpose, actual, budget: b.amount, pct };
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
    }, [transactions, budgets]);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const underBudget = variance >= 0;

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

  return (
    <div className="relative flex flex-col gap-4">
      {/* Gauges card */}
      <div className=" bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Expense Budget Gauges
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Current spending vs allocated budget per category
        </p>

        {gauges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Wallet size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No budgets set yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Use “Set Budget” to add spending thresholds per category.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-around gap-6">
            {gauges.map((g) => (
              <RadialGauge
                key={g.category}
                label={g.category}
                pct={g.pct}
                actual={g.actual}
                budget={g.budget}
              />
            ))}
          </div>
        )}
      </div>

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
