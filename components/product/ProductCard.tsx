import { useState } from "react";
import {
  getBarPercent,
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { AlertCircle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

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

export default function ProductCard({ item }: { item: InventoryItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getStockStatus(item);
  const barPct = getBarPercent(item);
  const cfg = statusConfig[status];
  const { currency } = useCurrency();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative">
      {/* Collapsed View - Minimal */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
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
            <div className="flex items-center justify-between text-xs">
              <p className={`font-medium ${cfg.text}`}>
                {status === "critical"
                  ? `Below threshold (min ${item.lowStock})`
                  : status === "warning"
                    ? `Near threshold (min ${item.lowStock})`
                    : `Threshold: ${item.lowStock} units`}
              </p>

              <p className={`text-xs font-medium ${cfg.text}`}>Max (1000)</p>

              {item.orderedCount > 0 && (
                <div className="flex items-center gap-0.5 text-blue-500">
                  <TrendingUp size={11} />
                  <span>{item.orderedCount} sold</span>
                </div>
              )}
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
              <span className="text-gray-400">Selling Price</span>
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
          <div className="mt-3 flex items-center justify-end gap-2">
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
          </div>
        </div>
      )}
    </div>
  );
}
