"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Minus,
  Plus,
  Loader2,
  SaveAll,
  Layers,
  X,
  ChevronDown,
} from "lucide-react";

import { InventoryItem } from "@/services/apiInventory";
import {
  updateProduct,
  bulkUpdateStock,
  BulkStockUpdateItem,
} from "@/services/product/apiProduct.client";
import { useInvalidateInventory } from "@/hooks/useInventory";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
};

type EditItem = {
  inStock: number;
  lowStock: number;
};

type EditVariant = {
  inStock: number;
  lowStock: number;
};

type ChangedEntry = {
  id: string;
  name: string;
  type: "product" | "variant";
  variantLabel?: string;
  oldInStock: number;
  newInStock: number;
  oldLowStock: number;
  newLowStock: number;
};

export default function ProductStockEditModal({
  open,
  onOpenChange,
  items,
}: Props) {
  const invalidateInventory = useInvalidateInventory();
  const [search, setSearch] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isChangedExpanded, setIsChangedExpanded] = useState(true);

  // Track whether edits have been initialized for the current modal session
  const initializedForOpen = useRef(false);

  // simplified local state
  const [edits, setEdits] = useState<Record<string, EditItem>>({});
  const [variantEdits, setVariantEdits] = useState<Record<string, EditVariant>>(
    {},
  );

  useEffect(() => setMounted(true), []);

  // Initialize local edits ONLY when modal opens, not when items change
  useEffect(() => {
    if (open && !initializedForOpen.current) {
      const initial: Record<string, EditItem> = {};
      const initialVariants: Record<string, EditVariant> = {};
      for (const item of items) {
        initial[item.id] = {
          inStock: item.inStock,
          lowStock: item.lowStock,
        };
        // Initialize variant edits
        for (const variant of item.variants ?? []) {
          initialVariants[variant.id] = {
            inStock: variant.inStock,
            lowStock: variant.lowStock,
          };
        }
      }
      setEdits(initial);
      setVariantEdits(initialVariants);
      initializedForOpen.current = true;
    }
    if (!open) {
      initializedForOpen.current = false;
    }
  }, [open, items]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;

    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  // update helper
  const updateField = (
    id: string,
    field: "inStock" | "lowStock",
    value: number,
  ) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: Math.max(0, value),
      },
    }));
  };

  // update variant helper
  const updateVariantField = (
    variantId: string,
    field: "inStock" | "lowStock",
    value: number,
  ) => {
    setVariantEdits((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: Math.max(0, value),
      },
    }));
  };

  // Check if an item has changed
  const hasChanged = (item: InventoryItem) => {
    const edit = edits[item.id];
    if (!edit) return false;
    if (edit.inStock !== item.inStock || edit.lowStock !== item.lowStock)
      return true;

    // Check variants
    for (const variant of item.variants ?? []) {
      const vEdit = variantEdits[variant.id];
      if (!vEdit) continue;
      if (
        vEdit.inStock !== variant.inStock ||
        vEdit.lowStock !== variant.lowStock
      )
        return true;
    }
    return false;
  };

  // Count of changed items
  const changedCount = useMemo(() => {
    return items.filter(hasChanged).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, variantEdits, items]);

  // Build a detailed list of all changed entries (products + variants)
  const changedEntries = useMemo<ChangedEntry[]>(() => {
    const entries: ChangedEntry[] = [];

    for (const item of items) {
      const edit = edits[item.id];
      if (!edit) continue;

      // Product-level change
      if (edit.inStock !== item.inStock || edit.lowStock !== item.lowStock) {
        entries.push({
          id: item.id,
          name: item.name,
          type: "product",
          oldInStock: item.inStock,
          newInStock: edit.inStock,
          oldLowStock: item.lowStock,
          newLowStock: edit.lowStock,
        });
      }

      // Variant-level changes
      for (const variant of item.variants ?? []) {
        const vEdit = variantEdits[variant.id];
        if (!vEdit) continue;
        if (
          vEdit.inStock !== variant.inStock ||
          vEdit.lowStock !== variant.lowStock
        ) {
          entries.push({
            id: variant.id,
            name: item.name,
            type: "variant",
            variantLabel: variant.optionValues.join(" · "),
            oldInStock: variant.inStock,
            newInStock: vEdit.inStock,
            oldLowStock: variant.lowStock,
            newLowStock: vEdit.lowStock,
          });
        }
      }
    }

    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, variantEdits, items]);

  const handleBulkSave = async () => {
    try {
      setBulkSaving(true);

      const changedItems = items.filter(hasChanged);

      if (changedItems.length === 0) return;

      // First, enable usesStocks for items that don't have it
      const needsStocksEnabled = changedItems.filter(
        (item) => !item.usesStocks,
      );
      for (const item of needsStocksEnabled) {
        await updateProduct(item.id, { usesStocks: true });
      }

      // ── Build stockUpdates payload matching the backend contract ──────────
      const stockUpdates: BulkStockUpdateItem[] = [];

      for (const item of changedItems) {
        // Product-level stock update (only if the product itself changed)
        const edit = edits[item.id];
        if (
          edit &&
          (edit.inStock !== item.inStock || edit.lowStock !== item.lowStock)
        ) {
          stockUpdates.push({
            id: item.id,
            inStock: Number(edit.inStock),
            lowStock: Number(edit.lowStock),
          });
        }

        // Variant-level stock updates
        for (const variant of item.variants ?? []) {
          const vEdit = variantEdits[variant.id];
          if (!vEdit) continue;
          if (
            vEdit.inStock !== variant.inStock ||
            vEdit.lowStock !== variant.lowStock
          ) {
            stockUpdates.push({
              isVariant: true,
              variantId: variant.id,
              inStock: Number(vEdit.inStock),
              lowStock: Number(vEdit.lowStock),
            });
          }
        }
      }

      const result = await bulkUpdateStock(stockUpdates);

      // ── Surface partial failures to the user ──────────────────────────────
      if (result.notFoundCount > 0) {
        console.warn(
          `${result.notFoundCount} item(s) not found:`,
          result.notFound,
        );
        toast.error(
          `${result.totalItemsUpdated} updated, ${result.notFoundCount} not found`,
        );
      } else {
        toast.success(`${result.totalItemsUpdated} item(s) updated`);
      }

      // Sync all changed items' edits to their saved values
      setEdits((prev) => {
        const updated = { ...prev };
        for (const item of changedItems) {
          updated[item.id] = {
            inStock: edits[item.id].inStock,
            lowStock: edits[item.id].lowStock,
          };
        }
        return updated;
      });

      // Sync all changed variants' edits to their saved values
      setVariantEdits((prev) => {
        const updated = { ...prev };
        for (const item of changedItems) {
          for (const variant of item.variants ?? []) {
            const vEdit = variantEdits[variant.id];
            if (vEdit) {
              updated[variant.id] = {
                inStock: vEdit.inStock,
                lowStock: vEdit.lowStock,
              };
            }
          }
        }
        return updated;
      });

      invalidateInventory();
    } catch (err) {
      console.error("Bulk save error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const handleClose = () => {
    setSearch("");
    onOpenChange(false);
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 "
      onClick={() => !bulkSaving && handleClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-editor-title"
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2
              id="stock-editor-title"
              className="text-lg font-bold text-slate-800"
            >
              Product Stock Editor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust stock levels and low-stock thresholds.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={bulkSaving}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 px-6 pt-5">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 pl-9 pr-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_80px] items-center gap-3 px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">
            <span>Product</span>
            <span className="text-left">In Stock</span>
            <span className="text-left">Low Stock</span>
          </div>

          {/* List with bottom padding for collapsed bar */}
          <div className="relative min-h-[150px] max-h-[200px] overflow-y-auto -mr-1 pr-1">
            <div className="space-y-1.5 divide-y divide-slate-50">
              {filteredItems.map((item) => {
                const edit = edits[item.id];

                if (!edit) return null;

                const changed = hasChanged(item);
                const hasVariants = (item.variants?.length ?? 0) > 0;

                return (
                  <div key={item.id}>
                    {/* Parent product row */}
                    <div
                      className={`grid grid-cols-[1fr_120px_80px] items-center gap-3 px-3 py-3 transition-colors ${
                        changed ? "bg-blue-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Product */}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {item.unit}
                          {hasVariants && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-violet-500">
                              <Layers size={10} />
                              {item.variants?.length} variants
                            </span>
                          )}
                        </p>
                      </div>

                      {/* In Stock */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            updateField(item.id, "inStock", edit.inStock - 1)
                          }
                          disabled={hasVariants}
                          className="h-6 w-6 rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Minus size={13} />
                        </button>

                        <input
                          type="number"
                          value={edit.inStock}
                          disabled={hasVariants}
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "inStock",
                              Number(e.target.value),
                            )
                          }
                          className="w-20 h-6 border border-slate-200 rounded-md text-right text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />

                        <button
                          onClick={() =>
                            updateField(item.id, "inStock", edit.inStock + 1)
                          }
                          disabled={hasVariants}
                          className="h-6 w-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Low Stock */}
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={edit.lowStock}
                          disabled={hasVariants}
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "lowStock",
                              Number(e.target.value),
                            )
                          }
                          className="w-14 h-7 border border-slate-200 rounded-md text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Variant rows */}
                    {hasVariants && (
                      <div className=" border-t border-slate-50">
                        {item.variants?.map((variant) => {
                          const vEdit = variantEdits[variant.id];
                          if (!vEdit) return null;

                          const vChanged =
                            vEdit.inStock !== variant.inStock ||
                            vEdit.lowStock !== variant.lowStock;

                          return (
                            <div
                              key={variant.id}
                              className={`grid grid-cols-[1fr_120px_80px] items-center gap-3 px-3 py-2.5 pl-8 transition-colors ${
                                vChanged ? "bg-blue-50/50" : ""
                              }`}
                            >
                              {/* Variant name */}
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700 truncate flex items-center gap-1.5">
                                  <Layers
                                    size={11}
                                    className="text-violet-400 shrink-0"
                                  />
                                  <span className="capitalize">
                                    {variant.optionValues.join(" · ")}
                                  </span>
                                </p>
                              </div>

                              {/* In Stock */}
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    updateVariantField(
                                      variant.id,
                                      "inStock",
                                      vEdit.inStock - 1,
                                    )
                                  }
                                  className="h-6 w-6 rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Minus size={13} />
                                </button>

                                <input
                                  type="number"
                                  value={vEdit.inStock}
                                  onChange={(e) =>
                                    updateVariantField(
                                      variant.id,
                                      "inStock",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 h-6  border border-slate-200 rounded-md text-right text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />

                                <button
                                  onClick={() =>
                                    updateVariantField(
                                      variant.id,
                                      "inStock",
                                      vEdit.inStock + 1,
                                    )
                                  }
                                  className="h-6 w-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              {/* Low Stock */}
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  value={vEdit.lowStock}
                                  onChange={(e) =>
                                    updateVariantField(
                                      variant.id,
                                      "lowStock",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-14 h-6 border border-slate-200 rounded-md text-right text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Overlapping Changed Items Panel ── */}
            {changedEntries.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0">
                {/* Collapsed bar - always visible */}
                <button
                  type="button"
                  onClick={() => setIsChangedExpanded(!isChangedExpanded)}
                  className="w-full flex flex-col items-center gap-0.5 border-t border-slate-200 bg-white/95 backdrop-blur px-6 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
                      isChangedExpanded ? "" : "rotate-180"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.1em]">
                    {changedEntries.length} change
                    {changedEntries.length > 1 ? "s" : ""}
                  </span>
                </button>

                {/* Expanded panel - slides up over the body */}
                <div
                  className={`absolute bottom-full left-0 right-0 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-300 ease-in-out ${
                    isChangedExpanded
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="px-6 py-3">
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {changedEntries.map((entry) => (
                        <div
                          key={`${entry.type}-${entry.id}`}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 ${
                            entry.type === "variant"
                              ? "border-violet-100 bg-violet-50/50"
                              : "border-blue-100 bg-blue-50/50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 truncate">
                              {entry.name}
                              {entry.type === "variant" &&
                                entry.variantLabel && (
                                  <span className="ml-1.5 text-xs font-normal text-violet-600 capitalize">
                                    · {entry.variantLabel}
                                  </span>
                                )}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {entry.type === "variant" ? "Variant" : "Product"}
                            </p>
                          </div>

                          <div className="text-right shrink-0 space-y-0.5">
                            <p className="text-[11px] text-slate-500">
                              <span className="text-slate-400">In:</span>{" "}
                              <span className="line-through text-slate-400">
                                {entry.oldInStock}
                              </span>{" "}
                              →{" "}
                              <span className="font-semibold text-blue-600">
                                {entry.newInStock}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              <span className="text-slate-400">Low:</span>{" "}
                              <span className="line-through text-slate-400">
                                {entry.oldLowStock}
                              </span>{" "}
                              →{" "}
                              <span className="font-semibold text-blue-600">
                                {entry.newLowStock}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={bulkSaving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleBulkSave}
            disabled={bulkSaving || changedCount === 0}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {bulkSaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <SaveAll size={13} />
            )}
            Save All ({changedCount})
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
