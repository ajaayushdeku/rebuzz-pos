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

  const statCards = [
    {
      label: "Total Credits",
      value: String(stats.count),
      icon: <Users size={16} className="text-blue-600" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Credit Value",
      value: fmt(stats.totalValue),
      icon: <Wallet size={16} className="text-violet-600" />,
      iconBg: "bg-violet-50",
    },
    {
      label: "Outstanding Due",
      value: fmt(stats.totalDue),
      icon: <HandCoins size={16} className="text-red-600" />,
      iconBg: "bg-red-50",
    },
  ];

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">Credits</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Invoices moved to credit and their outstanding dues
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}
                >
                  {s.icon}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {s.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 truncate">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <CreditsTable credits={credits} />
      </div>
    </div>
  );
}
