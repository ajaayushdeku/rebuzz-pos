"use client";

import { DollarSign, Receipt, Wallet, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { InvoiceStatsProps } from "@/lib/types/invoice";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

function fmtLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const { currency } = useCurrency();

  // Today's cash/revenue from the API (same as overview "Total Sales" for today)
  const [todayCash, setTodayCash] = useState<number | null>(null);

  useEffect(() => {
    const today = fmtLocalDate(new Date());
    fetch(`/api/report/compare-sales/date?startDate=${today}&endDate=${today}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json?.data ?? [];
        const totalRevenue = data.reduce(
          (sum: number, d: { totalRevenue: number }) =>
            sum + (d.totalRevenue ?? 0),
          0,
        );
        setTodayCash(totalRevenue);
      })
      .catch(() => {
        // Fallback: do not break the page
        setTodayCash(0);
      });
  }, []);

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const todayInvoices = invoices.filter((invoice) =>
    isToday(invoice.created_at),
  );

  const totalSalesAmount = todayInvoices.reduce(
    (sum: number, invoice) => sum + invoice.amount,
    0,
  );

  // Order count = total invoices (all time)
  const totalOrderCount = invoices.length;

  // Format current date/time for display
  const now = new Date();
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statItems = [
    {
      label: "Today's Invoice Amt",
      value: totalSalesAmount,
      icon: DollarSign,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      valueColor: "text-gray-900",
      format: "currency" as const,
      subText: "Invoices created today",
    },
    {
      label: "Cash in hand",
      value: todayCash ?? 0,
      icon: Wallet,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      valueColor: "text-emerald-700",
      format: "currency" as const,
      subText: "Today's total revenue",
    },
    {
      label: "Order count",
      value: totalOrderCount,
      icon: Receipt,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      valueColor: "text-gray-900",
      format: "number" as const,
      subText: `${totalOrderCount === 1 ? "Order" : "Orders"} Total`,
    },
  ];

  return (
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
              <p className={`text-lg font-bold truncate ${item.valueColor}`}>
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

      {/* Refresh & timestamp */}
      <div className="flex items-center justify-between mt-4 pb-4 pl-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            As of {formattedDate}, {formattedTime}
          </span>
          <button
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="Refresh"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
