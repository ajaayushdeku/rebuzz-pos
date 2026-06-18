"use client";

import { Receipt, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { BillItem } from "./staffDetailHelpers";
import { parseNepalDateTime } from "./staffDetailHelpers";
import { useRouter } from "next/navigation";

interface BillsSectionProps {
  bills: BillItem[];
  billLoading: boolean;
  billPage: number;
  pageSize: number;
  billPages: number;
  onPageChange: (page: number) => void;
}

export default function BillsSection({
  bills,
  billLoading,
  billPage,
  pageSize,
  billPages,
  onPageChange,
}: BillsSectionProps) {
  const { currency } = useCurrency();
  const router = useRouter();

  const pagedBills = bills.slice(
    billPage * pageSize,
    (billPage + 1) * pageSize,
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Receipt size={14} className="text-purple-500" />
          </div>
          Transactions / Bills
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          {bills.length} {bills.length === 1 ? "bill" : "bills"}
        </span>
      </div>

      {billLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-blue-500" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          No transactions found for this date range
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 pt-3 px-3 font-medium w-10">
                    #
                  </th>
                  <th className="text-left pb-3 pt-3 px-3 font-medium">
                    Order ID
                  </th>
                  <th className="text-left pb-3 pt-3 px-3 font-medium">
                    Date / Time
                  </th>
                  <th className="text-right pb-3 pt-3 px-3 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedBills.map((bill, idx) => {
                  const billDate = parseNepalDateTime(bill.paidAt);
                  return (
                    <tr
                      key={bill._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/invoices/${bill.invoiceNo}`);
                      }}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-gray-400 text-xs">
                        {billPage * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900 text-xs">
                        ORD-{bill.invoiceNo}
                      </td>
                      <td className="py-3 px-3">
                        {billDate ? (
                          <div>
                            <span className="text-sm font-medium text-gray-800 block">
                              {billDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {billDate.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-900">
                        {formatCurrencySymbol(
                          bill.grandTotal ?? 0,
                          currency.symbol,
                          currency.locale,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bill pagination */}
          {billPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onPageChange(Math.max(0, billPage - 1))}
                disabled={billPage === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  billPage === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs text-gray-400 font-medium">
                Page {billPage + 1} of {billPages}
              </span>
              <button
                onClick={() =>
                  onPageChange(Math.min(billPages - 1, billPage + 1))
                }
                disabled={billPage >= billPages - 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  billPage >= billPages - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
