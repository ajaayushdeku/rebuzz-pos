"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface SliceData {
  purpose: string;
  amount: number;
  color: string;
  pct: number;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  currency: any;
}) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as SliceData;
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-100">
      <p className="text-gray-500 text-xs mb-0.5">{entry.purpose}</p>
      <p className="font-bold text-sm" style={{ color: entry.color }}>
        {formatCurrency(entry.amount, currency)}
      </p>
      <p className="text-xs text-gray-400">
        {entry.pct.toFixed(0)}% of expenses
      </p>
    </div>
  );
};

export default function ExpenseTrackerStats() {
  const { transactions } = useTracker();
  const { currency } = useCurrency();

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const net = totalIncome - totalExpense;

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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* ── Summary cards (2/5 width) ── */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Overview</h3>
          <div className="space-y-3">
            <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown size={16} className="text-red-500" />
                </div>
                <p className="text-sm font-medium text-red-600">Expenses</p>
              </div>
              <p className="text-lg font-bold text-red-700">
                {formatCurrency(totalExpense, currency)}
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-green-600">Income</p>
              </div>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(totalIncome, currency)}
              </p>
            </div>

            <div
              className={`rounded-xl p-4 flex items-center justify-between ${
                net >= 0 ? "bg-blue-50" : "bg-orange-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    net >= 0 ? "bg-blue-100" : "bg-orange-100"
                  }`}
                >
                  <Scale
                    size={16}
                    className={net >= 0 ? "text-blue-500" : "text-orange-500"}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      net >= 0 ? "text-blue-600" : "text-orange-600"
                    }`}
                  >
                    Net
                  </p>
                  <p
                    className={`text-xs ${
                      net >= 0 ? "text-blue-400" : "text-orange-400"
                    }`}
                  >
                    {net >= 0 ? "Positive" : "Negative"}
                  </p>
                </div>
              </div>
              <p
                className={`text-lg font-bold ${
                  net >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                {net >= 0 ? "+" : ""}
                {formatCurrency(net, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Donut chart card (3/5 width) ── */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Expense Breakdown
          </h3>
          {expenseByPurpose.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              No expense data yet
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
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      {expenseByPurpose.map((entry, idx) => (
                        <Cell
                          key={entry.purpose}
                          fill={entry.color}
                          stroke="none"
                        >
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
                        ? formatCurrency(totalExpense, currency).replace(
                            /^.*?(\d[\d,.]*).*$/,
                            "$1",
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
                  <div
                    key={entry.purpose}
                    className="flex items-center gap-2 py-1"
                  >
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
                      {formatCurrency(entry.amount, currency).replace(
                        /^Rs\s*/,
                        "",
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
