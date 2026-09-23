"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { useTrailingMonthsTransactions } from "@/hooks/useTrailingMonthsTransactions";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "../dashboardComponents/chartCard";
import { ChartColumnStacked, AlertTriangle } from "lucide-react";
import CategoryLegend from "./CategoryLegend";
import { MonthlyExpenseTrendSkeleton } from "./ExpenseAnalyticsSkeletons";

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
    <ChartTooltipBox
      label={label}
      rows={payload.map((entry) => ({
        name: String(entry.dataKey),
        color: entry.color ?? CHART_PALETTE.blue,
        value: fmtK(toNumber(entry.value)),
      }))}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs" style={{ color: CHART_PALETTE.axis }}>
            Total
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: CHART_PALETTE.title }}
          >
            {fmtK(total)}
          </span>
        </div>
      }
    />
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
    return formatCompactCurrency(v, currency.symbol, currency.locale);
  };

  if (isLoading)
    return (
      <>
        <MonthlyExpenseTrendSkeleton />
      </>
    );

  return (
    <ChartCard
      icon={ChartColumnStacked}
      // Violet, as before: Tailwind's violet-600 / violet-200 / violet-50.
      iconColor="#7c3aed"
      iconBorder="#ddd6fe"
      iconBg="#f5f3ff"
      title="Monthly Expense Trend by Category"
      info={{
        heading: "Reading this chart",
        // From useTrailingMonthsTransactions: fixed six-month window.
        body: "Six months to date, always — it ignores the month picked at the top of the page. Each bar stacks that month's expenses by category, largest category at the bottom, so the whole bar is what you spent. Income is left out. Hover a bar for the split and the month's total.",
      }}
      subtitle="Stacked breakdown of expenses over the last 6 months"
      controls={
        // States plainly that this card ignores the page's month filter.
        <span
          className="shrink-0 rounded-full border bg-white px-2 py-0.5 text-[11px]"
          style={{
            borderColor: CHART_PALETTE.control,
            color: CHART_PALETTE.title,
          }}
        >
          Last 6 months
        </span>
      }
    >
      {failedMonths > 0 && !isError && (
        <p
          className="mb-3 flex items-center gap-1.5 text-[11px]"
          style={{ color: CHART_PALETTE.warn }}
        >
          <AlertTriangle size={12} className="shrink-0" />
          {failedMonths} of 6 months could not be loaded — the chart is
          incomplete.
        </p>
      )}

      {isError ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            Could not load the expense trend
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            None of the last six months could be fetched.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ChartColumnStacked
              size={24}
              style={{ color: CHART_PALETTE.subtitle }}
            />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No expense data
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            No expenses recorded in the last 6 months.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              barCategoryGap="25%"
            >
              <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                dy={8}
              />
              <YAxis
                tickFormatter={fmtK}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={80}
                label={yAxisTitle("Expenses")}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: CHART_PALETTE.hover }}
              />

              {categories.map((cat, i) => (
                <Bar
                  key={cat.name}
                  dataKey={cat.name}
                  stackId="expenses"
                  fill={cat.color}
                  // Soft corners on the top of the stack only.
                  radius={i === categories.length - 1 ? BAR_RADIUS : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <CategoryLegend categories={categories} />
        </>
      )}
    </ChartCard>
  );
}
