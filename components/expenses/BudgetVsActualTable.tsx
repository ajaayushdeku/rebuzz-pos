"use client";

import { mockBudgetVsActualTableData } from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const VarianceBadge = ({ variance }: { variance: number }) => {
  const { currency } = useCurrency();

  if (variance === 0) {
    return (
      <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-full px-3 py-1">
        on budget
      </span>
    );
  }
  const over = variance > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1 border ${
        over
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-green-50 text-green-600 border-green-200"
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

export default function BudgetVsActualTable() {
  const { currency } = useCurrency();
  const rows = mockBudgetVsActualTableData;

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <LockDimFeactureOverlay component_name="Budget vs Actual Table" />

      <h2 className="text-sm font-bold text-gray-900 mb-0.5">
        Budget vs actual
      </h2>
      <p className="text-xs text-blue-500 mb-5">
        How each category tracked against your monthly plan
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {["Category", "Budget", "Actual", "Variance"].map((h) => (
                <th
                  key={h}
                  className={`py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${
                    h === "Category" ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.category}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors"
              >
                {/* Category */}
                <td className="py-4 px-4 text-sm font-medium text-indigo-500">
                  {row.category}
                </td>

                {/* Budget */}
                <td className="py-4 px-4 text-right text-sm text-indigo-400">
                  {fmtRs(row.budget)}
                </td>

                {/* Actual */}
                <td className="py-4 px-4 text-right text-sm font-bold text-gray-900">
                  {fmtRs(row.actual)}
                </td>

                {/* Variance badge */}
                <td className="py-4 px-4 text-right">
                  <VarianceBadge variance={row.variance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
