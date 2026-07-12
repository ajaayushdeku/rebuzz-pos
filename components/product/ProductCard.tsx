"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { createPortal } from "react-dom";
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
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Expand,
  X,
} from "lucide-react";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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

  // Primary image + `images` gallery, de-duplicated.
  const gallery = Array.from(
    new Set(
      [item.image, ...(item.images ?? [])].filter(Boolean) as string[],
    ),
  );
  const primary = gallery[0];

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = () =>
    setLightboxIndex((i) =>
      i === null ? 0 : (i - 1 + gallery.length) % gallery.length,
    );
  const showNext = () =>
    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % gallery.length));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative flex overflow-hidden">
      {/* ── Left: image column (~30%, full height) ── */}
      <button
        type="button"
        onClick={() => gallery.length && openLightbox(0)}
        disabled={!gallery.length}
        aria-label="View product image"
        className="relative w-[30%] shrink-0 min-h-[8rem] bg-gray-100 group focus:outline-none"
      >
        {primary ? (
          <>
            <img
              src={primary}
              alt={item.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <Expand
                size={18}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </span>
            {gallery.length > 1 && (
              <span className="absolute bottom-1.5 right-1.5 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                {gallery.length}
              </span>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-300" />
          </div>
        )}
      </button>

      {/* ── Right: content ── */}
      <div className="flex-1 min-w-0">
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0">
              {item.name}
            </h3>
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

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-gray-100 p-4">
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

            {/* Images gallery section */}
            {gallery.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">
                  Images
                </p>
                <div className="flex flex-wrap gap-2">
                  {gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => openLightbox(i)}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={src}
                        alt={`${item.name} ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null &&
        gallery.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close"
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X size={26} />
            </button>

            <div
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={gallery[lightboxIndex]}
                  alt={item.name}
                  className="w-full max-h-[75vh] object-contain rounded-lg bg-black"
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-2 justify-center mt-3 flex-wrap">
                  {gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        i === lightboxIndex
                          ? "border-white"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={src}
                        alt={`${item.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <p className="text-center text-white/70 text-xs mt-2 truncate">
                {item.name}
                {gallery.length > 1 && ` · ${lightboxIndex + 1}/${gallery.length}`}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
