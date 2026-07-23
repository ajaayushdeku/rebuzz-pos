"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";
import { ComponentHeader } from "../ComponentHeader";
import { RefreshCcw } from "lucide-react";

interface SliceData {
  purpose: string;
  amount: number;
  color: string;
  pct: number;
}

interface CurrencyType {
  symbol: string;
  locale?: string;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyType;
}) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as SliceData;
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-100">
      <p className="text-gray-500 text-xs mb-0.5">{entry.purpose}</p>
      <p className="font-bold text-sm" style={{ color: entry.color }}>
        {formatCurrencySymbol(entry.amount, currency.symbol, currency.locale)}
      </p>
      <p className="text-xs text-gray-400">
        {entry.pct.toFixed(0)}% of expenses
      </p>
    </div>
  );
};

/** Donut breakdown of expenses by category (purpose), from the tracker store. */
export default function ExpensesByCategory() {
  const { transactions } = useTracker();
  const { currency } = useCurrency();

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const expenseByPurpose = useMemo((): SliceData[] => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.purpose] = (map[t.purpose] ?? 0) + t.amount;
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([purpose, amount]) => ({
        purpose,
        amount,
        color: PURPOSE_COLORS[purpose] ?? "#6b7280",
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }));
  }, [transactions, totalExpense]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <ComponentHeader
          title="Expenses by Category"
          subHeader="Share of total expenses this month"
        />
      </div>

      {expenseByPurpose.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <RefreshCcw size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No expense data</p>
          <p className="text-xs text-gray-400 mt-1">
            Expenses by Category data will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* ── Donut on the left ── */}
          <div className="shrink-0 w-full sm:w-48 flex justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={expenseByPurpose}
                  dataKey="amount"
                  nameKey="purpose"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={4}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {expenseByPurpose.map((entry, idx) => (
                    <Cell key={entry.purpose} fill={entry.color} stroke="none">
                      <animate
                        attributeName="opacity"
                        values="0;1"
                        dur="0.6s"
                        begin={`${idx * 0.08}s`}
                        fill="freeze"
                      />
                    </Cell>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
                {/* Center text */}
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-bold fill-gray-800"
                >
                  {totalExpense > 0
                    ? formatCurrencySymbol(
                        totalExpense,
                        currency.symbol,
                        currency.locale,
                      )
                    : "0"}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-400"
                >
                  Total
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ── Legend with progress bars on the right ── */}
          <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
            {expenseByPurpose.map((entry) => (
              <div key={entry.purpose} className="flex items-center gap-2 py-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 w-20 truncate shrink-0">
                  {entry.purpose}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${entry.pct}%`,
                      background: `linear-gradient(90deg, ${entry.color}, ${entry.color}dd)`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-10 text-right shrink-0">
                  {entry.pct.toFixed(0)}%
                </span>
                <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                  {formatCurrencySymbol(
                    entry.amount,
                    currency.symbol,
                    currency.locale,
                  ).replace(/^Rs\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
