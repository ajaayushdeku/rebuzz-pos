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
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { useTrailingMonthsTransactions } from "@/hooks/useTrailingMonthsTransactions";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ComponentHeader } from "../ComponentHeader";
import { ChartColumnStacked, AlertTriangle } from "lucide-react";
import CategoryLegend from "./CategoryLegend";

/** Coerce a recharts payload value (number | string | array) to a number. */
const toNumber = (v: ValueType | undefined): number =>
  typeof v === "number" ? v : Number(v) || 0;

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
  const { expensePurposes } = useTracker();

  // Build purposeId → { name, icon } lookup
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

  // Same fixed six-month window as the cash flow chart, from the same shared
  // hook — so the two agree, share React Query's cache with ExpenseContext,
  // and both refresh when a transaction is added.
  const {
    months: trailingMonths,
    isLoading,
    isError,
    failedMonths,
  } = useTrailingMonthsTransactions(6);

  // Stacked expense totals per category over the last 6 months.
  const { data, categories } = useMemo(() => {
    // Track per-category total with the purposeId so we can look up icon/color
    const catTotals = new Map<string, { amount: number; purposeId: string }>();

    // Each month arrives as its own result, so rows go straight into their
    // month's bucket — no `date.slice(0, 7)` matching, which would silently
    // drop everything if the API's date format ever changed.
    const rows: Record<string, number | string>[] = trailingMonths.map((m) => {
      const row: Record<string, number | string> = {
        month: m.label,
        __key: m.key,
      };

      for (const t of m.transactions) {
        if (t.kind !== "expense") continue;
        const name = getPurposeName(t.purposeId);
        row[name] = ((row[name] as number) ?? 0) + t.amount;

        const existing = catTotals.get(name);
        if (existing) {
          existing.amount += t.amount;
        } else {
          catTotals.set(name, { amount: t.amount, purposeId: t.purposeId });
        }
      }

      return row;
    });

    // Largest categories first so the stack order is stable and meaningful.
    const cats = [...catTotals.entries()]
      .sort(([, a], [, b]) => b.amount - a.amount)
      .map(([name, { purposeId }], i) => ({
        name,
        color:
          getPurposeColor(getPurposeIcon(purposeId), name) ??
          FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

    return { data: rows, categories: cats };
  }, [trailingMonths, getPurposeName, getPurposeIcon]);

  const fmtK = (v: number) => {
    return `${currency.symbol} ${formatCompactNumber(v, currency.locale)}`;
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <ChartColumnStacked size={15} className="text-violet-600" />
          </div>
          <ComponentHeader
            title="Monthly Expense Trend by Category"
            subHeader="Stacked breakdown of expenses over the last 6 months"
          />
        </div>

        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Last 6 months
        </span>
      </div>

      {failedMonths > 0 && !isError && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
          <AlertTriangle size={12} className="shrink-0" />
          {failedMonths} of 6 months could not be loaded — the chart is
          incomplete.
        </p>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Loading trend data…
        </div>
      ) : isError ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Could not load the expense trend
          </p>
          <p className="mt-1 text-xs text-gray-400">
            None of the last six months could be fetched.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <ChartColumnStacked size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">No expense data</p>
          <p className="text-xs text-gray-400 mt-1">
            No expenses recorded in the last 6 months.
          </p>
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
              content={() => <CategoryLegend categories={categories} />}
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
