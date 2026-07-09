"use client";

import {
  DollarSign,
  Clock,
  TrendingDown,
  Percent,
  RefreshCcw,
} from "lucide-react";
import { mockExpenseCashFlowData } from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

const ICON_MAP: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign size={16} />,
  Clock: <Clock size={16} />,
  TrendingDown: <TrendingDown size={16} />,
  Percent: <Percent size={16} />,
  RefreshCcw: <RefreshCcw size={16} />,
};

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
  const over = pct > 100;
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
  const { gauges, stats } = mockExpenseCashFlowData;

  return (
    <div className="relative flex flex-col gap-4">
      {/* <LockDimFeactureOverlay component_name="Expensr Budget Gauges and Stat Cards" /> */}

      {/* Gauges card */}
      <div className=" bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* <LockDimFeactureOverlay component_name="Expensr Budget Gauges" /> */}
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Expense Budget Gauges
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          Current spending vs allocated budget per category
        </p>
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
      </div>

      {/* 5 stat cards */}
      <div className=" grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <LockDimFeactureOverlay component_name="Expense Stat Cards" />

        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">
                {stat.label}
              </p>
              <span className={`${stat.color}`}>{ICON_MAP[stat.icon]}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {stat.type === "number"
                ? formatCurrencySymbol(
                    stat.value ?? 0,
                    currency.symbol,
                    currency.locale,
                  )
                : stat.percent}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
