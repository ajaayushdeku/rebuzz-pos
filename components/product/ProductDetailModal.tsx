"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Package,
  Scale,
  Percent,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Product } from "@/lib/types/product";
import { useCurrency } from "@/providers/CurrencyContext";
import { useCategories } from "@/hooks/useCategories";
import { normalizeColor } from "@/services/category.client";
import { formatCurrencySymbol } from "@/utils/helper";
import SettingsModalShell from "@/components/settingsComponents/SettingsModalShell";

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

/** A titled section wrapper. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
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

  // Resolve the category id stored on the product to its name + colour.
  const category = useMemo(
    () => categories.find((c) => c._id === product?.categories),
    [categories, product?.categories],
  );

  if (!product) return null;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const margin =
    product.costPrice !== undefined && product.costPrice > 0
      ? product.price - product.costPrice
      : null;

  const categoryColor = category ? normalizeColor(category.color) : null;
  const isLowStock =
    product.usesStocks &&
    product.lowStock !== undefined &&
    product.lowStock > 0 &&
    (product.inStock ?? 0) <= product.lowStock;

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={product.name}
      description={product.description || "Product details"}
    >
      <div className="space-y-5">
        {/* ── Pricing ── */}
        <Section title="Pricing">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-1">
                <DollarSign className="h-3 w-3" />
                Selling Price
              </div>
              <p className="text-lg font-bold text-gray-900">
                {fmt(product.price)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-1">
                <DollarSign className="h-3 w-3" />
                Cost Price
              </div>
              <p className="text-lg font-bold text-gray-900">
                {product.costPrice !== undefined && product.costPrice > 0
                  ? fmt(product.costPrice)
                  : "—"}
              </p>
            </div>
          </div>

          {margin !== null && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <span className="text-xs font-medium text-emerald-700">
                Margin per unit
              </span>
              <span
                className={`text-sm font-bold ${
                  margin >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {fmt(margin)}
              </span>
            </div>
          )}
        </Section>

        {/* ── Category ── */}
        <Section title="Category">
          {product.categories && product.categories !== "" ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <span
                className="h-6 w-6 rounded-lg border border-gray-200 shrink-0"
                style={{ backgroundColor: categoryColor ?? "#e5e7eb" }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {category?.name ?? "Uncategorised"}
                </p>
                {categoryColor && (
                  <p className="text-[11px] text-gray-400 font-mono">
                    {categoryColor}
                  </p>
                )}
              </div>
              <Tag className="h-4 w-4 text-gray-300 ml-auto shrink-0" />
            </div>
          ) : (
            <p className="text-sm text-gray-400">No category assigned</p>
          )}
        </Section>

        {/* ── Inventory ── */}
        <Section title="Inventory">
          {product.usesStocks ? (
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-3 ${
                  isLowStock
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-gray-200 bg-gradient-to-b from-white to-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-1">
                  <Package className="h-3 w-3" />
                  In Stock
                </div>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  {(product.inStock ?? 0).toLocaleString()}
                  {isLowStock && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low Stock Threshold
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {product.lowStock !== undefined && product.lowStock > 0
                    ? product.lowStock.toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Stock is not tracked</p>
          )}
        </Section>

        {/* ── Attributes ── */}
        <Section title="Attributes">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                product.isTaxable
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              <Percent className="h-3 w-3" />
              {product.isTaxable ? "Taxable" : "Non-taxable"}
            </span>

            {product.soldBy && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200 capitalize">
                <Scale className="h-3 w-3" />
                Sold by {product.soldBy}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                product.usesStocks
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              <Package className="h-3 w-3" />
              {product.usesStocks ? "Tracks stock" : "No stock tracking"}
            </span>
          </div>
        </Section>
      </div>
    </SettingsModalShell>
  );
}
