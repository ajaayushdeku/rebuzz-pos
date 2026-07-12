"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, PackageCheck } from "lucide-react";
import { useInventoryQuery } from "@/hooks/useInventory";

type Level = "out" | "critical" | "warning";

type StockAlert = {
  name: string;
  remaining: string;
  inStock: number;
  level: Level;
};

const LEVEL_STYLES: Record<Level, { badge: string; label: string }> = {
  out: { badge: "bg-red-200 text-red-800", label: "out of stock" },
  critical: { badge: "bg-red-100 text-red-600", label: "critical" },
  warning: { badge: "bg-amber-100 text-amber-700", label: "warning" },
};

const LEVEL_ORDER: Record<Level, number> = { out: 0, critical: 1, warning: 2 };
const MAX_VISIBLE = 6;

export default function LowStockAlerts() {
  const { data: products = [], isLoading, isError } = useInventoryQuery();

  const alerts = useMemo<StockAlert[]>(() => {
    const rows: StockAlert[] = [];
    for (const p of products) {
      if (!p.usesStocks) continue;

      let level: Level | null = null;
      if (p.inStock <= 0) level = "out";
      else if (p.inStock <= p.lowStock) level = "critical";
      else if (p.inStock <= p.lowStock * 2) level = "warning";
      if (!level) continue;

      rows.push({
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
    <div className="relative bg-white rounded-2xl border-l-4 border-l-amber-400 border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Low Stock Alerts
              {alerts.length > 0 && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Items running out soon</p>
          </div>
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
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <PackageCheck size={18} className="text-green-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            All items are well stocked
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            No items are running low right now
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => {
            const s = LEVEL_STYLES[alert.level];
            return (
              <div
                key={alert.name}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
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
