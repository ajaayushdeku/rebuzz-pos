"use client";

import { ShoppingCart, DollarSign, Package, Clock } from "lucide-react";

export interface UnitEconomics {
  avgProfitPerTransaction: number;
  avgBasketSize: number;
  avgCostPerItem: number;
  profitPerLaborHour: number;
}

export const unitEconomicsMock: UnitEconomics = {
  avgProfitPerTransaction: 18.45,
  avgBasketSize: 42.8,
  avgCostPerItem: 24.3,
  profitPerLaborHour: 31.7,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function UnitEconomics() {
  const data = unitEconomicsMock;

  const metrics = [
    {
      label: "Avg Profit / Transaction",
      value: data.avgProfitPerTransaction,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Avg Basket Size",
      value: data.avgBasketSize,
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Avg Cost / Item",
      value: data.avgCostPerItem,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Profit / Labor Hr",
      value: data.profitPerLaborHour,
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Unit Economics
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Core profitability efficiency metrics
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100"
            >
              {/* Left */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${formatCurrency(item.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
