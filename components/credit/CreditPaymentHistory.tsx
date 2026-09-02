"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { parseNepalDateTime } from "@/components/dashboardComponents/staffDash/staffDetail/staffDetailHelpers";
import { fetchCreditPaymentHistory } from "@/services/apiCredit.client";

/**
 * A payment's timestamp — the day it landed, then the hour.
 *
 * The date leads: within one credit's history what a reader is answering is
 * "when did they pay", and that is a day. The time is the detail underneath,
 * in 24-hour for scanning a column and 12-hour in brackets because that is
 * what staff say to each other.
 */
function PaymentDate({ raw }: { raw: string }) {
  const d = parseNepalDateTime(raw);
  if (!d) return <span className="text-gray-400">—</span>;

  return (
    <div>
      <span className="block text-[12px] font-semibold text-gray-700">
        {d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
      <span className="mt-0.5 block text-[11px] tabular-nums text-gray-500">
        {d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
        <span className="text-gray-500">
          {"  "}[{" "}
          {d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          ]
        </span>
      </span>
    </div>
  );
}

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading payment history...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/60 py-2.5 px-3 text-xs text-red-500">
        {error instanceof Error
          ? error.message
          : "Failed to load payment history"}
      </div>
    );
  }

  // Only show payments where an actual amount was paid.
  const paidPayments = payments.filter((p) => (p.paymentAmount ?? 0) > 0);

  if (paidPayments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white/80 py-3 px-3 mt-3 text-xs text-gray-500">
        No payments recorded yet.
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Payment history
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white ">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-800 text-[11px] text-white px-3.5  tracking-wide">
              <th className="w-[15px] text-left py-2.5 px-3.5 font-semibold">
                #
              </th>
              <th className="text-left py-2.5 px-3.5 font-semibold">Date</th>
              <th className="text-left py-2.5 px-3.5 font-semibold">
                Payment Method
              </th>
              <th className="text-right py-2.5 px-3.5 font-semibold">
                Amount paid
              </th>
              <th className="text-right py-2.5 px-3.5 font-semibold">
                Due after payment
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paidPayments.map((p, idx) => (
              <tr
                key={p._id}
                className="transition-colors border-t border-gray-200  hover:bg-gray-50/60"
              >
                <td className="py-2.5 px-3.5 text-gray-600">{idx + 1}.</td>
                <td className="py-2.5 px-3.5">
                  <PaymentDate raw={p.paymentDate} />
                </td>
                <td className="py-2.5 px-3.5 font-semibold text-gray-600 capitalize">
                  {p.paymentMethod === "Qr Payment"
                    ? "QR Payment"
                    : p.paymentMethod}
                </td>
                <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600">
                  {fmt(p.paymentAmount ?? 0)}
                </td>
                <td className="py-2.5 px-3.5 text-right font-semibold text-gray-700">
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
