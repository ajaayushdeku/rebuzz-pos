"use client";

import { useMemo } from "react";
import { mockWhereMoneyGoesData } from "@/lib/mockData/mock-expense-data";
import { RefreshCcw, Zap } from "lucide-react";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { PURPOSE_COLORS, useTracker } from "@/providers/ExpenseContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "../ComponentHeader";

export default function WhereMoneyGoes() {
  const { currency } = useCurrency();
  const { transactions } = useTracker();

  // Top suppliers still uses mock data (no supplier data in the tracker).
  const d = mockWhereMoneyGoesData;

  // Real spend per expense category — total for the bar, with a
  // month-over-month trend indicator.
  const categorySpend = useMemo(() => {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

    const map = new Map<
      string,
      { total: number; thisMonth: number; lastMonth: number }
    >();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const entry = map.get(t.purpose) ?? {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
      };
      entry.total += t.amount;
      const key = t.date.slice(0, 7);
      if (key === thisKey) entry.thisMonth += t.amount;
      else if (key === prevKey) entry.lastMonth += t.amount;
      map.set(t.purpose, entry);
    }

    return [...map.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([label, v]) => {
        const diff = v.thisMonth - v.lastMonth;
        const changeDir: "up" | "down" | "flat" =
          diff > 0 ? "up" : diff < 0 ? "down" : "flat";
        const changePct =
          v.lastMonth > 0
            ? Math.round((Math.abs(diff) / v.lastMonth) * 100)
            : v.thisMonth > 0
              ? 100
              : 0;
        return {
          label,
          amount: v.total,
          changeDir,
          changePct,
          color: PURPOSE_COLORS[label] ?? "#6b7280",
        };
      });
  }, [transactions]);

  // Max amount for bar scaling
  const maxAmount = Math.max(1, ...categorySpend.map((c) => c.amount));

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}

      <div className="mb-4">
        {" "}
        <ComponentHeader
          title="Where the money goes"
          subHeader=" Category breakdown and top vendor concentration"
        />
      </div>

      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Spend by category ── */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <ComponentHeader title=" Spend by category" subHeader="" />

          {categorySpend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <RefreshCcw size={24} className="text-gray-500" />
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
                const barWidth = Math.round((cat.amount / maxAmount) * 100);
                const isUp = cat.changeDir === "up";
                const isFlat = cat.changeDir === "flat";

                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
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
                          <p
                            className={`text-[11px] font-semibold ${isUp ? "text-red-500" : "text-green-500"}`}
                          >
                            {isUp ? "↑" : "↓"} {cat.changePct}%
                          </p>
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
