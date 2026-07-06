"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { ShoppingCart, DollarSign, Tag, UserRound } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

export interface UnitEconomics {
  avgProfitPerTransaction: number;
  avgBasketSize: number;
  avgCostPerItem: number;
  profitPerLaborHour: number;
}

export const unitEconomicsMock: UnitEconomics = {
  avgProfitPerTransaction: 14.5,
  avgBasketSize: 2.8,
  avgCostPerItem: 1.85,
  profitPerLaborHour: 48.5,
};

export default function UnitEconomics() {
  const { currency } = useCurrency();

  const metrics = [
    {
      label: "Avg Profit /\nTransaction",
      value: formatCurrencySymbol(
        unitEconomicsMock.avgProfitPerTransaction,
        currency.symbol,
        currency.locale,
      ),
      icon: DollarSign,
      color: "text-blue-500",
    },
    {
      label: "Avg Basket Size",
      value: `${unitEconomicsMock.avgBasketSize} items`,
      icon: ShoppingCart,
      color: "text-violet-500",
    },
    {
      label: "Avg Cost / Item",
      value: formatCurrencySymbol(
        unitEconomicsMock.avgCostPerItem,
        currency.symbol,
        currency.locale,
      ),
      icon: Tag,
      color: "text-orange-500",
    },
    {
      label: "Profit / Labor Hr",
      value: formatCurrencySymbol(
        unitEconomicsMock.profitPerLaborHour,
        currency.symbol,
        currency.locale,
      ),
      icon: UserRound,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="relative mt-4 w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <LockDimFeactureOverlay component_name="Unit Economics" />

      <h2 className="mb-8 text-2xl font-semibold text-gray-900">
        Unit Economics
      </h2>

      <div className="grid grid-cols-2 gap-5">
        {metrics.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white px-5 py-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${item.color}`}
                  strokeWidth={2}
                />

                <p className="whitespace-pre-line text-xs font-medium leading-5 text-gray-500">
                  {item.label}
                </p>
              </div>

              <p className="mt-5 font-bold tracking-tight text-gray-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
