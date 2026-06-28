"use client";

import { ShoppingBag, DollarSign, Receipt, RotateCcw } from "lucide-react";
import OrderHistoryStatBoxGrid from "./OrderHistoryStatBoxGrid";
import { OrderHistoryStats as StatsData } from "@/services/dashboardServices/apiOrderHistoryStatsServer";

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
          iconColor: "text-black-600",
          bgColor: "bg-blue-50",
          valueColor: "text-black-700",
          format: "number" as const,
          subText: "All time",
        },
        {
          label: "Revenue",
          value: stats.revenue,
          icon: DollarSign,
          iconColor: "text-emerald-600",
          bgColor: "bg-emerald-50",
          valueColor: "text-emerald-700",
          format: "currency" as const,
          subText: "Excluded Refunds",
        },
        {
          label: "Avg. Order Value",
          value: stats.avgOrderValue,
          icon: Receipt,
          iconColor: "text-blue-600",
          bgColor: "bg-violet-50",
          valueColor: "text-blue-700",
          format: "currency" as const,
          subText: "Per Transaction",
        },
        {
          label: `Refunds${stats.refundCount > 0 ? ` (${stats.refundCount})` : ""}`,
          value: stats.refunds,
          icon: RotateCcw,
          iconColor: "text-orange-600",
          bgColor: "bg-orange-50",
          valueColor: "text-red-600",
          format: "currency" as const,
          subText: `${stats.refundRate}% Refund Rate`,
        },
      ]
    : [];

  return <OrderHistoryStatBoxGrid stats={statItems} isLoading={isLoading} />;
};

export default OrderHistoryStats;
