"use client";

import { useMemo, useRef, useState } from "react";
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
import { Product, ProductVariant } from "@/lib/types/product";
import ProductDetailModal from "./ProductDetailModal";
import ProductFormModal from "./ProductFormModal";
import DeleteProductModal from "./DeleteProductModal";
import { useDeleteProduct } from "@/hooks/useProducts";
import toast from "react-hot-toast";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;
type TabKey = "products" | "variants";
type VariantRow = { product: Product; variant: ProductVariant };

export default function ProductTable({ products }: { products: Product[] }) {
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
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
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

  // ── Search & sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  // Products tab: every parent product, exactly one row each — including those
  // that have variants.
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

  // Variants tab: one row per variant, flattened across products.
  const sortedVariants = useMemo(() => {
    const rows: VariantRow[] = [];
    for (const product of filtered) {
      for (const variant of product.variants ?? []) {
        rows.push({ product, variant });
      }
    }

    if (!sortConfig) return rows;

    return rows.sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "price")
        return dir * (a.variant.price - b.variant.price);

      const label = (r: VariantRow) =>
        `${r.product.name} ${r.variant.optionValues.join(" ")}`;
      return (
        dir * label(a).localeCompare(label(b), undefined, { numeric: true })
      );
    });
  }, [filtered, sortConfig]);

  // No product has variants → there's nothing for the second tab to show, so
  // the switcher is hidden entirely and the product list stands alone.
  const hasVariants = sortedVariants.length > 0;
  const currentTab: TabKey = hasVariants ? activeTab : "products";

  const rowCount =
    currentTab === "products" ? sortedProducts.length : sortedVariants.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  // Clamp rather than reset: a search or tab change can leave `page` past the
  // end, which would render an empty table with no way back.
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;

  const pagedProducts =
    currentTab === "products"
      ? sortedProducts.slice(start, start + pageSize)
      : [];
  const pagedVariants =
    currentTab === "variants"
      ? sortedVariants.slice(start, start + pageSize)
      : [];

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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <Percent className="h-3 w-3" />
        Taxable
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
        Non-taxable
      </span>
    );

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "products", label: "Products", count: sortedProducts.length },
    { key: "variants", label: "Variants", count: sortedVariants.length },
  ];

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    setPage(0);
  };

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === currentTab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    selectTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const isEmpty =
    currentTab === "products"
      ? pagedProducts.length === 0
      : pagedVariants.length === 0;

  return (
    <>
      {/* ── Tabs — hidden when nothing has variants ───────── */}
      {hasVariants && (
        <div className="relative flex justify-center mb-8 mt-6">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
          />
          <div
            role="tablist"
            aria-label="Product view"
            onKeyDown={handleTabKeyDown}
            className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
          >
            {tabs.map((tab, i) => {
              const selected = tab.key === currentTab;

              return (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`product-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls="product-table-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(tab.key)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                    selected
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950"
                  }`}
                >
                  {tab.label}
                  <span
                    className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 
                     bg-[#e4f2fe] text-blue-950 ring-blue-900"
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────── */}
      <div className="relative mb-4">
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
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <style>{`.scrollbar-hide {-ms-overflow-style: none; scrollbar-width: none;} .scrollbar-hide::-webkit-scrollbar {display: none;}`}</style>
      <div
        id="product-table-panel"
        role={hasVariants ? "tabpanel" : undefined}
        aria-labelledby={hasVariants ? `product-tab-${currentTab}` : undefined}
        className="bg-white overflow-x-auto scrollbar-hide"
      >
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
                  {currentTab === "products" ? "Product" : "Variant"}
                  <SortIcon colKey="name" />
                </span>
              </th>
              <th className="text-left pb-3 pt-3 px-4 font-medium">
                {currentTab === "products" ? "Description" : "Parent product"}
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
            {isEmpty ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-2 text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Package size={24} className="text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No {currentTab === "products" ? "products" : "variants"}{" "}
                      found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentTab === "products"
                        ? "Products you add will appear here."
                        : "Variants of your products will appear here."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : currentTab === "products" ? (
              // ── Parent products — one row each, variants folded in ──
              pagedProducts.map((product, idx) => {
                const variantCount = product.variants?.length ?? 0;

                return (
                  <tr
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {start + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2">
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
                    <td className="py-3 px-4 text-xs text-right font-semibold text-gray-900">
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
                          <span className="text-sm font-medium text-gray-700">
                            {stockOf(product)}
                          </span>
                          {product.lowStock !== undefined &&
                            product.lowStock > 0 &&
                            variantCount === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
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
                  </tr>
                );
              })
            ) : (
              // ── Variants — one row each, parent shown alongside ──
              pagedVariants.map(({ product, variant }, idx) => (
                <tr
                  key={variant.id}
                  onClick={() => handleRowClick(product)}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2.5 px-4 text-gray-400 text-xs">
                    {start + idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="flex items-center gap-1.5">
                      <CornerDownRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      <span className="text-xs font-medium text-gray-800 capitalize">
                        {variant.optionValues.length > 0
                          ? variant.optionValues.join(" · ")
                          : "Default"}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                      {product.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-right font-semibold text-gray-700">
                    {fmt(variant.price)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {/* Tax status is inherited from the parent product */}
                    <TaxBadge taxable={product.isTaxable} />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-sm font-medium text-gray-600">
                        {variant.inStock ?? 0}
                      </span>
                      {variant.lowStock !== undefined &&
                        variant.lowStock > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            Low: {variant.lowStock}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Variants are edited through their parent; deleting is
                          intentionally absent so a whole product can't be
                          removed from a variant row. */}
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

        <span className="text-xs text-gray-400 font-medium">
          Page {safePage + 1} of {totalPages} · {rowCount}{" "}
          {currentTab === "products" ? "products" : "variants"}
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
