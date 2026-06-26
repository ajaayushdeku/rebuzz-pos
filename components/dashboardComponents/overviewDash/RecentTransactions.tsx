"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { Transaction } from "../orderHistory/transaction-columns";
import { statusStyles } from "@/lib/config/transaction";
import { formatCurrency, formatCurrencySymbol } from "@/utils/helper";

type RecentTransactionsProps = {
  title?: string;
  description?: string;
  viewAllHref?: string;
  transactions: Transaction[];
};

export default function RecentTransactions({
  title = "Recent Transactions",
  description = "Revenue performance - current week",
  viewAllHref = "/records/order-history",
  transactions,
}: RecentTransactionsProps) {
  const { currency } = useCurrency();
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="group flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50"
        >
          View all
          <ChevronRight
            size={22}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {/* Horizontally scrollable table wrapper for mobile */}
      {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto"> */}
      <div className="bg-white  overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium">Order</th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">Customer</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Amount</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const styles = statusStyles[tx.status];
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-gray-900">
                        {tx.id}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">
                      {tx.invoiceName}
                    </td>
                    <td className="py-3 px-4 text-xs text-right font-semibold text-gray-900">
                      {/* {formatCurrency(Number(tx.amount), currency)} */}
                      {formatCurrencySymbol(
                        Number(tx.amount),
                        currency.symbol,
                        currency.locale,
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`${styles.badge} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
