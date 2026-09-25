"use client";

import { useMemo } from "react";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useTracker } from "@/providers/ExpenseContext";
import { CHART_PALETTE } from "../dashboardComponents/chartCard";

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
      iconColor: "text-rose-600",
      bgColor: "bg-red-50",
      valueColor: "text-rose-600",
      subText: "Total expenses recorded",
      prefix: "",
    },
    {
      label: "Miscellaneous Income",
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
    <div className="bg-white pb-2 mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-[#e3e3e3] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="truncate text-[13px] font-medium"
                style={{ color: CHART_PALETTE.axis }}
              >
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
            <p className="text-[11px] text-gray-500 truncate tracking-wide">
              {item.subText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
