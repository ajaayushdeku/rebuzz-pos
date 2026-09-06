"use client";

import {
  ShoppingCart,
  DollarSign,
  Tag,
  UserRound,
  Calculator,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import type { UnitEconomicsData } from "@/services/dashboardServices/apiProfitCost";

export default function UnitEconomics({ data }: { data: UnitEconomicsData }) {
  const { currency } = useCurrency();

  const money = (value: number) =>
    formatCurrencySymbol(value, currency.symbol, currency.locale);

  const metrics: {
    label: string;
    value: string;
    sub?: string;
    icon: typeof DollarSign;
    color: string;
  }[] = [
    {
      label: "Avg Profit / Item Sale",
      value: money(data.avgProfitPerItem),
      icon: DollarSign,
      color: "text-blue-500",
    },
    {
      // Was "Avg Basket Size", showing a bare item count. A basket is a
      // retail-cart idea; what this POS actually closes is an order, and the
      // figure an order is judged by is its value. The item count stays as the
      // secondary line — it explains the value rather than replacing it.
      label: "Avg Order Size",
      value: money(data.avgOrderSize),
      // One decimal, deliberately not formatNumber — that helper pins
      // maximumFractionDigits to 0, which would round 2.8 items to "3" and
      // throw away the only interesting part of the figure.
      sub: `${data.avgItemsPerOrder.toFixed(1)} items per order`,
      icon: ShoppingCart,
      color: "text-violet-500",
    },
    {
      label: "Avg Cost / Item",
      value: money(data.avgCostPerItem),
      icon: Tag,
      color: "text-orange-500",
    },
    {
      label: "Profit / Labor Hr",
      // Null means no shift was recorded in this range, which is not the same
      // as earning nothing per hour — say so rather than print a measured-
      // looking zero.
      value:
        data.profitPerLaborHour === null ? "—" : money(data.profitPerLaborHour),
      sub:
        data.profitPerLaborHour === null
          ? "no shifts recorded in this range"
          : undefined,
      icon: UserRound,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="relative  w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
          <Calculator size={15} className="text-emerald-600" />
        </div>
        <ComponentHeader
          title="Unit Economics"
          subHeader="What one item, one order and one labour hour earn"
        />
      </div>

      <div className="grid grid-cols-2 gap-5 mt-6 ">
        {metrics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
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

              {/* Reserved space keeps the four value rows on one baseline
                  whether or not a card carries a secondary line. */}
              <div className="mt-5 min-h-[2.6rem]">
                <p className="font-bold tracking-tight tabular-nums text-gray-900">
                  {item.value}
                </p>
                {item.sub && (
                  <p className="mt-0.5 text-[11px] leading-4 tabular-nums text-gray-400">
                    {item.sub}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
