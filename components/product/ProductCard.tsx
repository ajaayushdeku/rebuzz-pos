import { useState } from "react";
import {
  getBarPercent,
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import {
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from "lucide-react";

// const statusConfig = {
//   critical: {
//     bar: "bg-red-500",
//     badge: "bg-red-100 text-red-600",
//     label: "Critical",
//     text: "text-red-500",
//   },
//   warning: {
//     bar: "bg-amber-400",
//     badge: "bg-amber-100 text-amber-700",
//     label: "Low",
//     text: "text-amber-500",
//   },
//   healthy: {
//     bar: "bg-blue-500",
//     badge: "bg-green-100 text-green-700",
//     label: "In Stock",
//     text: "text-green-600",
//   },
//   overstock: {
//     bar: "bg-amber-400",
//     badge: "bg-amber-100 text-amber-700",
//     label: "Overstock",
//     text: "text-amber-600",
//   },
// };

const statusConfig = {
  healthy: {
    bar: "bg-blue-500",
    badge: "bg-green-100 text-green-700",
    label: "In Stock",
    text: "text-green-600",
  },

  warning: {
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Low",
    text: "text-amber-500",
  },

  critical: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-600",
    label: "Critical",
    text: "text-red-500",
  },

  out: {
    bar: "bg-red-700",
    badge: "bg-red-200 text-red-800",
    label: "Out of Stock",
    text: "text-red-700",
  },
};

export default function ProductCard({
  item,
  revenue,
  netProfit,
  orderCount,
}: {
  item: InventoryItem;
  /** Date-ranged revenue for this product (undefined = no sales data). */
  revenue?: number;
  /** Date-ranged net profit for this product. */
  netProfit?: number;
  /** Date-ranged item order count for this product. */
  orderCount?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getStockStatus(item);
  const barPct = getBarPercent(item);
  const cfg = statusConfig[status];
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);
  const hasSales =
    revenue !== undefined ||
    netProfit !== undefined ||
    orderCount !== undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative">
      {/* Collapsed View - Minimal */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Product thumbnail */}
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={16} className="text-gray-300" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {item.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
            >
              {cfg.label}
            </span>
            {item.isTaxable && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                TAXABLE
              </span>
            )}
            {!item.isAvailable && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium">
                Unavailable
              </span>
            )}
            {status === "critical" && (
              <AlertCircle size={13} className="text-red-400" />
            )}
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            {item.usesStocks ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {item.inStock.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">units in stock</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Stock not tracked</span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Less</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>More</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {/* Progress bar in collapsed view */}
        {item.usesStocks && (
          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${cfg.bar}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <p className={`font-medium ${cfg.text}`}>
                {status === "critical"
                  ? `Below threshold (min ${item.lowStock})`
                  : status === "warning"
                    ? `Near threshold (min ${item.lowStock})`
                    : `Threshold: ${item.lowStock} units`}
              </p>

              <p className={`text-[11px] font-medium ${cfg.text}`}>
                Max (1000)
              </p>

              {item.orderedCount > 0 && (
                <div className="flex items-center gap-0.5 text-blue-500">
                  <TrendingUp size={11} />
                  <span>{item.orderedCount} sold</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date-ranged revenue, net profit & order count */}
        {hasSales && (
          <div className="mt-3 pt-3 border-t-[1px] border-gray-150 grid grid-cols-3 gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                Revenue
              </p>
              <p className="text-xs font-semibold text-blue-500 truncate">
                {fmt(revenue ?? 0)}
              </p>
            </div>

            <div className="min-w-0 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                Orders
              </p>
              <p className="text-xs font-semibold text-violet-700 truncate">
                {(orderCount ?? 0).toLocaleString()}
              </p>
            </div>

            <div className="min-w-0 text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                Net Profit
              </p>
              <p
                className={`text-xs font-semibold truncate ${
                  (netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {fmt(netProfit ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded View - Inline flow to avoid overlap */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Price details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 ">Selling Price</span>
              <span className="font-medium text-gray-700">
                {formatCurrencySymbol(
                  item.price,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Cost Price</span>
              <span className="font-medium text-gray-700">
                {formatCurrencySymbol(
                  item.costPrice,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>

            {item.usesStocks && (
              <>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                  <span className="text-gray-400">Total Selling Value</span>
                  <span className="font-semibold text-gray-700">
                    {formatCurrencySymbol(
                      item.price * item.inStock,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total Cost Value</span>
                  <span className="font-semibold text-gray-700">
                    {formatCurrencySymbol(
                      item.costPrice * item.inStock,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Badges */}
          {/* <div className="mt-3 flex items-center justify-end gap-2">
            {item.isTaxable && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                TAXABLE
              </span>
            )}
            {!item.isAvailable && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium">
                Unavailable
              </span>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}
