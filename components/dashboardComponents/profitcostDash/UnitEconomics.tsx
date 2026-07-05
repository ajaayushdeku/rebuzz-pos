"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
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
      <LockDimFeactureOverlay />

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
