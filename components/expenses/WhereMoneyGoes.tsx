"use client";

import { useMemo, createElement } from "react";
import { mockWhereMoneyGoesData } from "@/lib/mockData/mock-expense-data";
import { Wallet, Zap, Store } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../dashboardComponents/chartCard";
import { ExpenseCardSkeleton } from "./ExpenseAnalyticsSkeletons";

export default function WhereMoneyGoes() {
  const { currency } = useCurrency();
  const {
    transactions,
    previousTransactions,
    expensePurposes,
    month,
    year,
    isLoading,
  } = useTracker();

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

  // Top suppliers still uses mock data (no supplier data in the tracker).
  const d = mockWhereMoneyGoesData;

  // Real spend per expense category — total for the bar, with a
  // month-over-month trend indicator.
  const categorySpend = useMemo(() => {
    const thisKey = `${year}-${String(month).padStart(2, "0")}`;
    const prevDate = new Date(year, month - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const map = new Map<
      string,
      { total: number; lastMonth: number; purposeId: string }
    >();

    // Current month spend
    for (const t of transactions) {
      if (t.kind !== "expense") continue;
      if (t.date.slice(0, 7) !== thisKey) continue;
      const entry = map.get(t.purposeId) ?? {
        total: 0,
        lastMonth: 0,
        purposeId: t.purposeId,
      };
      entry.total += t.amount;
      map.set(t.purposeId, entry);
    }

    // Previous month spend (for the trend comparison)
    for (const t of previousTransactions) {
      if (t.kind !== "expense") continue;
      if (t.date.slice(0, 7) !== prevKey) continue;
      const entry = map.get(t.purposeId) ?? {
        total: 0,
        lastMonth: 0,
        purposeId: t.purposeId,
      };
      entry.lastMonth += t.amount;
      map.set(t.purposeId, entry);
    }

    return (
      [...map.entries()]
        // Only show purposes that have spend in the current month
        .filter(([, v]) => v.total > 0)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([, v]) => {
          const label = getPurposeName(v.purposeId);
          const thisMonth = v.total;
          const diff = thisMonth - v.lastMonth;
          const changeDir: "up" | "down" | "flat" =
            diff > 0 ? "up" : diff < 0 ? "down" : "flat";
          const changePct =
            v.lastMonth > 0
              ? Math.round((diff / v.lastMonth) * 100)
              : thisMonth > 0
                ? 100
                : 0;
          return {
            label,
            amount: thisMonth,
            changeDir,
            changePct,
            color: getPurposeColor(getPurposeIconStr(v.purposeId), label),
            icon: getPurposeIconStr(v.purposeId),
          };
        })
    );
  }, [
    transactions,
    previousTransactions,
    month,
    year,
    getPurposeName,
    getPurposeIconStr,
  ]);

  // Total current-month expense (for bar scaling)
  const totalCurrentMonth = categorySpend.reduce((s, c) => s + c.amount, 0);

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  if (isLoading)
    return (
      <>
        {" "}
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-72 bg-gray-100 rounded mb-3" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpenseCardSkeleton rows={4} titleWidth="w-36" />
            <ExpenseCardSkeleton rows={4} titleWidth="w-32" />
          </div>
        </div>
      </>
    );

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Section header — the ChartCard header, over a pair of cards rather
          than inside one. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb" }}
          >
            <Wallet size={16} style={{ color: "#d97706" }} />
          </div>
          <div className="min-w-0">
            <h3
              className="text-[15px] font-normal"
              style={{ color: CHART_PALETTE.title }}
            >
              Where the money goes
            </h3>
            <p
              className="mt-0.5 text-xs tracking-wide"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Category breakdown and top vendor concentration
            </p>
          </div>
        </div>
        <RangeBadge scope="month" variant="pill" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Spend by category ── */}
        <ChartCard
          icon={Wallet}
          // Amber, matching the section above it.
          iconColor="#d97706"
          iconBorder="#fde68a"
          iconBg="#fffbeb"
          title="Spend by category"
          info={{
            heading: "Reading this card",
            // From the memo above: this month vs the one before it.
            body: "Every expense logged in the month picked at the top of the page, grouped by category and ordered largest first. The bar is that category's share of the month's spending, and the figure under the amount compares it with the same category last month.",
          }}
          subtitle="Largest first, against last month"
          className="h-full"
        >
          {categorySpend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: CHART_PALETTE.hover }}
              >
                <Wallet size={24} style={{ color: CHART_PALETTE.subtitle }} />
              </div>
              <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
                No expenses recorded yet.
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Category Expense data will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categorySpend.map((cat) => {
                const barWidth =
                  totalCurrentMonth > 0
                    ? Math.round((cat.amount / totalCurrentMonth) * 100)
                    : 0;
                const isUp = cat.changeDir === "up";
                const isFlat = cat.changeDir === "flat";
                const Icon = getPurposeIcon(cat.icon, cat.label);

                return (
                  <div key={cat.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20"
                          style={{
                            backgroundColor: `${cat.color}1a`,
                            color: cat.color,
                          }}
                        >
                          {createElement(Icon, { size: 13 })}
                        </span>
                        <span
                          className="truncate text-[13px]"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {cat.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className="text-[13px] font-medium tabular-nums"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {fmtRs(cat.amount)}
                        </p>
                        {isFlat ? (
                          <p
                            className="text-[11px]"
                            style={{ color: CHART_PALETTE.subtitle }}
                          >
                            flat
                          </p>
                        ) : (
                          <span className="flex items-baseline justify-end gap-1">
                            <span
                              className="text-[11px] tabular-nums"
                              style={{
                                color: isUp
                                  ? CHART_PALETTE.bad
                                  : CHART_PALETTE.good,
                              }}
                            >
                              {isUp ? "↑" : "↓"} {Math.abs(cat.changePct)}%
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: CHART_PALETTE.subtitle }}
                            >
                              from last month
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: CHART_PALETTE.grid }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        {/* ── Top suppliers ── */}
        <ChartCard
          icon={Store}
          title="Top Suppliers"
          subtitle="Who you pay the most"
          // Clipped so the lock overlay follows the card's rounded corners.
          className="h-full overflow-hidden select-none"
        >
          {/* Lock overlay — a direct child of the card, so it covers the
              header as well as the list. */}
          <LockDimFeactureOverlay component_name="Top Suppliers" />

          <div className="space-y-4">
            {d.topSuppliers.map((supplier) => (
              <div key={supplier.rank}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] tabular-nums"
                      style={{
                        backgroundColor: CHART_PALETTE.hover,
                        color: CHART_PALETTE.axis,
                      }}
                    >
                      {supplier.rank}
                    </span>
                    <span
                      className="truncate text-[13px]"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {supplier.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className="text-[13px] font-medium tabular-nums"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {fmtRs(supplier.amount)}
                    </p>
                    <p
                      className="text-[11px] tabular-nums"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      {supplier.pctOfPurchases}% of purchases
                    </p>
                  </div>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: CHART_PALETTE.grid }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${supplier.pctOfPurchases * 3.5}%`,
                      backgroundColor: CHART_PALETTE.blue,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Other vendors row */}
          <div
            className="mt-4 flex items-center justify-between border-t pt-3 text-xs"
            style={{ borderColor: CHART_PALETTE.grid }}
          >
            <span style={{ color: CHART_PALETTE.subtitle }}>
              Other {d.otherVendorsCount} vendors
            </span>
            <span
              className="tabular-nums"
              style={{ color: CHART_PALETTE.axis }}
            >
              {fmtRs(d.otherVendorsAmount)}
            </span>
          </div>

          {/* Insight banner */}
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5"
            style={{ borderColor: CHART_PALETTE.border }}
          >
            <Zap
              size={13}
              className="mt-0.5 shrink-0"
              style={{ color: CHART_PALETTE.subtitle }}
            />
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: CHART_PALETTE.axis }}
            >
              Your top {d.topVendorCount} of {d.totalVendorCount} vendors are{" "}
              <span style={{ color: CHART_PALETTE.title }}>
                {d.topVendorPct}%
              </span>{" "}
              of all purchases — negotiate these first.
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
