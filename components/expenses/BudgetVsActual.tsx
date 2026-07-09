"use client";

import { mockBudgetVsActualData } from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

function getPctStyle(pct: number): string {
  if (pct >= 100) return "bg-amber-100 text-amber-700";
  if (pct >= 90) return "bg-amber-50  text-amber-600";
  if (pct >= 80) return "bg-blue-50   text-blue-600";
  return "bg-green-50 text-green-600";
}

export default function BudgetVsActual() {
  const { currency } = useCurrency();
  const rows = mockBudgetVsActualData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <LockDimFeactureOverlay component_name="Budget Vs Actual" />
      <div>
        <h2 className="text-sm font-bold text-gray-900">Budget vs Actual</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Spending vs planned budget per category
        </p>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-4 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
        <span>Category</span>
        <span className="text-right">Actual</span>
        <span className="text-right">Budget</span>
        <span className="text-right">Status</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.category}
            className="grid grid-cols-4 gap-3 items-center py-2.5 border-b border-gray-50 last:border-0"
          >
            {/* Category */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: row.color }}
              />
              <span className="text-sm text-gray-800 font-medium truncate">
                {row.category}
              </span>
            </div>

            {/* Actual */}
            <span className="text-sm font-bold text-gray-900 text-right">
              {formatCurrencySymbol(
                row.actual,
                currency.symbol,
                currency.locale,
              )}
            </span>

            {/* Budget */}
            <span className="text-sm text-gray-400 text-right">
              {formatCurrencySymbol(
                row.budget,
                currency.symbol,
                currency.locale,
              )}
            </span>

            {/* Status: progress bar + % badge */}
            <div className="flex items-center justify-end gap-2">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(row.pct, 100)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${getPctStyle(row.pct)}`}
              >
                {row.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
