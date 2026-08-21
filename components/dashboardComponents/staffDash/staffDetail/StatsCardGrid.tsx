"use client";

import { useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PiggyBank,
  Percent,
  Package,
  RefreshCcw,
  Scale,
  Zap,
  List,
  ChevronDown,
  ChevronUp,
  Timer,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import StatCard, {
  StatCardSkeleton,
  type StatSpec,
} from "@/components/ui/StatCard";
import type { StaffOverview } from "./staffDetailHelpers";

interface StatsCardGridProps {
  overview: StaffOverview | null;
  totalPayIn: number;
  totalPayOut: number;
  showOnlyOrders?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function formatMinutesToHours(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/** Toggles how many tiles are shown. Rendered once, used in both states. */
function LoadMoreButton({
  remaining,
  increment,
  onClick,
}: {
  remaining: number;
  increment: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
    >
      <ChevronDown size={14} />
      Load More{" "}
      <span className="text-xs text-blue-400">
        ( {Math.min(increment, remaining)} more )
      </span>
    </button>
  );
}

export default function StatsCardGrid({
  overview,
  totalPayIn,
  totalPayOut,
  showOnlyOrders = false,
  loading = false,
  error = null,
  onRetry,
}: StatsCardGridProps) {
  const { currency } = useCurrency();
  const [visibleCount, setVisibleCount] = useState(4);
  const INCREMENT = 4;

  const money = (amount: number) =>
    formatCurrencySymbol(amount, currency.symbol, currency.locale);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: showOnlyOrders ? 1 : 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <p className="truncate text-sm font-medium text-gray-600">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!overview) {
    return (
      <div className="bg-surface-card border-surface-border mb-6 rounded-xl border px-4 py-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
          <BarChart3 size={20} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No stats available</p>
        <p className="mt-1 text-xs text-gray-400">
          No activity recorded for this period
        </p>
      </div>
    );
  }

  const hasAnalyticsKpis =
    overview.totalProfit !== undefined ||
    overview.profitMargin !== undefined ||
    overview.avgBillValue !== undefined ||
    overview.avgItemsPerBill !== undefined ||
    overview.itemsSold !== undefined ||
    overview.totalRefunds !== undefined ||
    overview.refundedAmount !== undefined ||
    overview.salesPerHour !== undefined ||
    overview.billsPerHour !== undefined ||
    overview.totalShiftMinutes !== undefined;

  /** Included only when the analytics payload actually carried the KPI. */
  const kpi = (source: number | undefined, spec: StatSpec): StatSpec[] =>
    hasAnalyticsKpis && source !== undefined ? [spec] : [];

  const ordersCard: StatSpec = {
    key: "orders",
    label: "Total Orders (All Time)",
    value: (overview.totalOrders ?? 0).toLocaleString(),
    icon: ShoppingCart,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    // The only figure in this grid that does not follow the date filter.
    ranged: false,
  };

  const statCards: StatSpec[] = showOnlyOrders
    ? [ordersCard]
    : [
        ordersCard,
        {
          key: "sales",
          label: "Total Sales",
          value: (overview.totalSales ?? 0).toLocaleString(),
          icon: TrendingUp,
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-50",
          ranged: true,
        },
        {
          key: "revenue",
          label: "Total Revenue",
          value: money(overview.totalRevenue ?? 0),
          icon: DollarSign,
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
          ranged: true,
        },
        ...kpi(overview.totalProfit, {
          key: "totalProfit",
          label: "Total Profit",
          value: money(overview.totalProfit ?? 0),
          icon: PiggyBank,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-50",
          ranged: true,
        }),
        ...kpi(overview.profitMargin, {
          key: "profitMargin",
          label: "Profit Margin",
          value: `${(overview.profitMargin ?? 0).toFixed(2)}%`,
          icon: Percent,
          iconColor: "text-cyan-500",
          bgColor: "bg-cyan-50",
          ranged: true,
        }),
        ...kpi(overview.avgBillValue, {
          key: "avgBillValue",
          label: "Avg Bill Value",
          value: money(overview.avgBillValue ?? 0),
          icon: DollarSign,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-50",
          ranged: true,
        }),
        {
          key: "payIn",
          label: "Total Pay In",
          value: money(totalPayIn),
          icon: ArrowDownLeft,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-50",
          ranged: true,
        },
        {
          key: "payOut",
          label: "Total Pay Out",
          value: money(totalPayOut),
          icon: ArrowUpRight,
          iconColor: "text-red-500",
          bgColor: "bg-red-50",
          ranged: true,
        },
        ...kpi(overview.totalShiftMinutes, {
          key: "totalShiftTime",
          label: "Total Shift Time",
          value: formatMinutesToHours(overview.totalShiftMinutes ?? 0),
          icon: Timer,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
          ranged: true,
        }),
        {
          key: "avgTime",
          label: "Avg Shift Time",
          value: overview.avgTime ?? "—",
          icon: Clock,
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-50",
          ranged: true,
        },
        ...kpi(overview.salesPerHour, {
          key: "salesPerHour",
          label: "Revenue/Hour",
          value: money(overview.salesPerHour ?? 0),
          icon: Zap,
          iconColor: "text-violet-500",
          bgColor: "bg-violet-50",
          ranged: true,
        }),
        ...kpi(overview.billsPerHour, {
          key: "billsPerHour",
          label: "Bills/Hour",
          value: (overview.billsPerHour ?? 0).toFixed(2),
          icon: TrendingUp,
          iconColor: "text-teal-500",
          bgColor: "bg-teal-50",
          ranged: true,
        }),
        ...kpi(overview.avgItemsPerBill, {
          key: "avgItemsPerBill",
          label: "Avg Items/Bill",
          value: (overview.avgItemsPerBill ?? 0).toFixed(2),
          icon: List,
          iconColor: "text-pink-500",
          bgColor: "bg-pink-50",
          ranged: true,
        }),
        ...kpi(overview.itemsSold, {
          key: "itemsSold",
          label: "Items Sold",
          value: (overview.itemsSold ?? 0).toLocaleString(),
          icon: Package,
          iconColor: "text-orange-500",
          bgColor: "bg-orange-50",
          ranged: true,
        }),
        ...kpi(overview.totalRefunds, {
          key: "totalRefunds",
          label: "Total Refunds",
          value: (overview.totalRefunds ?? 0).toLocaleString(),
          icon: RefreshCcw,
          iconColor: "text-red-500",
          bgColor: "bg-red-50",
          ranged: true,
        }),
        ...kpi(overview.refundedAmount, {
          key: "refundedAmount",
          label: "Refunded Amount",
          value: money(overview.refundedAmount ?? 0),
          icon: Scale,
          iconColor: "text-rose-500",
          bgColor: "bg-rose-50",
          ranged: true,
        }),
      ];

  const hasMoreCards = visibleCount < statCards.length;
  const visibleCards = showOnlyOrders
    ? statCards
    : statCards.slice(0, visibleCount);
  const remaining = statCards.length - visibleCount;

  const showMore = () =>
    setVisibleCount((prev) => Math.min(prev + INCREMENT, statCards.length));

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {visibleCards.map(({ key, ...spec }) => (
          <StatCard key={key} {...spec} />
        ))}
      </div>

      {/* Load More / Hide */}
      {statCards.length > 4 && !showOnlyOrders && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {hasMoreCards && (
            <LoadMoreButton
              remaining={remaining}
              increment={INCREMENT}
              onClick={showMore}
            />
          )}
          {visibleCount > 4 && (
            <button
              onClick={() =>
                setVisibleCount((prev) => Math.max(prev - INCREMENT, 4))
              }
              className="flex flex-row items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <ChevronUp size={14} />
              Hide
            </button>
          )}
        </div>
      )}
    </div>
  );
}
