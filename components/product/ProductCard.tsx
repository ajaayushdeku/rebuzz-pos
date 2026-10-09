"use client";
/* eslint-disable @next/next/no-img-element */

import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getBarPercent,
  getStockStatus,
  getThresholdPercent,
  MAX_STOCK,
  InventoryItem,
} from "@/lib/mockData/mock-inventory-data";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { useBusiness } from "@/hooks/useBusiness";
import businessLogo from "@/public/rebuzz.png";
import {
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  Ban,
  PackagePlus,
  Infinity as InfinityIcon,
  type LucideIcon,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useDiscounts } from "@/hooks/useDiscounts";
import { normalizeColor } from "@/services/category.client";

/**
 * Per-status presentation.
 *
 * `card` tints the whole card, so a shelf that's run low is visible while
 * scanning the grid rather than only once you read the bar. `count` colours
 * the big number to match, and `bar` fills the track.
 */
const statusConfig = {
  healthy: {
    bar: "bg-emerald-500",
    badge:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-[#161D2E] dark:border-emerald-400/25 dark:text-emerald-300",
    label: "In Stock",
    icon: CheckCircle2,
    text: "text-emerald-600 dark:text-emerald-400",
    card: "border-[#e3e3e3] bg-white dark:bg-[#161d2e] hover:border-[#dadce0] dark:border-white/10 dark:hover:border-white/25",
    count: "text-gray-900 dark:text-[#e8ecf4]",
  },

  warning: {
    bar: "bg-amber-400",
    badge:
      "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-[#161D2E] dark:border-amber-400/25 dark:text-amber-300",
    label: "Low Stock",
    icon: AlertTriangle,
    text: "text-amber-600 dark:text-amber-400",
    card: "border-amber-200 bg-amber-50/40 hover:border-amber-300 dark:bg-amber-400/10 dark:border-amber-400/25",
    count: "text-amber-600 dark:text-amber-400",
  },

  critical: {
    bar: "bg-red-500",
    badge:
      "border border-red-200 bg-red-50 text-red-600 dark:bg-[#161D2E]  dark:border-red-400/25 dark:text-red-300",
    label: "Critical",
    icon: CircleAlert,
    text: "text-red-600 dark:text-red-400",
    card: "border-red-200 bg-red-50/40 hover:border-red-300 dark:bg-red-400/10 dark:border-red-400/25",
    count: "text-red-600 dark:text-red-400",
  },

  out: {
    bar: "bg-gray-900",
    badge: "border border-yellow-400 bg-yellow-100 text-yellow-900",
    label: "Out of Stock",
    icon: Ban,
    text: "text-yellow-900",
    card: "border-yellow-300 bg-yellow-50/50 hover:border-yellow-400",
    count: "text-gray-900 dark:text-[#e8ecf4]",
  },

  overstock: {
    bar: "bg-indigo-500",
    badge:
      "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-[#161D2E] dark:border-indigo-400/25 dark:text-indigo-300",
    label: "Overstocked",
    icon: PackagePlus,
    text: "text-indigo-600 dark:text-indigo-300",
    card: "border-indigo-200 bg-indigo-50/40 hover:border-indigo-300 dark:bg-indigo-400/10 dark:border-indigo-400/25",
    count: "text-indigo-600 dark:text-indigo-300",
  },

  /**
   * Not a stock level, so it is deliberately the quietest tile in the grid —
   * no colour to imply a reading, and a dashed edge that says there is no
   * shelf being counted here rather than a shelf that happens to be fine.
   */
  untracked: {
    bar: "bg-slate-300 dark:bg-white/20",
    badge:
      "border border-slate-200 bg-slate-50 text-slate-600 dark:bg-[#161D2E] dark:border-white/15 dark:text-[#a9b4c7]",
    label: "Not Tracked",
    icon: InfinityIcon,
    text: "text-slate-500 dark:text-[#9aa6bd]",
    card: "border-dashed border-[#dadce0] bg-gray-50/60 hover:border-gray-400 dark:bg-white/5 dark:border-white/15",
    count: "text-gray-400 dark:text-[#7b869b]",
  },
};

/**
 * One combined percentage off the selling price.
 *
 * A product can carry several discounts of mixed kinds, so each is converted
 * to the amount it takes off this product's price — a percentage of the price,
 * or a flat sum — and the total is expressed back as a percentage. That way a
 * "Rs 50 off" and a "10% off" add up to a single figure a shopper can read.
 */
function combinedDiscountPercent(
  price: number,
  applied: { rate: number; type: "percentage" | "fixed" }[],
): number {
  if (price <= 0 || applied.length === 0) return 0;

  const off = applied.reduce(
    (sum, d) =>
      sum + (d.type === "percentage" ? (price * d.rate) / 100 : d.rate),
    0,
  );

  // Discounts can exceed the price on paper; the badge stops at 100%.
  return Math.min(100, Math.round((off / price) * 100));
}

/**
 * One figure, label left and value right.
 *
 * At four cards per row a side-by-side grid of numbers truncates both the
 * labels and the amounts. Stacked rows keep each figure whole and let the eye
 * run down a single column of values.
 */
function StatRow({
  label,
  value,
  tone = "text-gray-700 dark:text-[#c3ccdc]",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
        {label}
      </span>
      <span className={`text-[13px] font-medium tabular-nums ${tone}`}>
        {value}
      </span>
    </div>
  );
}

/** Hazard tape for an empty shelf — the whole track, since there's no fill. */
const HAZARD_STRIPES: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, #FACC15 0 8px, #111827 8px 16px)",
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
  /**
   * When > 0, these figures are the parent product's and cover this many
   * variants — salesByItem didn't break them out per variant.
   */
  sharedVariants?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Ties the toggle to the region it opens, for assistive tech.
  const panelId = useId();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const status = getStockStatus(item);
  const barPct = getBarPercent(item);
  const thresholdPct = getThresholdPercent(item);
  const cfg = statusConfig[status];
  const StatusIcon: LucideIcon = cfg.icon;
  const { currency } = useCurrency();
  const { data: business } = useBusiness();
  const { data: categories = [] } = useCategories();
  const { data: allDiscounts = [] } = useDiscounts();

  const isOut = status === "out";
  // `untracked` carries its own card treatment now, so every status is read
  // off the one config rather than special-cased here.
  const cardTone = cfg.card;

  // Resolve the category id stored on the product to its name + colour.
  const category = useMemo(
    () => categories.find((c) => c._id === item.categories),
    [categories, item.categories],
  );

  const categoryColor = category
    ? (normalizeColor(category.color) ?? undefined)
    : undefined;

  const categoryTextColor = categoryColor
    ? `color-mix(in oklab, ${categoryColor}, black 45%)`
    : undefined;
  const categoryTextColorDark = categoryColor
    ? `color-mix(in oklab, ${categoryColor}, white 45%)`
    : undefined;

  const categoryBoderColor = categoryColor
    ? `color-mix(in oklab, ${categoryColor}, black 20%)`
    : undefined;
  const categoryBorderColorDark = categoryColor
    ? `color-mix(in oklab, ${categoryColor}, white 20%)`
    : undefined;

  // Only live discounts count — a disabled one takes nothing off the price.
  const discountPercent = useMemo(() => {
    const ids = item.discounts ?? [];
    if (ids.length === 0) return 0;

    const applied = allDiscounts
      .filter((d) => ids.includes(d._id) && d.isEnabled)
      .map((d) => ({ rate: d.rate, type: d.type }));

    return combinedDiscountPercent(item.price, applied);
  }, [item.discounts, item.price, allDiscounts]);

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

  /** The line under the bar, phrased for the state it's describing. */
  const thresholdNote = () => {
    switch (status) {
      case "out":
        return "Out of stock · restock now";
      case "critical":
        return `Below threshold · min ${item.lowStock}`;
      case "warning":
        return `Near threshold · min ${item.lowStock}`;
      case "overstock":
        return `Above max ${MAX_STOCK.toLocaleString()} · overstocked`;
      default:
        return `Threshold ${item.lowStock} · max ${MAX_STOCK.toLocaleString()}`;
    }
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border transition-colors duration-200 ${cardTone}`}
    >
      {discountPercent > 0 && (
        <span className="sr-only">{discountPercent} percent discount</span>
      )}

      <div className="flex flex-1 flex-col">
        {/* ── Header: thumbnail, identity, toggle — all on one row ──
            Was a full-width `aspect-square` hero above the name. A square
            image is as tall as the card is wide, so on a one-column phone the
            card opened with a ~330px photograph and ran to about 420px shut —
            one product per screen. */}
        <div className="flex items-start gap-3 ">
          <button
            type="button"
            onClick={() => gallery.length && openLightbox(0)}
            disabled={!gallery.length}
            aria-label={`View images of ${item.name}`}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-br-md sm:rounded-br-xl bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-30 sm:w-30 dark:bg-white/10"
          >
            {primary && !imgError ? (
              <>
                <img
                  src={primary}
                  alt={item.name}
                  loading="lazy"
                  onError={() => setImgError(true)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                  <Expand
                    size={14}
                    className="cursor-pointer text-white opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </span>
                {gallery.length > 1 && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1 py-px text-[9px] font-medium text-white">
                    {gallery.length}
                  </span>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-white/5">
                <img
                  src={business?.logo || businessLogo.src}
                  alt=""
                  className="h-9 w-9 object-contain opacity-90"
                />
              </div>
            )}
          </button>

          <div className="min-w-0 flex-1 pt-2">
            <h3 className="line-clamp-2 text-[13px] leading-snug text-[#3c4043] dark:text-[#e8ecf4]">
              {item.name}
            </h3>

            {/* Status, and the one figure worth seeing while collapsed. The
                badge used to float over the image; at thumbnail size there is
                nothing to float over, and it reads better in the line. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${cfg.badge}`}
              >
                <StatusIcon className="h-3 w-3 shrink-0" aria-hidden />
                {cfg.label}
              </span>
              {item.usesStocks && (
                <span
                  className={`text-[11px] font-medium tabular-nums ${cfg.text}`}
                >
                  {item.inStock.toLocaleString()} in stock
                </span>
              )}
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0">
              {/* Price, and what comes off it. The discount was a rotated ribbon
                pinned past the corner, which needed a tall card to cross; on
                this one it would have run through the thumbnail. */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[15px] font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                  {fmt(item.price)}
                </span>
                {discountPercent > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {/* Tags on their own wrapping line. Sharing the name's row, three
                pills and a two-line name had about 150px between them on a
                phone, which clipped the name to a word. */}
              {(item.isTaxable || item.categories || !item.isAvailable) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {item.isTaxable && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0 sm:py-0.5 text-[9px] sm:text-[10px] text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-[#7ba2e3]">
                      Taxable
                    </span>
                  )}

                  {item?.categories && (
                    <span
                      className="max-w-[9rem] truncate rounded-full border border-[var(--cat-edge)] px-1.5 py-0 sm:py-0.5 text-[9px] sm:text-[10px] text-[var(--cat-ink)] dark:border-[var(--cat-edge-dark)] dark:text-[var(--cat-ink-dark)]"
                      style={
                        {
                          "--cat-ink": categoryTextColor,
                          "--cat-ink-dark": categoryTextColorDark,
                          "--cat-edge": categoryBoderColor,
                          "--cat-edge-dark": categoryBorderColorDark,
                          backgroundColor: `${categoryColor}20`,
                        } as React.CSSProperties
                      }
                    >
                      {category?.name}
                    </span>
                  )}

                  {!item.isAvailable && (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[9px] sm:text-[10px] text-gray-500 dark:border-white/15 dark:bg-white/5 dark:text-[#9aa6bd]">
                      Unavailable
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 ">
          <div
            id={panelId}
            inert={!isExpanded}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
              isExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            {/* The rule and the bottom padding live inside the clipped
                box, so a shut card has neither. On the wrapper they would
                draw a line under every collapsed card and leave 12px of
                space beneath it. */}
            <div
              className={`flex flex-col overflow-hidden border-t border-[#e8eaed]  dark:border-white/10 ${isExpanded ? "pt-3" : ""}`}
            >
              {/* Stock — same reserved height whether or not stock is tracked */}
              <div className="min-h-[14px] flex flex-col justify-end mb-2">
                {item.usesStocks ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-semibold tracking-tight tabular-nums ${cfg.count}`}
                      >
                        {item.inStock.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-[#9aa6bd]">
                        units in stock
                      </span>
                      {(status === "critical" || isOut) && (
                        <AlertCircle
                          size={13}
                          className={`ml-auto ${isOut ? "text-yellow-700" : "text-red-400"}`}
                        />
                      )}
                    </div>

                    {/* Bar fills with how much stock there IS. An empty shelf gets
                    hazard tape across the whole track, since 0% would show
                    nothing at all. */}
                    <div
                      className={`relative mt-2 w-full h-3 rounded-full overflow-hidden ${
                        isOut
                          ? "ring-1 ring-yellow-500/60"
                          : "bg-gray-300/70 dark:bg-white/20"
                      }`}
                      style={isOut ? HAZARD_STRIPES : undefined}
                      role="img"
                      aria-label={`${item.inStock} of ${MAX_STOCK} units — ${cfg.label}`}
                    >
                      {!isOut && (
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                          style={{ width: `${barPct}%` }}
                        />
                      )}

                      {/* Low-stock marker, so the threshold is visible on the bar */}
                      {!isOut && thresholdPct > 0 && thresholdPct < 100 && (
                        <span
                          aria-hidden="true"
                          className="absolute top-0 h-full w-px bg-gray-500/40 dark:bg-white/20"
                          style={{ left: `${thresholdPct}%` }}
                        />
                      )}
                    </div>

                    <div className="my-1.5 flex items-center justify-between text-[10px]">
                      <span className={`font-medium ${cfg.text}`}>
                        {thresholdNote()}
                      </span>
                      {item.orderedCount > 0 && (
                        <span className="flex items-center gap-0.5 text-blue-500 font-medium shrink-0 dark:text-[#7ba2e3]">
                          <TrendingUp size={10} />
                          {item.orderedCount} sold
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  // The counted products show a number, a bar and a threshold
                  // here. Saying plainly that there is nothing to count beats
                  // leaving the same space blank, which reads as missing data.
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white/60 dark:bg-white/5 px-2.5 py-2 dark:border-white/20">
                    <StatusIcon
                      className={`h-4 w-4 shrink-0 ${cfg.text}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-[#a9b4c7]">
                        Stock not tracked
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-[#7b869b]">
                        Always sellable — no count is kept
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sales row */}
              {hasSales ? (
                <div className="mb-3 flex flex-col gap-1 border-t border-[#e8eaed] pt-2 dark:border-white/10">
                  {/* {sharedVariants > 0 && (
                <p className="text-[10px] text-amber-600 mb-1.5 dark:text-amber-400">
                  Combined across all {sharedVariants} variants
                </p>
              )} */}

                  <span className="ml-auto text-[10px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                    Selected range
                  </span>

                  <div className="space-y-1">
                    <StatRow
                      label="Revenue"
                      value={fmt(revenue ?? 0)}
                      tone="text-blue-600 dark:text-[#7ba2e3]"
                    />
                    <StatRow
                      label="Orders"
                      value={(orderCount ?? 0).toLocaleString()}
                      tone="text-violet-700 dark:text-violet-300"
                    />
                    <StatRow
                      label="Net profit"
                      value={fmt(netProfit ?? 0)}
                      tone={
                        (netProfit ?? 0) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500 dark:text-red-400"
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex flex-col items-center gap-1 border-t border-[#e8eaed] pt-3 dark:border-white/10">
                  <span className="text-center text-[10px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                    No sales data for this product in the selected date range.
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="border-t border-[#e8eaed] pt-3 dark:border-white/10">
                <div className="space-y-1">
                  <StatRow label="Selling price" value={fmt(item.price)} />
                  <StatRow label="Cost price" value={fmt(item.costPrice)} />

                  {item.usesStocks && (
                    <>
                      <StatRow
                        label="In-Stock value (sell)"
                        value={fmt(item.price * item.inStock)}
                      />
                      <StatRow
                        label="In-Stock value (cost)"
                        value={fmt(item.costPrice * item.inStock)}
                      />
                    </>
                  )}
                </div>

                {/* Images gallery section */}
                {gallery.length > 0 && (
                  <div className="mt-2 border-t border-[#e8eaed] pt-3 dark:border-white/10">
                    <p className="mb-2 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                      Images
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {gallery.map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => openLightbox(i)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors dark:border-white/15"
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
            </div>
          </div>

          {/* The pair the tax and budget cards use: a neutral pill to open,
              a rose one to close. Below the panel rather than beside the name,
              so the label sits with the section it governs — and outside the
              clipped box, since inside it there would be no way back open. */}
          <div className="flex items-center justify-end pb-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              className={
                isExpanded
                  ? "flex cursor-pointer items-center gap-1 rounded-full  bg-rose-50 px-3 py-0.5 sm:py-1  text-[9px] sm:text-[10px] text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
                  : "flex cursor-pointer items-center gap-1 rounded-full  bg-white px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:hover:bg-white/10"
              }
            >
              <span className="hidden sm:block">
                {isExpanded ? "Hide details" : "Show details"}
              </span>
              <ChevronDown
                size={12}
                className={`shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
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
