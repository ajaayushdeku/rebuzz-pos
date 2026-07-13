"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, HandCoins, Users } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import CreditsTable from "@/components/credit/CreditsTable";
import { fetchCreditsClient } from "@/services/apiCredit.client";

export default function Page() {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const {
    data: credits = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCreditsClient,
  });

  const stats = useMemo(() => {
    const totalDue = credits.reduce((s, c) => s + (c.dueAmount ?? 0), 0);
    const totalValue = credits.reduce((s, c) => s + (c.grandTotal ?? 0), 0);
    return { count: credits.length, totalDue, totalValue };
  }, [credits]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center w-screen h-screen text-2xl">
        {":( Error loading credits"}
      </div>
    );

  const statItems = [
    {
      label: "Total Credits",
      value: stats.count,
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      valueColor: "text-gray-900",
      format: "number" as const,
      subText: `${stats.count === 1 ? "Credit" : "Credits"} Total`,
    },
    {
      label: "Credit Value",
      value: stats.totalValue,
      icon: Wallet,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      valueColor: "text-gray-900",
      format: "currency" as const,
      subText: "Total value of all credits",
    },
    {
      label: "Outstanding Due",
      value: stats.totalDue,
      icon: HandCoins,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      valueColor: "text-red-700",
      format: "currency" as const,
      subText: "Total amount due",
    },
  ];

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Credits</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Invoices moved to credit and their outstanding dues
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white py-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statItems.map((item) => {
              const displayValue =
                item.format === "currency"
                  ? formatCurrencySymbol(
                      item.value,
                      currency.symbol,
                      currency.locale,
                    )
                  : item.value.toLocaleString();

              return (
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
                  <p
                    className={`text-lg font-bold truncate ${item.valueColor}`}
                  >
                    {displayValue}
                  </p>
                  {item.subText && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {item.subText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <CreditsTable credits={credits} />
      </div>
    </div>
  );
}
