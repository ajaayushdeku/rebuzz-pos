"use client";

import { useMemo, createElement } from "react";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../dashboardComponents/chartCard";
import { ChartColumnBig } from "lucide-react";
import { BudgetVsActualSkeleton } from "./ExpenseAnalyticsSkeletons";

/** The four columns, shared by the header row and the rows. */
const COLUMNS =
  "grid grid-cols-[1.4fr_1fr_1fr_1.3fr_1.4fr] items-center gap-3 min-w-[520px]";

function getPctStyle(pct: number): string {
  if (pct >= 100) return "bg-amber-100 text-amber-700";
  if (pct >= 90) return "bg-amber-50  text-amber-600";
  if (pct >= 80) return "bg-blue-50   text-blue-600";
  return "bg-green-50 text-green-600";
}

// variance = actual - budget → positive means over budget.
const VarianceBadge = ({ variance }: { variance: number }) => {
  const { currency } = useCurrency();

  if (variance === 0) {
    return (
      <span
        className="rounded-full border px-2 py-0.5 text-[11px]"
        style={{
          borderColor: CHART_PALETTE.control,
          color: CHART_PALETTE.axis,
        }}
      >
        on budget
      </span>
    );
  }
  const over = variance > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] tabular-nums md:text-[11px] ${
        over
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {over ? "↑" : "✓"}{" "}
      {formatCurrencySymbol(
        Math.abs(variance),
        currency.symbol,
        currency.locale,
      )}{" "}
      {over ? "over" : "under"}
    </span>
  );
};

export default function BudgetVsActual() {
  const { currency } = useCurrency();
  const { transactions, budgets, expensePurposes, isLoading } = useTracker();

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

  const getPurposeIconStr = (purposeId: string) =>
    purposeLookup.get(purposeId)?.icon ?? "";

  // Actual expense spend per category vs the saved budget threshold.
  const rows = useMemo(() => {
    const spendByCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.kind === "expense") {
        spendByCategory.set(
          t.purposeId,
          (spendByCategory.get(t.purposeId) ?? 0) + t.amount,
        );
      }
    }

    return budgets.map((b) => {
      const purposeName = getPurposeName(b.purposeId);
      const iconStr = getPurposeIconStr(b.purposeId);
      const actual = spendByCategory.get(b.purposeId) ?? 0;
      return {
        category: purposeName,
        icon: iconStr,
        actual,
        budget: b.amount,
        variance: actual - b.amount,
        pct: b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0,
        color: getPurposeColor(iconStr, purposeName),
      };
    });
  }, [transactions, budgets, getPurposeName, getPurposeIconStr]);

  if (isLoading)
    return (
      <>
        <BudgetVsActualSkeleton />
      </>
    );

  return (
    <ChartCard
      icon={ChartColumnBig}
      title="Budget vs Actual"
      info={{
        heading: "Reading this table",
        // What the old hover note said, plus how the figures are built.
        body: "Only the categories you have set a budget for appear here — a category with no budget is left out entirely. Actual is everything you logged against that category in the month picked at the top of the page, and the bar and percentage are how much of the budget that spends.",
      }}
      subtitle="Spending vs planned budget per category"
      controls={<RangeBadge scope="month" variant="pill" />}
    >
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ChartColumnBig
              size={24}
              style={{ color: CHART_PALETTE.subtitle }}
            />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No Budget vs Actual Expense data
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            No budgets set yet — use “Set Budget” to add thresholds.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div
            className={`${COLUMNS} border-b pb-2.5 text-[11px]`}
            style={{
              borderColor: CHART_PALETTE.grid,
              color: CHART_PALETTE.axis,
            }}
          >
            <span>Category</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Budget</span>
            <span className="text-right">Variance</span>
            <span className="text-right">Status</span>
          </div>

          {/* Rows */}
          <div>
            {rows.map((row) => (
              <div
                key={row.category}
                className={`${COLUMNS} border-b py-3 last:border-0`}
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                {/* Category */}
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20"
                    style={{
                      backgroundColor: row.color + "1a",
                      color: row.color,
                    }}
                  >
                    {createElement(getPurposeIcon(row.icon, row.category), {
                      size: 13,
                    })}
                  </span>
                  <span
                    className="truncate text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {row.category}
                  </span>
                </div>

                {/* Actual */}
                <span
                  className="text-right text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {formatCurrencySymbol(
                    row.actual,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>

                {/* Budget */}
                <span
                  className="text-right text-[13px] tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {formatCurrencySymbol(
                    row.budget,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>

                {/* Variance badge */}
                <div className="flex justify-end">
                  <VarianceBadge variance={row.variance} />
                </div>

                {/* Status: progress bar + % badge */}
                <div className="flex items-center justify-end gap-2">
                  <div
                    className="h-1.5 w-16 overflow-hidden rounded-full"
                    style={{ backgroundColor: CHART_PALETTE.grid }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(row.pct, 100)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${getPctStyle(row.pct)}`}
                  >
                    {row.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
