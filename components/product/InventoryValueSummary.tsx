"use client";

import { useMemo } from "react";
import {
  Tag,
  Wallet,
  TrendingUp,
  Package,
  DollarSign,
  LineChart,
  ShoppingCart,
} from "lucide-react";
import {
  useProductTotalsQuery,
  useSalesByItemQuery,
} from "@/hooks/useInventory";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

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
    icon: React.ReactNode;
    iconBg: string;
    loading: boolean;
    ranged: boolean;
  };

  // Date-ranged metrics.
  const rangedCards: Card[] = [
    {
      label: "Total Revenue Generated",
      value: fmt(totalRevenue),
      icon: <DollarSign size={16} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
      loading: salesLoading,
      ranged: true,
    },
    {
      label: "Total Net Profit Generated",
      value: fmt(totalNetProfit),
      icon: <LineChart size={16} className="text-blue-600" />,
      iconBg: "bg-blue-50",
      loading: salesLoading,
      ranged: true,
    },
    {
      label: "Total Item Order Count",
      value: totalOrderCount.toLocaleString(),
      icon: <ShoppingCart size={16} className="text-violet-600" />,
      iconBg: "bg-violet-50",
      loading: salesLoading,
      ranged: true,
    },
  ];

  // Stock-based metrics (date-independent).
  const staticCards: Card[] = [
    {
      label: "Total Selling Price",
      value: fmt(totalSelling),
      icon: <Tag size={16} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
      loading: isLoading,
      ranged: false,
    },
    {
      label: "Total Cost Price",
      value: fmt(totalCost),
      icon: <Wallet size={16} className="text-amber-600" />,
      iconBg: "bg-amber-50",
      loading: isLoading,
      ranged: false,
    },
    {
      label: "Potential Margin",
      value: fmt(potentialMargin),
      icon: <TrendingUp size={16} className="text-blue-600" />,
      iconBg: "bg-blue-50",
      loading: isLoading,
      ranged: false,
    },
    {
      label: "Total Products",
      value: String(productCount),
      icon: <Package size={16} className="text-gray-600" />,
      iconBg: "bg-gray-100",
      loading: isLoading,
      ranged: false,
    },
  ];

  const showError = isError && salesError;

  const renderCard = (card: Card) => (
    <div
      key={card.label}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}
        >
          {card.icon}
        </div>
        <span className="text-xs text-gray-400 font-medium">{card.label}</span>
        {card.ranged && (
          <span className="ml-auto text-[9px] uppercase tracking-wide text-gray-700 font-semibold">
            Range
          </span>
        )}
      </div>
      {card.loading ? (
        <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
      )}
    </div>
  );

  return (
    <div className="mb-6">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-red-400 text-center py-2">
            Failed to load product valuation
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stock-based metrics */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">
              Current stock (all products)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {staticCards.map(renderCard)}
            </div>
          </div>

          {/* Date-ranged metrics */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">
              For selected range
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {rangedCards.map(renderCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
