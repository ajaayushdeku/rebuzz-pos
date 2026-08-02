"use client";

import { useMemo, createElement } from "react";
import { mockWhereMoneyGoesData } from "@/lib/mockData/mock-expense-data";
import { Wallet, Zap } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "../ComponentHeader";

export default function WhereMoneyGoes() {
  const { currency } = useCurrency();
  const { transactions, previousTransactions, expensePurposes, month, year } =
    useTracker();

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

  return (
    <div className="flex flex-col gap-2 mt-10">
      {/* Section header */}

      <div className="mb-4">
        {" "}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Wallet size={15} className="text-amber-600" />
          </div>
          <ComponentHeader
            title="Where the money goes"
            subHeader=" Category breakdown and top vendor concentration"
          />
        </div>
      </div>

      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Spend by category ── */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <ComponentHeader title=" Spend by category" subHeader="" />

          {categorySpend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Wallet size={24} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {" "}
                No expenses recorded yet.
              </p>
              <p className="text-xs text-gray-400 mt-1">
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
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color}1a`,
                            color: cat.color,
                          }}
                        >
                          {createElement(Icon, { size: 13 })}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {cat.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {fmtRs(cat.amount)}
                        </p>
                        {isFlat ? (
                          <p className="text-[11px] text-gray-400">flat</p>
                        ) : (
                          <span className="flex items-end justify-end gap-1">
                            <p
                              className={`text-[11px] font-semibold ${isUp ? "text-red-500" : "text-green-500"}`}
                            >
                              {isUp ? "↑" : "↓"} {Math.abs(cat.changePct)}%
                            </p>{" "}
                            <p className="text-gray-500 text-[10px]">
                              {" "}
                              from last month
                            </p>{" "}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
        </div>

        {/* ── Top suppliers ── */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <LockDimFeactureOverlay component_name="Top Suppliers" />

          <ComponentHeader
            title="Top Suppliers"
            subHeader="Who you pay the most"
          />

          <div className="space-y-4">
            {d.topSuppliers.map((supplier) => (
              <div key={supplier.rank}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                      {supplier.rank}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">
                      {supplier.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {fmtRs(supplier.amount)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {supplier.pctOfPurchases}% of purchases
                    </p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${supplier.pctOfPurchases * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Other vendors row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Other {d.otherVendorsCount} vendors
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {fmtRs(d.otherVendorsAmount)}
            </span>
          </div>

          {/* Insight banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <Zap size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Your top {d.topVendorCount} of {d.totalVendorCount} vendors are{" "}
              <span className="font-bold">{d.topVendorPct}%</span> of all
              purchases — negotiate these first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
