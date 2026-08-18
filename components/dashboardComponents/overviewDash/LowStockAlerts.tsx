"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, PackageCheck } from "lucide-react";
import { useInventoryQuery } from "@/hooks/useInventory";
import { ComponentHeader } from "@/components/ComponentHeader";
import { formatVariantName } from "@/utils/helper";

type Level = "out" | "critical" | "warning";

type StockAlert = {
  /** Unique per row — a product id, or "<productId>:<variantId>". */
  key: string;
  /** "Coke [Medium/Cherry]" for a variant row. */
  name: string;
  remaining: string;
  inStock: number;
  level: Level;
};

/**
 * Severity for a stock reading, or null when there is nothing to report.
 * Extracted so the parent-product and per-variant paths can't drift apart.
 */
function levelFor(inStock: number, lowStock: number): Level | null {
  if (inStock <= 0) return "out";
  if (inStock <= lowStock) return "critical";
  if (inStock <= lowStock * 2) return "warning";
  return null;
}

const LEVEL_STYLES: Record<Level, { badge: string; label: string }> = {
  out: { badge: "bg-red-200 text-red-800", label: "out of stock" },
  critical: { badge: "bg-red-100 text-red-600", label: "critical" },
  warning: { badge: "bg-amber-100 text-amber-700", label: "warning" },
};

const LEVEL_ORDER: Record<Level, number> = { out: 0, critical: 1, warning: 2 };
const MAX_VISIBLE = 3;

export default function LowStockAlerts() {
  const { data: products = [], isLoading, isError } = useInventoryQuery();

  const alerts = useMemo<StockAlert[]>(() => {
    const rows: StockAlert[] = [];
    for (const p of products) {
      if (!p.usesStocks) continue;

      const variants = p.variants ?? [];

      // A variant product holds no stock of its own — its `inStock` is 0, which
      // the parent-level check would report as "out of stock" for every such
      // product. Each variant is its own sellable line, so each is its own row.
      if (variants.length > 0) {
        for (const v of variants) {
          const level = levelFor(v.inStock, v.lowStock);
          if (!level) continue;

          rows.push({
            key: `${p.id}:${v.id}`,
            name: formatVariantName(p.name, v.optionValues),
            remaining: `${v.inStock.toLocaleString()} ${p.unit}`,
            inStock: v.inStock,
            level,
          });
        }
        continue;
      }

      const level = levelFor(p.inStock, p.lowStock);
      if (!level) continue;

      rows.push({
        key: p.id,
        name: p.name,
        remaining: `${p.inStock.toLocaleString()} ${p.unit}`,
        inStock: p.inStock,
        level,
      });
    }
    return rows.sort(
      (a, b) =>
        LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.inStock - b.inStock,
    );
  }, [products]);

  const visible = alerts.slice(0, MAX_VISIBLE);

  return (
    // <div className="relative bg-white rounded-2xl border-l-4 border-l-amber-400 border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
    <div className="relative bg-white rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 align-start">
            {" "}
            <AlertTriangle size={16} className="text-amber-500" />
            {alerts.length > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>

          <ComponentHeader
            title=" Low Stock Alerts
              "
            subHeader="  Items running out soon"
          />
        </div>
        <Link
          href="/dashboard/inventory"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Restock <ChevronRight size={13} />
        </Link>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400 text-center py-6">
          Failed to load stock alerts
        </p>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <PackageCheck size={24} className="text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            All items are well stocked
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No items are running low right now
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => {
            const s = LEVEL_STYLES[alert.level];
            return (
              <div
                key={alert.key}
                className="flex items-center justify-between py-3 px-4 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {alert.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Remaining:{" "}
                    <span className="font-bold text-gray-700">
                      {alert.remaining}
                    </span>
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 ${s.badge}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}

          {alerts.length > MAX_VISIBLE && (
            <Link
              href="/dashboard/inventory"
              className="block text-center text-xs font-medium text-gray-500 hover:text-gray-700 pt-1"
            >
              +{alerts.length - MAX_VISIBLE} more low-stock items
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
