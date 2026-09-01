"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Percent,
  Package,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CornerDownRight,
} from "lucide-react";
import { Product } from "@/lib/types/product";
import ProductDetailModal from "./ProductDetailModal";
import ProductFormModal from "./ProductFormModal";
import DeleteProductModal from "./DeleteProductModal";
import LoadingState from "@/components/ui/LoadingState";
import { useDeleteProduct } from "@/hooks/useProducts";
import toast from "react-hot-toast";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const COLUMN_COUNT = 7;

export default function ProductTable({
  products,
  isLoading = false,
}: {
  products: Product[];
  isLoading?: boolean;
}) {
  const { currency } = useCurrency();
  const deleteMutation = useDeleteProduct();
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(0);
  /** Product ids whose variant rows are showing. */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const handleRowClick = (product: Product) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`Product "${deleteTarget.name}" deleted`);
        setDeleteTarget(null);
      },
    });
  };

  const toggleExpanded = (productId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // ── Search & sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;

    // Match on variant option values too, so searching "cherry" finds the
    // parent that owns that variant rather than nothing.
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.variants ?? []).some((v) =>
          v.optionValues.join(" ").toLowerCase().includes(q),
        ),
    );
  }, [products, search]);

  // One row per product. Variants are nested under their parent rather than
  // living in a separate tab, so this is the only list the table pages over.
  const sortedProducts = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "price") return dir * (a.price - b.price);
      const cmp = String(a.name).localeCompare(String(b.name), undefined, {
        numeric: true,
      });
      return dir * cmp;
    });
  }, [filtered, sortConfig]);

  const rowCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  // Clamp rather than reset: a search can leave `page` past the end, which
  // would render an empty table with no way back.
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const pagedProducts = sortedProducts.slice(start, start + pageSize);

  const totalVariants = useMemo(
    () => sortedProducts.reduce((n, p) => n + (p.variants?.length ?? 0), 0),
    [sortedProducts],
  );

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sortConfig?.key === colKey ? (
      sortConfig.direction === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )
    ) : (
      <ArrowUpDown className="h-3 w-3 opacity-30" />
    );

  /** A parent with variants carries price on the variants, so show the span. */
  const priceLabel = (product: Product) => {
    const variants = product.variants ?? [];
    if (variants.length === 0) return fmt(product.price);

    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  };

  /** Likewise stock: the base row reads 0, the variants hold the real counts. */
  const stockOf = (product: Product) => {
    const variants = product.variants ?? [];
    if (variants.length === 0) return product.inStock ?? 0;
    return variants.reduce((sum, v) => sum + (v.inStock ?? 0), 0);
  };

  const TaxBadge = ({ taxable }: { taxable: boolean }) =>
    taxable ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <Percent className="h-3 w-3" />
        Taxable
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
        Non-taxable
      </span>
    );

  const isEmpty = pagedProducts.length === 0;

  return (
    <>
      {/* ── Search ───────────────────────────────────────── */}
      <div className="relative mb-4 mt-6">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search products or variants..."
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="bg-white overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-3 pt-3 px-4 font-medium w-12">
                S.No
              </th>
              <th
                className="text-left pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Product
                  <SortIcon colKey="name" />
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                Description
              </th>
              <th
                className="text-right pb-3 pt-3 px-4 font-medium cursor-pointer select-none hover:text-gray-600"
                onClick={() => toggleSort("price")}
              >
                <span className="flex items-center justify-end gap-1">
                  Price
                  <SortIcon colKey="price" />
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Tax</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Stock</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading lives in the tbody so the header row and the toolbar
                above stay visible, matching the settings tables. */}
            {isLoading ? (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <LoadingState message="Loading products..." />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Package size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No products found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Products you add will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedProducts.map((product, idx) => {
                const variants = product.variants ?? [];
                const variantCount = variants.length;
                const isExpanded = expandedIds.has(product.id);

                return [
                  // ── Parent row ──────────────────────────────────────────
                  <tr
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                      isExpanded ? "bg-blue-50/40" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {start + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2">
                        {/* Expander sits in the name cell rather than taking a
                            column of its own, so the header stays unchanged. */}
                        {variantCount > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(product.id);
                            }}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Hide variants of ${product.name}`
                                : `Show variants of ${product.name}`
                            }
                            className="shrink-0 rounded-md p-0.5 text-gray-400 transition-colors hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          // Keeps names aligned down the column whether or not
                          // a product has variants.
                          <span className="w-[1.125rem] shrink-0" />
                        )}

                        <span className="font-medium text-xs text-gray-900">
                          {product.name}
                        </span>
                        {variantCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                            {variantCount} variant
                            {variantCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                        {product.description || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-right font-semibold text-gray-900 tabular-nums">
                      {priceLabel(product)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <TaxBadge taxable={product.isTaxable} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!product.usesStocks ? (
                        <span className="text-xs text-gray-400">
                          Not tracked
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-sm font-medium tabular-nums text-gray-700">
                            {stockOf(product)}
                          </span>
                          {product.lowStock !== undefined &&
                            product.lowStock > 0 &&
                            variantCount === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                                Low: {product.lowStock}
                              </span>
                            )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>,

                  // ── Variant rows, only while expanded ───────────────────
                  ...(isExpanded
                    ? variants.map((variant) => (
                        <tr
                          key={`${product.id}-${variant.id}`}
                          onClick={() => handleRowClick(product)}
                          className="cursor-pointer border-b border-gray-50 bg-gray-50/50 transition-colors last:border-0 hover:bg-gray-100/70"
                        >
                          <td className="py-2.5 px-4" />
                          <td className="py-2.5 px-4">
                            <span className="flex items-center gap-1.5 pl-6">
                              <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                              <span className="text-xs font-medium capitalize text-gray-800">
                                {variant.optionValues.length > 0
                                  ? variant.optionValues.join(" · ")
                                  : "Default"}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="block max-w-[200px] truncate text-xs text-gray-400">
                              Variant of {product.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-xs font-semibold tabular-nums text-gray-700">
                            {fmt(variant.price)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {/* Tax status is inherited from the parent product */}
                            <TaxBadge taxable={product.isTaxable} />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {!product.usesStocks ? (
                              <span className="text-xs text-gray-400">
                                Not tracked
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-blue-400" />
                                <span className="text-sm font-medium tabular-nums text-gray-600">
                                  {variant.inStock ?? 0}
                                </span>
                                {variant.lowStock !== undefined &&
                                  variant.lowStock > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-200">
                                      Low: {variant.lowStock}
                                    </span>
                                  )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Variants are edited through their parent;
                                  deleting is intentionally absent so a whole
                                  product can't be removed from a variant row. */}
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title={`Edit ${product.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : []),
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button
          onClick={() => setPage(Math.max(0, safePage - 1))}
          disabled={safePage === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            safePage === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium tabular-nums">
          Page {safePage + 1} of {totalPages} · {rowCount} product
          {rowCount === 1 ? "" : "s"}
          {totalVariants > 0 && `, ${totalVariants} variants`}
        </span>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
          disabled={safePage >= totalPages - 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            safePage >= totalPages - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>

      <ProductDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailProduct(null);
        }}
        product={detailProduct}
      />

      <ProductFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />

      <DeleteProductModal
        product={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        deleting={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
