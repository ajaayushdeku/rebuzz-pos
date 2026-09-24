"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, PackageCheck } from "lucide-react";
import { useInventoryQuery } from "@/hooks/useInventory";
import { ChartCard } from "@/components/dashboardComponents/chartCard";
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

/** Severity pills, framed in their own hue like the other status chips. */
const LEVEL_STYLES: Record<Level, { badge: string; label: string }> = {
  out: {
    badge: "border-red-200 bg-red-50 text-red-700",
    label: "out of stock",
  },
  critical: {
    badge: "border-red-200 bg-red-50 text-red-600",
    label: "critical",
  },
  warning: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    label: "warning",
  },
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
    <ChartCard
      icon={AlertTriangle}
      // Amber, as before: Tailwind's amber-600 / amber-200 / amber-50.
      iconColor="#d97706"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Low Stock Alerts"
      info={{
        heading: "Reading this card",
        // Variants count separately; the thresholds come from the product.
        body: "Products at or near their low-stock level, worst first. A product with variants is listed per variant, since each one sells on its own. Critical is at or below the product's low-stock number, warning is within twice it.",
      }}
      subtitle="Items running out soon"
      controls={
        <>
          {alerts.length > 0 && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] tabular-nums text-amber-700">
              {alerts.length} low
            </span>
          )}
          <Link
            href="/dashboard/inventory"
            className="group flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
          >
            Restock
            <ChevronRight
              size={12}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </>
      }
    >
      {/* Body */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-[#e8eaed] py-3 last:border-0"
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <PackageCheck size={24} className="text-green-600" />
          </div>
          <p className="text-sm text-[#3c4043]">All items are well stocked</p>
          <p className="mt-1 text-xs text-[#9aa0a6]">
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
                className="flex items-center justify-between border-b border-[#e8eaed] px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#3c4043]">
                    {alert.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9aa0a6]">
                    Remaining:{" "}
                    <span className="font-semibold tabular-nums text-[#5f6368]">
                      {alert.remaining}
                    </span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-0.5 text-[11px] font-semibold ${s.badge}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}

          {alerts.length > MAX_VISIBLE && (
            <Link
              href="/dashboard/inventory"
              className="block pt-2 text-center text-[11px] text-[#5f6368] hover:text-[#3c4043]"
            >
              +{alerts.length - MAX_VISIBLE} more low-stock items
            </Link>
          )}
        </div>
      )}
    </ChartCard>
  );
}
