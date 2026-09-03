"use client";

import { Star, ShoppingBag, DollarSign, Pencil } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "@/components/ComponentHeader";
import DetailRow from "./DetailRow";
import { DETAIL_CARD, CardHeader } from "./DetailCardShell";
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
    <div className={DETAIL_CARD}>
      <CardHeader
        icon={Star}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        action={
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500"
            title="Edit loyalty points"
          >
            <Pencil size={14} />
          </button>
        }
      >
        <ComponentHeader
          title="Loyalty Program"
          subHeader="Customer's loyalty points, due amount and total spending"
        />
      </CardHeader>

      {/* Tier & points */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${tierClass}`}
            >
              {loyaltyStatus}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Loyalty Points
              </p>
              <p className="truncate text-2xl font-bold tabular-nums text-gray-900">
                {formatAmount(customer.loyaltyPoint ?? 0, currency.locale)}{" "}
                <span className=" text-[11px] text-gray-400">pts</span>
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Purchases
            </p>
            <p className="text-lg font-bold tabular-nums text-gray-900">
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
    </div>
  );
}
