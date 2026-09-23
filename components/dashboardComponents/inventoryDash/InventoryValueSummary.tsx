"use client";

import { useMemo } from "react";
import {
  Tag,
  Wallet,
  TrendingUp,
  Package,
  Layers,
  DollarSign,
  LineChart,
  ShoppingCart,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  useProductTotalsQuery,
  useSalesByItemQuery,
} from "@/hooks/useInventory";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import RangeTag from "@/components/ui/RangeTag";
import { CHART_PALETTE } from "../chartCard";

// Combined selling/cost value across every product in the business catalog.
// Revenue & net profit follow the shared date range; the rest are stock-based
// and date-independent.
export default function InventoryValueSummary({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading, isError } = useProductTotalsQuery();
  const {
    data: sales,
    isLoading: salesLoading,
    isError: salesError,
  } = useSalesByItemQuery(startDate, endDate);
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const totalSelling = data?.totalSellingPrice ?? 0;
  const totalCost = data?.totalCostPrice ?? 0;
  const potentialMargin = totalSelling - totalCost;
  const productCount = data?.productCount ?? 0;
  const variantCount = data?.variantCount ?? 0;
  const negativeStockCount = data?.negativeStockCount ?? 0;

  // Date-ranged revenue, net profit & order count summed across all products.
  const { totalRevenue, totalNetProfit, totalOrderCount } = useMemo(() => {
    const list = sales ?? [];
    return {
      totalRevenue: list.reduce((sum, s) => sum + (s.totalRevenue ?? 0), 0),
      totalNetProfit: list.reduce((sum, s) => sum + (s.netProfit ?? 0), 0),
      totalOrderCount: list.reduce((sum, s) => sum + (s.count ?? 0), 0),
    };
  }, [sales]);

  type Card = {
    label: string;
    value: string;
    icon: LucideIcon;
    /** Icon tile colours; its border takes the icon's own hue. */
    iconClass: string;
    loading: boolean;
    ranged: boolean;
    /** Shown under the figure — what this number leaves out, and why. */
    note?: string;
  };

  /**
   * A negative count is left out of the valuation, so the two cards it would
   * have changed say so. Without this the figure would simply be different
   * from what a business gets adding its own product list up, with nothing to
   * explain the gap.
   */
  const negativeNote =
    negativeStockCount > 0
      ? `${negativeStockCount} item${
          negativeStockCount > 1 ? "s" : ""
        } with negative stock excluded`
      : undefined;

  // Date-ranged metrics.
  const rangedCards: Card[] = [
    {
      label: "Total Revenue Generated",
      value: fmt(totalRevenue),
      icon: DollarSign,
      iconClass: "bg-emerald-50 text-emerald-600",
      loading: salesLoading,
      ranged: true,
    },
    {
      label: "Total Net Profit Generated",
      value: fmt(totalNetProfit),
      icon: LineChart,
      iconClass: "bg-blue-50 text-blue-600",
      loading: salesLoading,
      ranged: true,
    },
    {
      label: "Total Item Order Count",
      value: totalOrderCount.toLocaleString(),
      icon: ShoppingCart,
      iconClass: "bg-violet-50 text-violet-600",
      loading: salesLoading,
      ranged: true,
    },
  ];

  // Stock-based metrics (date-independent).
  const staticCards: Card[] = [
    {
      label: "Total Selling Price",
      value: fmt(totalSelling),
      icon: Tag,
      iconClass: "bg-emerald-50 text-emerald-600",
      loading: isLoading,
      ranged: false,
      note: negativeNote,
    },
    {
      label: "Total Cost Price",
      value: fmt(totalCost),
      icon: Wallet,
      iconClass: "bg-amber-50 text-amber-600",
      loading: isLoading,
      ranged: false,
      note: negativeNote,
    },
    {
      label: "Potential Margin",
      value: fmt(potentialMargin),
      icon: TrendingUp,
      iconClass: "bg-blue-50 text-blue-600",
      loading: isLoading,
      ranged: false,
    },
    {
      // Parent products only — a product with variants still counts once.
      label: "Total Products",
      value: productCount.toLocaleString(),
      icon: Package,
      iconClass: "bg-gray-50 text-gray-600",
      loading: isLoading,
      ranged: false,
    },
    {
      // Variants across every product; products without variants contribute 0.
      label: "Total Product Variants",
      value: variantCount.toLocaleString(),
      icon: Layers,
      iconClass: "bg-indigo-50 text-indigo-600",
      loading: isLoading,
      ranged: false,
    },
  ];

  const showError = isError && salesError;

  // Label left, icon right, value below — the same tile as OverviewStatBox,
  // CustomerStatBox and the staff-detail grid, so every figure in the app
  // reads the same. The Range tag rides the value row rather than competing
  // with the label for the top row's width.
  const renderCard = (card: Card) => {
    const Icon = card.icon;
    return (
      <div
        key={card.label}
        className="rounded-2xl border bg-white px-5 py-4"
        style={{ borderColor: CHART_PALETTE.border }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="tracking-wide truncate text-[12px]"
            style={{ color: CHART_PALETTE.axis }}
          >
            {card.label}
          </span>
          {/* The tile takes the icon's colour, so `border-current/20` frames
              it in the same hue — as the card icons do. */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${card.iconClass}`}
          >
            <Icon size={15} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          {card.loading ? (
            <div className="h-6 w-24 animate-pulse rounded bg-gray-100" />
          ) : (
            <p
              className="truncate text-xl font-semibold tracking-tight tabular-nums md:text-[22px]"
              style={{ color: CHART_PALETTE.title }}
            >
              {card.value}
            </p>
          )}
          {card.ranged && <RangeTag />}
        </div>

        {card.note && !card.loading && (
          <p
            className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug"
            style={{ color: CHART_PALETTE.warn }}
          >
            <TriangleAlert size={11} className="mt-px shrink-0" />
            {card.note}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mb-4">
      {/* <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Inventory Valuation
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Stock value across all products · revenue, profit &amp; orders for the
          selected range
        </p>
      </div> */}

      {showError ? (
        <div
          className="rounded-2xl border bg-white px-6 py-5"
          style={{ borderColor: CHART_PALETTE.border }}
        >
          <p
            className="py-2 text-center text-xs"
            style={{ color: CHART_PALETTE.bad }}
          >
            Failed to load product valuation
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stock-based metrics */}
          <div>
            <p className="mb-2 tracking-wide font-semibold text-[10px] text-gray-400 uppercase">
              Current stock (all products)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {staticCards.map(renderCard)}
            </div>
          </div>

          {/* Date-ranged metrics */}
          <div>
            <p className="mb-2 tracking-wide font-semibold text-[10px] text-gray-400 uppercase">
              For selected range
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {rangedCards.map(renderCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
