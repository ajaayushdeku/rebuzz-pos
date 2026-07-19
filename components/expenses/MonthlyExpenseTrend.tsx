"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ComponentHeader } from "../ComponentHeader";

/** Coerce a recharts payload value (number | string | array) to a number. */
const toNumber = (v: ValueType | undefined): number =>
  typeof v === "number" ? v : Number(v) || 0;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Fallback palette for categories without a preset color.
const FALLBACK_COLORS = [
  "#6366f1",
  "#60a5fa",
  "#ec4899",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#a855f7",
  "#f43f5e",
  "#14b8a6",
  "#fb923c",
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  label?: string | number;
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + toNumber(p.value), 0);

  const fmtK = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-xs min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{String(entry.dataKey)}</span>
          </div>
          <span className="font-semibold text-gray-800">
            {fmtK(toNumber(entry.value))}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-1.5 mt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="font-bold text-gray-900">{fmtK(total)}</span>
      </div>
    </div>
  );
};

export default function MonthlyExpenseTrend() {
  const { currency } = useCurrency();
  const { transactions } = useTracker();

  // Stacked expense totals per category over the last 6 months.
  const { data, categories } = useMemo(() => {
    const now = new Date();
    const rows: Record<string, number | string>[] = [];
    const byKey = new Map<string, Record<string, number | string>>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = { month: MONTHS[d.getMonth()], __key: key };
      byKey.set(key, row);
      rows.push(row);
    }

    const catTotals = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const row = byKey.get(t.date.slice(0, 7));
      if (!row) continue;
      row[t.purpose] = ((row[t.purpose] as number) ?? 0) + t.amount;
      catTotals.set(t.purpose, (catTotals.get(t.purpose) ?? 0) + t.amount);
    }

    // Largest categories first so the stack order is stable and meaningful.
    const cats = [...catTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name], i) => ({
        name,
        color:
          PURPOSE_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

    return { data: rows, categories: cats };
  }, [transactions]);

  const fmtK = (v: number) => {
    return `${currency.symbol} ${formatCompactNumber(v)}`;
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <ComponentHeader
        title="Monthly Expense Trend by Category"
        subHeader="Stacked breakdown of expenses over the last 6 months"
      />

      {categories.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No expenses recorded yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            barCategoryGap="25%"
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              tickFormatter={fmtK}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              width={42}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Legend
              content={() => (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs" style={{ color: cat.color }}>
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />

            {categories.map((cat, i) => (
              <Bar
                key={cat.name}
                dataKey={cat.name}
                stackId="expenses"
                fill={cat.color}
                radius={
                  i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
