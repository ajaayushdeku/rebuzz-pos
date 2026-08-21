"use client";

import { Star, DollarSign, ShoppingBag, CreditCard } from "lucide-react";
import type { Customer } from "@/lib/types/customer";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import StatCard, {
  StatCardSkeleton,
  type StatSpec,
} from "@/components/ui/StatCard";

/**
 * The four headline figures, built from a spec list and rendered through the
 * shared StatCard — the same construction as the employee detail grid.
 *
 * No RANGE tags: this page has no date filter, so every figure is all-time
 * and a tag on each would say nothing.
 */
export default function CustomerDetailStats({
  customer,
  totalSpent,
  totalOrders,
  loading = false,
}: {
  customer: Customer;
  totalSpent: number;
  totalOrders: number;
  loading?: boolean;
}) {
  const { currency } = useCurrency();
  const money = (amount: number) =>
    formatCurrencySymbol(amount, currency.symbol, currency.locale);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const stats: StatSpec[] = [
    {
      key: "loyalty",
      label: "Loyalty Points",
      value: customer.loyaltyPoint.toLocaleString(),
      icon: Star,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      key: "spent",
      label: "Total Spent",
      value: money(totalSpent),
      icon: DollarSign,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      key: "orders",
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: ShoppingBag,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      key: "due",
      label: "Due Amount",
      value:
        customer.totalDueAmount !== undefined
          ? money(customer.totalDueAmount)
          : "—",
      icon: CreditCard,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ key, ...spec }) => (
        <StatCard key={key} {...spec} />
      ))}
    </div>
  );
}
