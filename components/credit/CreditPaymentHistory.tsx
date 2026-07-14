"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime } from "@/components/dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import { fetchCreditPaymentHistory } from "@/services/apiCredit.client";

export default function CreditPaymentHistory({
  creditId,
}: {
  creditId: string;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["credit-payment-history", creditId],
    queryFn: () => fetchCreditPaymentHistory(creditId),
  });

  const fmtDate = (raw: string) => {
    const d = parseNepalDateTime(raw);
    return d
      ? d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading payment history...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-xs text-red-500">
        {error instanceof Error
          ? error.message
          : "Failed to load payment history"}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-4 text-xs text-gray-400">No payments recorded yet.</div>
    );
  }

  return (
    <div className="py-2">
      <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
        Payment history
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[11px] text-gray-400 bg-gray-50/70 border-b border-gray-100">
              <th className="text-left py-2 px-3 font-medium">Date</th>
              <th className="text-left py-2 px-3 font-medium">Method</th>
              <th className="text-right py-2 px-3 font-medium">Amount paid</th>
              <th className="text-right py-2 px-3 font-medium">
                Due after payment
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p._id}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-2 px-3 text-gray-600">
                  {fmtDate(p.paymentDate)}
                </td>
                <td className="py-2 px-3 text-gray-600 capitalize">
                  {p.paymentMethod}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                  {fmt(p.paymentAmount ?? 0)}
                </td>
                <td className="py-2 px-3 text-right text-gray-700">
                  {fmt(p.dueAmount ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
