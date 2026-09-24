"use client";
import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { Transaction } from "../orderHistory/transaction-columns";
import { paymentMethods } from "@/lib/config/transaction";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "@/components/dashboardComponents/chartCard";
import StatusPill from "@/components/ui/StatusPill";

type RecentTransactionsProps = {
  title?: string;
  description?: string;
  viewAllHref?: string;
  transactions: Transaction[];
};

/** Best-effort Date for a transaction (ISO createdAt, else date + timestamp). */
function getTxDate(tx: Transaction): Date | null {
  const raw =
    tx.createdAt ||
    (tx.date && tx.timestamp ? `${tx.date} ${tx.timestamp}` : tx.date);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** Relative "time ago" label: moments / min / hours / days ago. */
function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "moments ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function RecentTransactions({
  title = "Recent Transactions",
  description = "Revenue performance - current week",
  viewAllHref = "/records/order-history",
  transactions,
}: RecentTransactionsProps) {
  const { currency } = useCurrency();
  return (
    <ChartCard
      icon={Receipt}
      // Indigo, as before: Tailwind's indigo-600 / indigo-200 / indigo-50.
      iconColor="#4f46e5"
      iconBorder="#c7d2fe"
      iconBg="#eef2ff"
      title={title}
      info={{
        heading: "Reading this table",
        // The newest handful, with the full list a click away.
        body: "The most recent paid orders, newest first. Amount is the order total; status is how it was settled. Use View all for the complete order history.",
      }}
      subtitle={description}
      controls={
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
        >
          View all
          <ChevronRight
            size={12}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      }
      className="flex-1"
    >
      {/* Horizontally scrollable table wrapper for mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white  overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[#e8eaed] text-[11px] text-[#5f6368]">
              <th className="px-4 pb-2.5 pt-1 text-left font-normal">Order</th>
              <th className="px-4 pb-2.5 pt-1 text-left font-normal">
                Customer
              </th>
              <th className="px-4 pb-2.5 pt-1 text-center font-normal">
                Payment
              </th>
              <th className="px-4 pb-2.5 pt-1 text-right font-normal">
                Amount
              </th>
              <th className="px-4 pb-2.5 pt-1 text-center font-normal">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
                      <Receipt size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm text-[#3c4043]">
                      No recent transactions found
                    </p>
                    <p className="mt-1 text-xs text-[#9aa0a6]">
                      Recent transactions will appear here
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const paymentStyles = paymentMethods[tx.paymentMethod];
                const txDate = getTxDate(tx);
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#f8f9fa]"
                  >
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-[#3c4043]">
                        {tx.id}
                      </p>
                      {txDate && (
                        <p className="text-[11px] text-[#9aa0a6]">
                          {timeAgo(txDate)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5f6368]">
                      {tx.invoiceName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${paymentStyles.badge} ${paymentStyles.cell} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold`}
                      >
                        {tx.paymentMethod.charAt(0).toUpperCase() +
                          tx.paymentMethod.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-[#3c4043]">
                      {/* {formatCurrency(Number(tx.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(tx.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill label={tx.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
