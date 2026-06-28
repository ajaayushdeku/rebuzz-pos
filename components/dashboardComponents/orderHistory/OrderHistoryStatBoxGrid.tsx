"use client";

import { LucideIcon } from "lucide-react";
import OrderHistoryStatBox from "./OrderHistoryStatBox";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  valueColor?: string;
  format?: "currency" | "number";
  subText?: string;
}

interface OrderHistoryStatBoxGridProps {
  stats: StatItem[];
  isLoading?: boolean;
}

const OrderHistoryStatBoxGrid = ({
  stats,
  isLoading = false,
}: OrderHistoryStatBoxGridProps) => {
  return (
    <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <OrderHistoryStatBox
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
          bgColor={stat.bgColor}
          valueColor={stat.valueColor}
          format={stat.format}
          subText={stat.subText}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default OrderHistoryStatBoxGrid;
