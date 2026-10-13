"use client";

import { Star, ShoppingBag, DollarSign, Edit3 } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "@/components/dashboardComponents/chartCard";
import DetailRow from "./DetailRow";
import { NO_TIER_STYLE } from "./customerDetailHelpers";
import { useTierStyle } from "@/hooks/useLoyaltyTiers";

export default function LoyaltyCard({
  customer,
  loyaltyStatus,
  totalSpent,
  refundedOrders,
  onEdit,
}: {
  customer: Customer;
  loyaltyStatus: string;
  totalSpent: number;
  refundedOrders: number;
  onEdit: () => void;
}) {
  const { currency } = useCurrency();

  // The tier's own colour from the loyalty settings, so this pill matches the
  // ladder in settings and the badge in the customers table.
  const tierStyle = useTierStyle();
  const style = tierStyle(loyaltyStatus);
  const tierClass = style
    ? `${style.bgColor} ${style.color}`
    : NO_TIER_STYLE.bg;

  const money = (amount: number) =>
    formatCurrencySymbol(amount, currency.symbol, currency.locale);

  // Rows whose value is unavailable are dropped rather than shown as a dash.
  const rows = [
    {
      icon: <ShoppingBag size={15} />,
      label: "Total Purchases",
      value: (customer.numberOfPurchases ?? 0).toLocaleString(),
    },
    {
      icon: <DollarSign size={15} />,
      label: "Total Due Amount",
      value:
        customer.totalDueAmount !== undefined
          ? money(customer.totalDueAmount)
          : null,
    },
    {
      icon: <DollarSign size={15} />,
      label: "Total Spent (History)",
      value: money(totalSpent),
    },
    {
      icon: <ShoppingBag size={15} />,
      label: "Refunded Orders",
      value: refundedOrders > 0 ? refundedOrders.toLocaleString() : null,
    },
  ].filter((row) => row.value !== null);

  return (
    <ChartCard
      icon={Star}
      iconColor="#f59e0b"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Loyalty Program"
      info={{
        heading: "Reading this card",
        // Points and the tier they buy, plus what the customer owes.
        body: "The tier this customer has reached and the points behind it — the tier ladder itself is set in loyalty settings. Purchases and spending are all-time. A due amount is money still owed on past orders.",
      }}
      subtitle="Customer's loyalty points, due amount and total spending"
      buttons={
        <button
          type="button"
          onClick={onEdit}
          title="Edit loyalty points"
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:hover:bg-white/10"
        >
          <Edit3 size={11} />
          Edit
        </button>
      }
    >
      {/* Tier & points */}
      <div className="mb-4 rounded-xl  bg-gray-50 px-4 py-3 dark:bg-white/5">
        <div className="flex items-end sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row min-w-0 items-start sm:items-center gap-3">
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tierClass}`}
            >
              {loyaltyStatus}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
                Loyalty points
              </p>
              <p className="truncate text-[22px] font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                {formatAmount(customer.loyaltyPoint ?? 0, currency.locale)}{" "}
                <span className="text-[11px] font-normal text-[#9aa0a6] dark:text-[#9aa6bd]">
                  pts
                </span>
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
              Purchases
            </p>
            <p className="text-lg font-semibold tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
              {(customer.numberOfPurchases ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <DetailRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            value={row.value}
          />
        ))}
      </div>
    </ChartCard>
  );
}
