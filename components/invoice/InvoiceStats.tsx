"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { InvoiceStatsProps } from "@/lib/types/invoice";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
// import { useInvoiceStore } from "@/stores/invoiceStore";

function fmtLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const { currency } = useCurrency();
  // const getFilteredInvoices = useInvoiceStore(
  //   (state) => state.getFilteredInvoices,
  // );
  // const filteredInvoices = getFilteredInvoices();

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

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
      <div className="grid grid-cols-3 gap-8 mb-6">
        {/* Today's Sales */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Today&#39;s Invoice Amt</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            {formatCurrencySymbol(
              totalSalesAmount,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>

        {/* Cash in hand (matches overview's total sales for today) */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Cash in hand</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            {formatCurrencySymbol(
              todayCash ?? 0,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>

        {/* Order count */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Order count</p>
          <p className="md:text-3xl text-xl font-semibold text-gray-900">
            {totalOrderCount}
            <span className="md:text-base text-[12px] font-normal text-gray-500 ml-1">
              {totalOrderCount === 1 ? "order" : "orders"}
            </span>
          </p>
        </div>
      </div>

      {/* Refresh & timestamp */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-500">
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
