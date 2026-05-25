import {
  CreditCard,
  DollarSign,
  LucideIcon,
  Package,
  ShoppingBag,
  Users,
  User,
  Gift,
  Award,
  TrendingUp,
  RefreshCcw,
  Percent,
  ChartPie,
  ArrowUpDown,
  Trophy,
  Clock,
  Star,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingBag,
  Package,
  CreditCard,
  TrendingUp,
  RefreshCcw,
  Percent,
  ChartPie,
  ArrowUpDown,
};

// For dashboard overview stats
export interface SerializableStatConfig {
  key: string;
  label: string;
  footer?: string;
  iconName: string;
  iconColor: string;
  bgColor?: string;
  format?: "currency" | "number" | "percent";
}

export interface ClientStatConfig {
  key: string;
  label: string;
  footer?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor?: string;
  format?: "currency" | "number";
}

export interface MergedSerializableConfig extends SerializableStatConfig {
  value: number;
  percent: number;
}

export interface MergedSerializableConfigCostExpense extends SerializableStatConfig {
  value: number;
}

export interface MergedClientConfig extends ClientStatConfig {
  value: number;
  percent: number;
}

export const STATS_CONFIG: SerializableStatConfig[] = [
  {
    key: "totalSales",
    label: "Total Sales",
    iconName: "DollarSign",
    iconColor: "text-blue-500",
    format: "currency",
  },
  {
    key: "totalOrders",
    label: "Total Orders",
    iconName: "ShoppingBag",
    iconColor: "text-purple-500",
  },
  {
    key: "productsSold",
    label: "Products Sold",
    iconName: "Package",
    iconColor: "text-red-500",
  },
  {
    key: "netProfit",
    label: "Net Profit",
    iconName: "CreditCard",
    iconColor: "text-green-500",
    format: "currency",
  },
];

// For Winning Stats
export const WINNING_STAT_CONFIG: ClientStatConfig[] = [
  {
    key: "topSellingProduct",
    label: "TOP SELLING PRODUCT",
    footer: "Statistics",
    icon: Trophy,
    iconColor: "text-amber-300",
    bgColor: "bg-blue-700",
  },
  {
    key: "peakHour",
    label: "PEAK HOUR",
    footer: "Busiest window of the day",
    icon: Clock,
    iconColor: "text-gray-100",
    bgColor: "bg-purple-700",
  },
  {
    key: "bestDay",
    label: "BEST DAY OF THE WEEK",
    footer: "Above daily mean",
    icon: Star,
    iconColor: "text-amber-300",
    bgColor: "bg-green-700",
  },
];

// For Customer Stats
export const CUSTOMER_STAT_CONFIG: ClientStatConfig[] = [
  {
    key: "totalMembers",
    label: "Total Members",
    icon: Users,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    key: "activeCustomers",
    label: "Active This Month",
    icon: User,
    iconColor: "text-green-500",
    bgColor: "bg-green-100",
  },
  {
    key: "pointsRedeemed",
    label: "Points Redeemed",
    icon: Gift,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    key: "pointsPerMember",
    label: "Avg Points / Member",
    icon: Award,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-100",
  },
];

// For Profit & Cost Stats
export const PROFIT_COST_STAT_CONFIG: SerializableStatConfig[] = [
  {
    key: "grossRevenue",
    label: "Gross Revenue",
    iconName: "DollarSign",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100",
    format: "currency",
  },
  {
    key: "netProfit",
    label: "Net Profit",
    iconName: "TrendingUp",
    iconColor: "text-green-500",
    bgColor: "bg-green-100",
    format: "currency",
  },
  {
    key: "totalRefunds",
    label: "Total Refunds",
    iconName: "RefreshCcw",
    iconColor: "text-red-500",
    bgColor: "bg-red-100",
  },
  {
    key: "avgMargin",
    label: "Avg Margin",
    iconName: "Percent",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-100",
    format: "percent",
  },
];

// For Expenses Stats
export const EXPENSE_STAT_CONFIG: SerializableStatConfig[] = [
  {
    key: "totalExpenses",
    label: "Total Expenses",
    iconName: "DollarSign",
    iconColor: "text-red-500",
    bgColor: "bg-red-100",
    format: "currency",
  },
  {
    key: "totalBudget",
    label: "Total Budget",
    iconName: "ChartPie",
    iconColor: "text-grey-500",
    bgColor: "bg-grey-100",
    format: "number",
  },
  {
    key: "budgetVariance",
    label: "Budget Variance",
    iconName: "ArrowUpDown",
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-100",
    format: "number",
  },
  {
    key: "revenueMargin",
    label: "% of Revenue",
    iconName: "Percent",
    iconColor: "text-purple-500",
    bgColor: "bg-purple-100",
    format: "percent",
  },
];

// For Growth Stats
export const GROWTH_STAT_CONFIG = [
  {
    key: "revenue",
    label: "Revenue Growth (MoM)",
    inverseColor: false,
    format: "currency",
  },
  {
    key: "orders",
    label: "Order Growth (MoM)",
    inverseColor: false,
  },
  {
    key: "avgOrder",
    label: "Avg Order Value (AoV)",
    inverseColor: false,
    format: "currency",
  },
  {
    key: "customers",
    label: "Customer Growth (MoM)",
    inverseColor: false,
  },
  {
    key: "margin",
    label: "Profit Margin",
    inverseColor: false,
    format: "percent",
  },
  {
    key: "refunds",
    label: "Refund Rate",
    inverseColor: true,
    format: "percent",
  },
] as const;
