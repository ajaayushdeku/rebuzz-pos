"use client";

import { useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";

interface TaxableBreakdown {
  taxableRevenue: number;
  taxableTaxAmount: number;
  nonTaxableRevenue: number;
  taxableItems: { name: string; revenue: number }[];
  nonTaxableItems: { name: string; revenue: number }[];
}

const ITEMS_PER_PAGE = 5;

const TaxableVsNonTaxableItems = ({ data }: { data: TaxableBreakdown }) => {
  const { currency } = useCurrency();
  const totalRevenue = data.taxableRevenue + data.nonTaxableRevenue;
  const taxablePct =
    totalRevenue > 0 ? (data.taxableRevenue / totalRevenue) * 100 : 0;

  const [showTaxableAll, setShowTaxableAll] = useState(false);
  const [showNonTaxableAll, setShowNonTaxableAll] = useState(false);

  const taxableHasMore = (data.taxableItems?.length ?? 0) > ITEMS_PER_PAGE;
  const nonTaxableHasMore =
    (data.nonTaxableItems?.length ?? 0) > ITEMS_PER_PAGE;

  const taxableItems = showTaxableAll
    ? data.taxableItems
    : (data.taxableItems?.slice(0, ITEMS_PER_PAGE) ?? []);

  const nonTaxableItems = showNonTaxableAll
    ? data.nonTaxableItems
    : (data.nonTaxableItems?.slice(0, ITEMS_PER_PAGE) ?? []);

  return (
    <div className="space-y-4">
      {/* Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Taxable Revenue
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrencySymbol(
              data.taxableRevenue,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${taxablePct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {taxablePct.toFixed(1)}% of total revenue
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Receipt size={16} className="text-gray-500" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Non-Taxable Revenue
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrencySymbol(
              data.nonTaxableRevenue,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-400"
              style={{ width: `${100 - taxablePct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {(100 - taxablePct).toFixed(1)}% of total revenue
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Tax Collected
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrencySymbol(
              data.taxableTaxAmount,
              currency.symbol,
              currency.locale,
            )}
          </p>
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${data.taxableRevenue > 0 ? (data.taxableTaxAmount / data.taxableRevenue) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Effective tax rate:{" "}
            {data.taxableRevenue > 0
              ? ((data.taxableTaxAmount / data.taxableRevenue) * 100).toFixed(1)
              : "0"}
            %
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white ">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          Revenue Breakdown
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Taxable Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-gray-700">
                  Taxable Items
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-600">
                {formatCurrencySymbol(
                  data.taxableRevenue,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${taxablePct}%` }}
              />
            </div>

            {taxableItems.length > 0 ? (
              <div className="mt-2 space-y-1">
                {taxableItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="text-gray-700 truncate">{item.name}</span>
                    <span className="font-medium text-blue-600 shrink-0 ml-2">
                      {formatCurrencySymbol(
                        item.revenue,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>
                ))}
                {taxableHasMore && (
                  <button
                    onClick={() => setShowTaxableAll(!showTaxableAll)}
                    className="mt-2 w-full text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 py-1.5 rounded-md transition-colors"
                  >
                    {showTaxableAll
                      ? "Hide"
                      : `Load More (${data.taxableItems.length - ITEMS_PER_PAGE} more)`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                No taxable items
              </p>
            )}
          </div>

          {/* Non-Taxable Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  Non-Taxable Items
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {formatCurrencySymbol(
                  data.nonTaxableRevenue,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${100 - taxablePct}%` }}
              />
            </div>

            {nonTaxableItems.length > 0 ? (
              <div className="mt-2 space-y-1">
                {nonTaxableItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700 truncate">{item.name}</span>
                    <span className="font-medium text-gray-500 shrink-0 ml-2">
                      {formatCurrencySymbol(
                        item.revenue,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>
                ))}
                {nonTaxableHasMore && (
                  <button
                    onClick={() => setShowNonTaxableAll(!showNonTaxableAll)}
                    className="mt-2 w-full text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 py-1.5 rounded-md transition-colors"
                  >
                    {showNonTaxableAll
                      ? "Hide"
                      : `Load More (${data.nonTaxableItems.length - ITEMS_PER_PAGE} more)`}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                No non-taxable items
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxableVsNonTaxableItems;
