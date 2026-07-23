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
import businessLogo from "@/public/rebuzz.png";
import {
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
} from "lucide-react";

const statusConfig = {
  healthy: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    label: "In Stock",
    icon: "✅",
    text: "text-emerald-600",
    fill: "rgba(16,185,129,0.10)",
  },

  warning: {
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Low Stock",
    icon: "⚠️",
    text: "text-amber-500",
    fill: "rgba(245,158,11,0.14)",
  },

  critical: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-600",
    label: "Critical",
    icon: "🔴",
    text: "text-red-500",
    fill: "rgba(239,68,68,0.12)",
  },

  out: {
    bar: "bg-red-700",
    badge: "bg-red-200 text-red-800",
    label: "Out of Stock",
    icon: "🚫",
    text: "text-red-700",
    fill: "rgba(185,28,28,0.15)",
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
    new Set([item.image, ...(item.images ?? [])].filter(Boolean) as string[]),
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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col">
      <div className="flex flex-col flex-1">
        {/* ── Image (top) ── */}
        <button
          type="button"
          onClick={() => gallery.length && openLightbox(0)}
          disabled={!gallery.length}
          aria-label="View product image"
          className="relative h-40 w-full shrink-0 bg-gray-100 group focus:outline-none"
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
                <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                  {gallery.length}
                </span>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <img
                src={businessLogo.src}
                alt="Business Logo"
                className="w-20 h-15 object-contain opacity-90"
              />
            </div>
          )}

          {/* Status badge overlay */}
          {item.usesStocks && (
            <span
              className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${cfg.badge}`}
            >
              {cfg.icon} {cfg.label}
            </span>
          )}
        </button>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col  flex-1">
          {/* Name + taxable pill */}
          <div className="flex  justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2  flex-1 min-w-0">
              {item.name}
            </h3>

            <span className="flex flex-row">
              {item.isTaxable && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
                  Taxable
                </span>
              )}

              {/* Meta badges */}
              {!item.isAvailable && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                    Unavailable
                  </span>
                </div>
              )}
            </span>
          </div>

          {/* Stock — same reserved height whether or not stock is tracked */}
          <div className="min-h-[14px] flex flex-col justify-end">
            {item.usesStocks ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-gray-900 tabular-nums">
                    {item.inStock.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    units in stock
                  </span>
                  {status === "critical" && (
                    <AlertCircle size={13} className="text-red-400 ml-auto" />
                  )}
                </div>

                <div className="mt-2 w-full h-4 rounded-full bg-gray-200/70 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                <div className="my-1.5 flex items-center justify-between text-[10px]">
                  <span className={`font-medium ${cfg.text}`}>
                    {status === "critical"
                      ? `Below threshold · min ${item.lowStock}`
                      : status === "warning"
                        ? `Near threshold  · min ${item.lowStock}`
                        : `Threshold ${item.lowStock} · max 1,000`}
                  </span>
                  {item.orderedCount > 0 && (
                    <span className="flex items-center gap-0.5 text-blue-500 font-medium shrink-0">
                      <TrendingUp size={10} />
                      {item.orderedCount} sold
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400">Stock not tracked</span>
            )}
          </div>

          {/* Sales row */}
          {hasSales && (
            <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 mb-3">
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

          {/* Expanded View */}
          {isExpanded && (
            <div className="pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 justigy-between gap-3.5">
                <>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                      Selling Price
                    </p>
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {formatCurrencySymbol(
                        item.price,
                        currency.symbol,
                        currency.locale,
                      )}
                    </p>
                  </div>

                  <div className="min-w-0 flex flex-col text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                      Cost Price
                    </p>
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {formatCurrencySymbol(
                        item.costPrice,
                        currency.symbol,
                        currency.locale,
                      )}
                    </p>
                  </div>
                </>

                {item.usesStocks && (
                  <>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                        Total Selling Value
                      </p>
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {formatCurrencySymbol(
                          item.price * item.inStock,
                          currency.symbol,
                          currency.locale,
                        )}
                      </p>
                    </div>

                    <div className="min-w-0  flex flex-col text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                        Total Cost Value
                      </p>
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {formatCurrencySymbol(
                          item.costPrice * item.inStock,
                          currency.symbol,
                          currency.locale,
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Images gallery section */}
              {gallery.length > 0 && (
                <div className="mt-2 pt-3 border-t border-gray-50">
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

          {/* Expand toggle — stays at the bottom of the card */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-auto pt-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                <span>Show more</span>
                <ChevronDown size={13} />
              </>
            )}
          </button>
        </div>
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
                {gallery.length > 1 &&
                  ` · ${lightboxIndex + 1}/${gallery.length}`}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
