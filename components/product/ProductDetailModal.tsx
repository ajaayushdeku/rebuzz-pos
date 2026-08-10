"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Percent,
  Scale,
  Layers,
  Ban,
  AlertTriangle,
  X,
} from "lucide-react";
import { Product, ProductVariant } from "@/lib/types/product";
import { useCurrency } from "@/providers/CurrencyContext";
import { useCategories } from "@/hooks/useCategories";
import { normalizeColor } from "@/services/category.client";
import { formatCurrencySymbol } from "@/utils/helper";

/**
 * Colour is a code here, not decoration: each data domain owns one hue, and it
 * only ever appears on that domain's label, icon and 3px rail. The figures
 * themselves stay near-black so the numbers read first.
 */
const DOMAIN = {
  price: { rail: "bg-emerald-500", label: "text-emerald-700" },
  cost: { rail: "bg-amber-500", label: "text-amber-700" },
  stock: { rail: "bg-blue-500", label: "text-blue-700" },
  variant: { rail: "bg-violet-500", label: "text-violet-700" },
} as const;

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

/** Section heading — an eyebrow with an optional right-hand note. */
function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {title}
        </h3>
        {note && <span className="text-[11px] text-slate-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** A headline figure with its domain rail. The rail carries the colour code. */
function Figure({
  domain,
  label,
  value,
  sub,
}: {
  domain: keyof typeof DOMAIN;
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`w-[3px] rounded-full shrink-0 ${DOMAIN[domain].rail}`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${DOMAIN[domain].label}`}
        >
          {label}
        </p>
        <p className="text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums leading-snug truncate">
          {value}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Key/value row for the details list. */
function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-slate-700 text-right min-w-0 truncate">
        {children}
      </span>
    </div>
  );
}

export default function ProductDetailModal({
  open,
  onClose,
  product,
}: ProductDetailModalProps) {
  const { currency } = useCurrency();
  const { data: categories = [] } = useCategories();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Escape closes, matching the backdrop click.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Stop the page behind the overlay from scrolling with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const category = useMemo(
    () => categories.find((c) => c._id === product?.categories),
    [categories, product?.categories],
  );

  const variants: ProductVariant[] = useMemo(
    () => product?.variants ?? [],
    [product?.variants],
  );
  const hasVariants = variants.length > 0;

  /**
   * A product with variants carries price, cost and stock on the variants —
   * its own row reads 0 for all three. Reading the parent's fields shows
   * "Rs 0.00" and "0 in stock" for the products that hold the most inventory,
   * so everything below is rolled up from the variants instead.
   */
  const rollup = useMemo(() => {
    if (!hasVariants) return null;

    const prices = variants.map((v) => v.price ?? 0);
    const costs = variants.map((v) => v.costPrice ?? 0).filter((c) => c > 0);

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minCost: costs.length ? Math.min(...costs) : null,
      maxCost: costs.length ? Math.max(...costs) : null,
      costsKnown: costs.length,
      totalStock: variants.reduce((sum, v) => sum + (v.inStock ?? 0), 0),
      lowCount: variants.filter(
        (v) =>
          (v.lowStock ?? 0) > 0 && (v.inStock ?? 0) <= (v.lowStock as number),
      ).length,
      unavailable: variants.filter((v) => v.isAvailable === false).length,
    };
  }, [hasVariants, variants]);

  if (!open || !mounted || !product) return null;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  /** One figure when every variant agrees, a span when they don't. */
  const range = (min: number, max: number) =>
    min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;

  const categoryColor = category ? normalizeColor(category.color) : null;

  const marginOf = (price: number, cost?: number) =>
    cost !== undefined && cost > 0 ? price - cost : null;

  const marginPct = (price: number, cost: number) =>
    cost > 0 ? Math.round(((price - cost) / cost) * 100) : null;

  // ── Non-variant figures ──
  const flatMargin = !hasVariants
    ? marginOf(product.price, product.costPrice)
    : null;
  const flatMarginPct =
    !hasVariants && product.costPrice
      ? marginPct(product.price, product.costPrice)
      : null;

  const flatLow =
    !hasVariants &&
    product.usesStocks &&
    (product.lowStock ?? 0) > 0 &&
    (product.inStock ?? 0) <= (product.lowStock as number);

  const variantLabel = (v: ProductVariant) =>
    v.optionValues.length > 0 ? v.optionValues.join(" · ") : "Default";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 "
      onClick={onClose}
    >
      {/* Panel — wide enough for the five-column variant table, and capped in
          height so the body scrolls rather than the page. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="relative flex w-full max-w-3xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2
              id="product-detail-title"
              className="text-lg font-semibold tracking-tight text-slate-900 truncate"
            >
              {product.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 line-clamp-2">
              {product.description || "Product details"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* Headline figures */}
          <div className="grid grid-cols-3 gap-5">
            <Figure
              domain="price"
              label="Price"
              value={
                hasVariants && rollup
                  ? range(rollup.minPrice, rollup.maxPrice)
                  : fmt(product.price)
              }
              sub={
                hasVariants && rollup && rollup.minPrice !== rollup.maxPrice
                  ? "varies by variant"
                  : undefined
              }
            />

            <Figure
              domain="cost"
              label="Cost"
              value={
                hasVariants && rollup
                  ? rollup.minCost !== null
                    ? range(rollup.minCost, rollup.maxCost as number)
                    : "—"
                  : (product.costPrice ?? 0) > 0
                    ? fmt(product.costPrice as number)
                    : "—"
              }
              sub={
                hasVariants &&
                rollup &&
                rollup.costsKnown > 0 &&
                rollup.costsKnown < variants.length
                  ? `${rollup.costsKnown} of ${variants.length} recorded`
                  : undefined
              }
            />

            <Figure
              domain="stock"
              label="In stock"
              value={
                hasVariants && rollup
                  ? rollup.totalStock.toLocaleString()
                  : product.usesStocks
                    ? (product.inStock ?? 0).toLocaleString()
                    : "—"
              }
              sub={
                hasVariants && rollup ? (
                  rollup.lowCount > 0 ? (
                    <span className="text-amber-600 font-medium">
                      {rollup.lowCount} variant
                      {rollup.lowCount > 1 ? "s" : ""} low
                    </span>
                  ) : (
                    `across ${variants.length} variants`
                  )
                ) : !product.usesStocks ? (
                  "not tracked"
                ) : flatLow ? (
                  <span className="text-amber-600 font-medium">
                    at or below {product.lowStock}
                  </span>
                ) : (
                  `low at ${product.lowStock ?? 0}`
                )
              }
            />
          </div>

          {/* Margin — one line, and only when there's a single price pair to
              compare. With variants it belongs per row, in the table below. */}
          {flatMargin !== null && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">
                Margin per unit
              </span>
              <span
                className={`flex items-center gap-1.5 text-[13px] font-semibold tabular-nums ${
                  flatMargin >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {flatMargin >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {fmt(flatMargin)}
                {flatMarginPct !== null && (
                  <span className="font-normal text-slate-400">
                    ({flatMarginPct}%)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Variants */}
          {hasVariants && rollup && (
            <Section
              title="Variants"
              note={
                rollup.unavailable > 0
                  ? `${rollup.unavailable} unavailable`
                  : `${variants.length} total`
              }
            >
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-[12px]">
                  {/* Sticks to the modal body's scroll container */}
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      <th className="px-3 py-2 text-left font-semibold">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Price
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Cost
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Margin
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((v) => {
                      const stock = v.inStock ?? 0;
                      const low =
                        (v.lowStock ?? 0) > 0 &&
                        stock <= (v.lowStock as number);
                      const m = marginOf(v.price, v.costPrice);
                      const unavailable = v.isAvailable === false;

                      return (
                        <tr
                          key={v.id}
                          className={unavailable ? "opacity-55" : undefined}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`h-3.5 w-1 rounded-full shrink-0 ${DOMAIN.variant.rail}`}
                                aria-hidden="true"
                              />
                              <span className="truncate font-medium capitalize text-slate-800">
                                {variantLabel(v)}
                              </span>
                              {unavailable && (
                                <Ban className="h-3 w-3 shrink-0 text-slate-400" />
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                            {fmt(v.price)}
                          </td>

                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                            {(v.costPrice ?? 0) > 0
                              ? fmt(v.costPrice as number)
                              : "—"}
                          </td>

                          <td
                            className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                              m === null
                                ? "text-slate-300"
                                : m >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {m === null ? "—" : fmt(m)}
                          </td>

                          <td className="px-3 py-2.5 text-right tabular-nums">
                            <span
                              className={
                                low
                                  ? "inline-flex items-center gap-1 font-medium text-amber-700"
                                  : "text-slate-600"
                              }
                            >
                              {low && <AlertTriangle className="h-3 w-3" />}
                              {stock.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Details */}
          <Section title="Details">
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              <MetaRow label="Category">
                {product.categories ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: categoryColor ?? "#e2e8f0" }}
                    />
                    {category?.name ?? "Uncategorised"}
                  </span>
                ) : (
                  <span className="text-slate-400">Not assigned</span>
                )}
              </MetaRow>

              <MetaRow label="Tax">
                <span
                  className={
                    product.isTaxable
                      ? "inline-flex items-center gap-1.5 font-medium text-emerald-700"
                      : "text-slate-400"
                  }
                >
                  <Percent className="h-3 w-3" />
                  {product.isTaxable ? "Taxable" : "Non-taxable"}
                </span>
              </MetaRow>

              <MetaRow label="Stock">
                <span
                  className={
                    product.usesStocks
                      ? "inline-flex items-center gap-1.5 font-medium text-blue-700"
                      : "text-slate-400"
                  }
                >
                  <Package className="h-3 w-3" />
                  {product.usesStocks ? "Tracked" : "Not tracked"}
                </span>
              </MetaRow>

              {hasVariants && (
                <MetaRow label="Structure">
                  <span className="inline-flex items-center gap-1.5 font-medium text-violet-700">
                    <Layers className="h-3 w-3" />
                    {variants.length} variant{variants.length > 1 ? "s" : ""}
                  </span>
                </MetaRow>
              )}

              {product.soldBy && (
                <MetaRow label="Sold by">
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Scale className="h-3 w-3 text-slate-400" />
                    {product.soldBy}
                  </span>
                </MetaRow>
              )}
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <footer className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
