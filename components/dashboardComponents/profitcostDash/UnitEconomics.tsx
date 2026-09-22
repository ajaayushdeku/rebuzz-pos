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
import RangeBadge from "@/components/ui/RangeBadge";
import type { UnitEconomicsData } from "@/services/dashboardServices/apiProfitCost";
import { CHART_PALETTE, ChartCard } from "../chartCard";

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
    <ChartCard
      icon={Calculator}
      // Emerald, as before: Tailwind's emerald-600 / emerald-200 / emerald-50.
      iconColor="#059669"
      iconBorder="#a7f3d0"
      iconBg="#ecfdf5"
      title="Unit Economics"
      info={{
        heading: "Reading this card",
        // From getUnitEconomics: report + salesByItem + shifts for the range.
        body: "For the date range at the top of the page. Profit per item is the sales report's profit divided by the units sold; order size is revenue divided by the number of orders; cost per item is the items' cost prices over the units sold; profit per labor hour divides that profit by the hours of the shifts recorded in the range.",
      }}
      subtitle="What one item, one order and one labor hour earn"
      controls={<RangeBadge variant="pill" />}
      className="h-full"
    >
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border px-4 py-4 transition-colors hover:bg-[#f8f9fa]"
              style={{ borderColor: CHART_PALETTE.border }}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${item.color}`}
                  strokeWidth={2}
                />

                <p
                  className="whitespace-pre-line text-[11px] leading-5"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {item.label}
                </p>
              </div>

              {/* Reserved space keeps the four value rows on one baseline
                  whether or not a card carries a secondary line. */}
              <div className="mt-4 min-h-[2.6rem]">
                <p
                  className="text-lg font-semibold tracking-tight tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {item.value}
                </p>
                {item.sub && (
                  <p
                    className="mt-0.5 text-[11px] leading-4 tabular-nums"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {item.sub}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
