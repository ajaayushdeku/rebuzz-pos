"use client";

import { Star, ShoppingBag, DollarSign, Pencil } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatAmount, formatCurrencySymbol } from "@/utils/helper";
import {
  CardInfo,
  CHART_PALETTE,
} from "@/components/dashboardComponents/chartCard";
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
            title="Edit loyalty points"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            <Pencil size={11} />
            Edit
          </button>
        }
      >
        <div className="min-w-0">
          <h3
            className="flex items-center gap-1.5 text-[15px] font-normal"
            style={{ color: CHART_PALETTE.title }}
          >
            Loyalty Program
            <CardInfo
              heading="Reading this card"
              label="Loyalty Program"
              // Points and the tier they buy, plus what the customer owes.
              body="The tier this customer has reached and the points behind it — the tier ladder itself is set in loyalty settings. Purchases and spending are all-time. A due amount is money still owed on past orders."
            />
          </h3>
          <p
            className="mt-0.5 text-xs tracking-wide"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            Customer&lsquo;s loyalty points, due amount and total spending
          </p>
        </div>
      </CardHeader>

      {/* Tier & points */}
      <div className="mb-4 rounded-xl  bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${tierClass}`}
            >
              {loyaltyStatus}
            </span>
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Loyalty points
              </p>
              <p
                className="truncate text-[22px] font-semibold tracking-tight tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
                {formatAmount(customer.loyaltyPoint ?? 0, currency.locale)}{" "}
                <span
                  className="text-[11px] font-normal"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
                  pts
                </span>
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p
              className="text-[11px] uppercase tracking-wide"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Purchases
            </p>
            <p
              className="text-lg font-semibold tabular-nums"
              style={{ color: CHART_PALETTE.title }}
            >
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
