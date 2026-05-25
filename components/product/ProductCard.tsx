import {
  getBarPercent,
  getStockStatus,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { AlertCircle, TrendingUp } from "lucide-react";

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
  const status = getStockStatus(item);
  const barPct = getBarPercent(item);
  const cfg = statusConfig[status];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {item.name}
          </p>
          {/* <p className="text-xs text-gray-400 capitalize mt-0.5">
            Sold by {item.unit}
          </p> */}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
          >
            {cfg.label}
          </span>
          {status === "critical" && (
            <AlertCircle size={13} className="text-red-400" />
          )}
        </div>
      </div>

      {/* Stock number */}
      <div className="mb-3">
        {item.usesStocks ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {item.inStock.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">units</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-gray-400">—</span>
            <span className="text-xs text-gray-400">stock not tracked</span>
          </div>
        )}
      </div>

      {/* Progress bar — threshold based, not max based */}
      {item.usesStocks && (
        <>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${cfg.bar}`}
              style={{ width: `${barPct}%` }}
            />
          </div>

          {/* Threshold info */}
          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${cfg.text}`}>
              {status === "critical"
                ? `Below threshold (min ${item.lowStock})`
                : status === "warning"
                  ? `Near threshold (min ${item.lowStock})`
                  : `Threshold: ${item.lowStock} units`}
            </p>

            {item.orderedCount > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-blue-500">
                <TrendingUp size={11} />
                <span>{item.orderedCount} sold</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Additional info row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          Cost:{" "}
          <span className="font-medium text-gray-600">Rs {item.costPrice}</span>
        </span>
        <div className="flex items-center gap-2">
          {item.isTaxable && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
              TAXABLE
            </span>
          )}
          {!item.isAvailable && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
