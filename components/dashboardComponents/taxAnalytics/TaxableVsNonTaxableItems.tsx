"use client";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";

interface TaxableBreakdown {
  taxableRevenue: number;
  taxableTaxAmount: number;
  nonTaxableRevenue: number;
}

const TaxableVsNonTaxableItems = ({ data }: { data: TaxableBreakdown }) => {
  const { currency } = useCurrency();
  const totalRevenue = data.taxableRevenue + data.nonTaxableRevenue;
  const taxablePct =
    totalRevenue > 0 ? (data.taxableRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Taxable Revenue
            </span>
          </div>
          <p className="text-lg font-bold text-blue-800">
            {formatCurrencySymbol(
              data.taxableRevenue,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${taxablePct}%` }}
            />
          </div>
          <p className="text-[10px] text-blue-500 mt-1">
            {taxablePct.toFixed(1)}% of total revenue
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Receipt size={16} className="text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Non-Taxable
            </span>
          </div>
          <p className="text-lg font-bold text-gray-700">
            {formatCurrencySymbol(
              data.nonTaxableRevenue,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-400"
              style={{ width: `${100 - taxablePct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {(100 - taxablePct).toFixed(1)}% of total revenue
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              Tax Collected
            </span>
          </div>
          <p className="text-lg font-bold text-green-800">
            {formatCurrencySymbol(
              data.taxableTaxAmount,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-green-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: `${data.taxableRevenue > 0 ? (data.taxableTaxAmount / data.taxableRevenue) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-green-500 mt-1">
            Effective tax rate:{" "}
            {data.taxableRevenue > 0
              ? ((data.taxableTaxAmount / data.taxableRevenue) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
      </div>

      {/* Detailed progress comparison */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Revenue Breakdown
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Taxable Items
                </span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrencySymbol(
                  data.taxableRevenue,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${taxablePct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Non-Taxable Items
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-500">
                {formatCurrencySymbol(
                  data.nonTaxableRevenue,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${100 - taxablePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxableVsNonTaxableItems;
