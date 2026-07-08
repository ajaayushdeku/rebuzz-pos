"use client";

import { Tag, Wallet, TrendingUp, Package } from "lucide-react";
import { useProductTotalsQuery } from "@/hooks/useInventory";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

// Combined selling/cost value across every product in the business catalog.
export default function InventoryValueSummary() {
  const { data, isLoading, isError } = useProductTotalsQuery();
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const totalSelling = data?.totalSellingPrice ?? 0;
  const totalCost = data?.totalCostPrice ?? 0;
  const potentialMargin = totalSelling - totalCost;
  const productCount = data?.productCount ?? 0;

  const cards = [
    {
      label: "Total Selling Price",
      value: fmt(totalSelling),
      icon: <Tag size={16} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: "Total Cost Price",
      value: fmt(totalCost),
      icon: <Wallet size={16} className="text-amber-600" />,
      iconBg: "bg-amber-50",
    },
    {
      label: "Potential Margin",
      value: fmt(potentialMargin),
      icon: <TrendingUp size={16} className="text-blue-600" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Total Products",
      value: String(productCount),
      icon: <Package size={16} className="text-gray-600" />,
      iconBg: "bg-gray-100",
    },
  ];

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Inventory Valuation
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Combined selling and cost value across all products
        </p>
      </div>

      {isError ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-red-400 text-center py-2">
            Failed to load product valuation
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  {card.icon}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {card.label}
                </span>
              </div>
              {isLoading ? (
                <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-gray-900 truncate">
                  {card.value}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
