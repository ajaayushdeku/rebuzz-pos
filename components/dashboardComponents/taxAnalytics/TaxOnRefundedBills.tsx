"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { RefreshCcw, ArrowUpRight, TrendingDown } from "lucide-react";

interface RefundTaxItem {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

const TaxOnRefundedBills = ({ data }: { data: RefundTaxItem[] }) => {
  const { currency } = useCurrency();

  const totalRefundedAmount = data.reduce((s, r) => s + r.refundedAmount, 0);
  const totalTaxRefunded = data.reduce((s, r) => s + r.taxRefunded, 0);

  if (data.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">
        No refunded bill data available
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider">
            Total Refunded
          </p>
          <p className="text-sm font-bold text-red-700 mt-1">
            {formatCurrencySymbol(
              totalRefundedAmount,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
          <p className="text-[10px] text-orange-500 font-medium uppercase tracking-wider">
            Tax Refunded
          </p>
          <p className="text-sm font-bold text-orange-700 mt-1">
            {formatCurrencySymbol(
              totalTaxRefunded,
              currency.symbol,
              currency.locale,
            )}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {data.map((bill) => (
          <div
            key={bill.billNumber}
            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <RefreshCcw size={12} className="text-red-400 shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {bill.billNumber}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 ml-5">
                {bill.date} · {bill.reason}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-xs font-semibold text-red-600">
                -
                {formatCurrencySymbol(
                  bill.refundedAmount,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
              <p className="text-[10px] text-orange-500">
                Tax: -
                {formatCurrencySymbol(
                  bill.taxRefunded,
                  currency.symbol,
                  currency.locale,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaxOnRefundedBills;
