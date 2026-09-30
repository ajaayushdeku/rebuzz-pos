"use client";

import { ShoppingBag, DollarSign, Receipt, RotateCcw } from "lucide-react";
import OrderHistoryStatBoxGrid from "./OrderHistoryStatBoxGrid";

export type OrderHistoryStats = {
  totalOrders: number;
  revenue: number;
  avgOrderValue: number;
  refunds: number;
  refundCount: number;
  refundRate: number;
};

interface OrderHistoryStatsProps {
  stats: OrderHistoryStats | null;
  isLoading?: boolean;
}

const OrderHistoryStats = ({
  stats,
  isLoading = false,
}: OrderHistoryStatsProps) => {
  const statItems = stats
    ? [
        {
          label: "Total Orders",
          value: stats.totalOrders,
          icon: ShoppingBag,
          iconColor: "text-blue-600 dark:text-[#a8c4ee]",
          bgColor: "bg-blue-50 dark:bg-blue-400/10",
          valueColor: "text-gray-700 dark:text-[#e8ecf4]",
          format: "number" as const,
          subText: "Refunds included",
        },
        {
          label: "Revenue",
          value: stats.revenue,
          icon: DollarSign,
          iconColor: "text-emerald-600 dark:text-emerald-300",
          bgColor: "bg-emerald-50 dark:bg-emerald-400/10",
          valueColor: "text-emerald-700 dark:text-emerald-300",
          format: "currency" as const,
          subText: "Excluded Refunds",
        },
        {
          label: "Avg. Order Value",
          value: stats.avgOrderValue,
          icon: Receipt,
          iconColor: "text-blue-600 dark:text-blue-300",
          bgColor: "bg-violet-50 dark:bg-violet-400/10",
          valueColor: "text-blue-700 dark:text-blue-300",
          format: "currency" as const,
          subText: "Per Transaction",
        },
        {
          label: `Refunds${stats.refundCount > 0 ? ` (${stats.refundCount})` : ""}`,
          value: stats.refunds,
          icon: RotateCcw,
          iconColor: "text-rose-600 dark:text-rose-300",
          bgColor: "bg-rose-50 dark:bg-rose-400/10",
          valueColor: "text-rose-600 dark:text-rose-300",
          format: "currency" as const,
          subText: `${stats.refundRate}% Refund Rate`,
        },
      ]
    : [];

  return <OrderHistoryStatBoxGrid stats={statItems} isLoading={isLoading} />;
};

export default OrderHistoryStats;
