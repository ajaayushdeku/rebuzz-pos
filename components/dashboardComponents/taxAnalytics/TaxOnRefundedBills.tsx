"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { RefreshCcw, TrendingDown, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface RefundTaxItem {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

const TaxOnRefundedBills = ({
  data,
  isLoading,
  isError,
}: {
  data: RefundTaxItem[];
  isLoading: boolean;
  isError: boolean;
}) => {
  const router = useRouter();
  const { currency } = useCurrency();

  const totalRefundedAmount = data.reduce((s, r) => s + r.refundedAmount, 0);
  const totalTaxRefunded = data.reduce((s, r) => s + r.taxRefunded, 0);
  const avgRefundTaxAmount =
    data.length > 0 ? totalTaxRefunded / data.length : 0;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-bold text-gray-900"> Tax on Refunds</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Tax reversed for returned items
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400 text-center py-16">
          Failed to load Highest Tax Generated
        </p>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <RefreshCcw size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No refunded bills</p>
          <p className="text-xs text-gray-400 mt-1">
            Refunded transactions will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <RefreshCcw size={16} className="text-red-600" />
                </div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  Total Refunded
                </span>
              </div>

              <p className="text-lg font-bold text-red-700">
                {formatCurrencySymbol(
                  totalRefundedAmount,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
              <p className="text-[10px] text-red-500 mt-1">
                {data.length} {data.length === 1 ? "bill" : "bills"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingDown size={16} className="text-orange-600" />
                </div>
                <p className="text-[10px] font-bold text-orange-600  uppercase tracking-wider mb-1">
                  Tax Refunded
                </p>
              </div>

              <p className="text-lg font-bold text-orange-700">
                {formatCurrencySymbol(
                  totalTaxRefunded,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
              <p className="text-[10px] text-orange-500 mt-1">
                {totalRefundedAmount > 0
                  ? `${((totalTaxRefunded / totalRefundedAmount) * 100).toFixed(1)}%`
                  : "0%"}{" "}
                of total
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-blue-600" />
                </div>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                  Avg. Tax Refund
                </p>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrencySymbol(
                  avgRefundTaxAmount,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
              <p className="text-[10px] text-blue-500 mt-1">Per bill</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              Recent Refunds
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.map((bill) => (
                <div
                  key={bill.billNumber}
                  className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-red-200 hover:shadow-sm transition-all"
                >
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => router.push(`/invoices/${bill.billNumber}`)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                        <RefreshCcw size={18} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            ORD-{bill.billNumber}
                          </h4>
                        </div>

                        <div className="flex flex-row gap-1">
                          <p className="text-xs text-gray-600 font-medium">
                            {bill.reason}
                            {" · "}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {bill.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-red-600 mb-1">
                        -
                        {formatCurrencySymbol(
                          bill.refundedAmount,
                          currency.symbol,
                          currency.locale,
                        )}
                      </p>
                      <p className="text-[10px] text-orange-600 font-medium">
                        Tax: -
                        {formatCurrencySymbol(
                          bill.taxRefunded,
                          currency.symbol,
                          currency.locale,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaxOnRefundedBills;
