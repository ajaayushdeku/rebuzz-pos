"use client";

import { useState, useMemo } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrency } from "@/utils/helper";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Percent,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";
import { Product } from "@/lib/types/product";
import ProductDetailModal from "./ProductDetailModal";
import ProductFormModal from "./ProductFormModal";
import { useDeleteProduct } from "@/hooks/useProducts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

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
  const pageSize = 10;

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
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(
        (a as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const bVal = String(
        (b as unknown as Record<string, unknown>)[sortConfig.key] ?? "",
      );
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" },
    );
  };

  return (
    <>
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
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
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
                  {sortConfig?.key === "name" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
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
                  {sortConfig?.key === "price" ? (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </span>
              </th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Tax</th>
              <th className="text-center pb-3 pt-3 px-4 font-medium">Stock</th>
              <th className="text-right pb-3 pt-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-gray-400"
                >
                  No products found
                </td>
              </tr>
            ) : (
              paged.map((product, idx) => (
                <tr
                  key={product.id}
                  onClick={() => handleRowClick(product)}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {product.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                      {product.description || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(product.price, currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {product.isTaxable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <Percent className="h-3 w-3" />
                        Taxable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
                        Non-taxable
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {!product.usesStocks ? (
                      <span className="text-xs text-gray-400">Not tracked</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {product.inStock ?? 0}
                        </span>
                        {product.lowStock !== undefined &&
                          product.lowStock > 0 && (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────── */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
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

      {/* ── Delete confirmation modal ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-lg">
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                &ldquo;{deleteTarget?.name}&rdquo;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg text-white bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
