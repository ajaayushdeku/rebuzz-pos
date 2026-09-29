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
        .filter((t) => t.kind === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const net = totalIncome - totalExpense;

  const statItems = [
    {
      label: "Miscellaneous Expenses",
      value: totalExpense,
      icon: TrendingDown,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-red-50 dark:bg-red-400/10",
      valueColor: "text-rose-600 dark:text-rose-400",
      subText: "Total expenses recorded",
      prefix: "",
    },
    {
      label: "Miscellaneous Income",
      value: totalIncome,
      icon: TrendingUp,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-400/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
      subText: "Total income recorded",
      prefix: "",
    },
    {
      label: "Net",
      value: net,
      icon: Scale,
      iconColor:
        net >= 0
          ? "text-blue-600 dark:text-[#7ba2e3]"
          : "text-orange-600 dark:text-orange-400",
      bgColor:
        net >= 0
          ? "bg-blue-50 dark:bg-blue-400/10"
          : "bg-orange-50 dark:bg-orange-400/10",
      valueColor:
        net >= 0
          ? "text-blue-700 dark:text-[#a8c4ee]"
          : "text-orange-600 dark:text-orange-400",
      subText: net >= 0 ? "Positive balance" : "Negative balance",
      prefix: net >= 0 ? "+" : "",
    },
  ];

  return (
    <div className="bg-white dark:bg-transparent pb-2 mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-[#161d2e] rounded-xl border border-[#e3e3e3] p-4 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="truncate text-[13px] font-medium text-[#5f6368] dark:text-[#a9b4c7]">
                {item.label}
              </span>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${item.bgColor ?? "bg-gray-50"} ${item.iconColor ?? "text-gray-500"} `}
              >
                <item.icon size={16} />
              </div>
            </div>
            <p
              className={`truncate text-2xl font-semibold tracking-tight tabular-nums  ${item.valueColor}`}
            >
              {item.prefix}{" "}
              {formatCurrencySymbol(
                item.value,
                currency.symbol,
                currency.locale,
              )}
            </p>
            <p className="text-[11px] text-gray-500 truncate tracking-wide dark:text-[#9aa6bd]">
              {item.subText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
