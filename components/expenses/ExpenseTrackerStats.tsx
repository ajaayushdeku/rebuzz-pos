"use client";

import { useMemo } from "react";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";

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

  const statItems = [
    {
      label: "Expenses",
      value: totalExpense,
      icon: TrendingDown,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      valueColor: "text-red-600",
      subText: "Total expenses recorded",
      prefix: "",
    },
    {
      label: "Income",
      value: totalIncome,
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      valueColor: "text-emerald-600",
      subText: "Total income recorded",
      prefix: "",
    },
    {
      label: "Net",
      value: net,
      icon: Scale,
      iconColor: net >= 0 ? "text-blue-600" : "text-orange-600",
      bgColor: net >= 0 ? "bg-blue-50" : "bg-orange-50",
      valueColor: net >= 0 ? "text-blue-700" : "text-orange-600",
      subText: net >= 0 ? "Positive balance" : "Negative balance",
      prefix: net >= 0 ? "+" : "",
    },
  ];

  return (
    <div className="bg-white py-2 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                {item.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}
              >
                <item.icon size={16} className={item.iconColor} />
              </div>
            </div>
            <p className={`text-lg font-bold truncate ${item.valueColor}`}>
              {item.prefix}
              {formatCurrencySymbol(
                item.value,
                currency.symbol,
                currency.locale,
              )}
            </p>
            <p className="text-[11px] text-gray-400 truncate">{item.subText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
