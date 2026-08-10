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
  PackageSearch,
  Undo2,
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

/** Height of the collapsed changed-items handle. List padding must clear it. */
const HANDLE_HEIGHT = 48;

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

  // Stop the page behind the overlay from scrolling with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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

  /** Revert one entry to its saved values, through the existing setters. */
  const revertEntry = (entry: ChangedEntry) => {
    if (entry.type === "variant") {
      updateVariantField(entry.id, "inStock", entry.oldInStock);
      updateVariantField(entry.id, "lowStock", entry.oldLowStock);
    } else {
      updateField(entry.id, "inStock", entry.oldInStock);
      updateField(entry.id, "lowStock", entry.oldLowStock);
    }
  };

  /** Stepper + threshold pair, used for both products and variants. */
  const StockControls = ({
    inStock,
    lowStock,
    onChange,
  }: {
    inStock: number;
    lowStock: number;
    onChange: (field: "inStock" | "lowStock", value: number) => void;
  }) => (
    <div className="flex shrink-0 items-end gap-3">
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-blue-700">
          In stock
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onChange("inStock", inStock - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-l-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Decrease stock"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={0}
            value={inStock}
            onChange={(e) => onChange("inStock", Number(e.target.value))}
            className="h-8 w-20 border-y border-slate-200 px-2 text-center text-[13px] tabular-nums text-slate-800 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => onChange("inStock", inStock + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-r-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Increase stock"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-blue-700">
          Low at
        </label>
        <input
          type="number"
          min={0}
          value={lowStock}
          onChange={(e) => onChange("lowStock", Number(e.target.value))}
          className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-[13px] tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 "
      onClick={() => !bulkSaving && handleClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-edit-title"
        className="relative flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2
              id="stock-edit-title"
              className="text-lg font-bold text-slate-800"
            >
              Edit stock
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust stock levels across products and variants, then save them
              together.
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

        {/* ── Search ── */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-10 pr-9 text-[13px] text-slate-800 placeholder:text-slate-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div
            className="w-full overflow-y-auto px-6 py-4"
            style={{
              paddingBottom:
                changedEntries.length > 0 ? HANDLE_HEIGHT + 16 : 16,
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <PackageSearch className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-600">
                  No products found
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Try a different search term.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const edit = edits[item.id];
                  if (!edit) return null;

                  const variants = item.variants ?? [];
                  const hasVariants = variants.length > 0;
                  const productChanged =
                    edit.inStock !== item.inStock ||
                    edit.lowStock !== item.lowStock;

                  // Check if all variants are changed
                  const allVariantsChanged =
                    hasVariants &&
                    variants.every((variant) => {
                      const vEdit = variantEdits[variant.id];
                      if (!vEdit) return false;
                      return (
                        vEdit.inStock !== variant.inStock ||
                        vEdit.lowStock !== variant.lowStock
                      );
                    });

                  // If all variants changed, highlight the entire product section
                  const sectionChanged = productChanged || allVariantsChanged;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition ${
                        sectionChanged
                          ? "border-blue-300 bg-blue-50/40"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                              {item.name}
                            </p>
                            {hasVariants && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                <Layers className="h-2.5 w-2.5" />
                                {variants.length}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                            {item.unit}
                            {!item.usesStocks && (
                              <span className="ml-1.5 normal-case text-amber-600">
                                · not tracked, saving turns tracking on
                              </span>
                            )}
                          </p>
                        </div>

                        {/* A product with variants holds no stock of its own. */}
                        {!hasVariants && (
                          <StockControls
                            inStock={edit.inStock}
                            lowStock={edit.lowStock}
                            onChange={(field, value) =>
                              updateField(item.id, field, value)
                            }
                          />
                        )}
                      </div>

                      {hasVariants && (
                        <div className="divide-y divide-slate-100 border-t border-slate-100">
                          {variants.map((variant) => {
                            const vEdit = variantEdits[variant.id];
                            if (!vEdit) return null;

                            const vChanged =
                              vEdit.inStock !== variant.inStock ||
                              vEdit.lowStock !== variant.lowStock;

                            return (
                              <div
                                key={variant.id}
                                className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
                                  vChanged ? "bg-blue-50/40" : ""
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className="h-3.5 w-1 shrink-0 rounded-full bg-blue-500"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate text-[13px] capitalize text-slate-700">
                                    {variant.optionValues.join(" · ")}
                                  </span>
                                </div>
                                <StockControls
                                  inStock={vEdit.inStock}
                                  lowStock={vEdit.lowStock}
                                  onChange={(field, value) =>
                                    updateVariantField(variant.id, field, value)
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Changed items ── */}
          <div
            className={`absolute inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              changedEntries.length === 0
                ? "translate-y-full"
                : isChangedExpanded
                  ? "translate-y-0"
                  : "translate-y-[calc(100%-48px)]"
            }`}
            aria-hidden={changedEntries.length === 0}
          >
            <div className=" border-t border-slate-200 bg-white ">
              <button
                type="button"
                onClick={() => setIsChangedExpanded((v) => !v)}
                aria-expanded={isChangedExpanded}
                aria-controls="changed-items-list"
                className="relative flex h-10 w-full items-center px-4 bg-slate-50 transition-colors hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold tabular-nums text-white">
                    {changedEntries.length}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700">
                    {changedEntries.length === 1 ? "Change" : "Changes"}
                    {changedCount > 0 && (
                      <span className="font-normal text-[10px]text-slate-400">
                        {" "}
                        across {changedCount}{" "}
                        {changedCount === 1 ? "product" : "products"}
                      </span>
                    )}
                  </span>
                </span>

                <ChevronDown
                  className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                    isChangedExpanded ? "rotate-0" : "rotate-180"
                  }`}
                />

                <span className="ml-auto text-[11px] font-medium text-slate-400">
                  {isChangedExpanded ? "Hide" : "Review"}
                </span>
              </button>

              <div
                id="changed-items-list"
                className="max-h-52 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100"
              >
                {changedEntries.map((entry) => (
                  <div
                    key={`${entry.type}-${entry.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-800">
                        {entry.name}
                        {entry.variantLabel && (
                          <span className="font-normal capitalize text-slate-400">
                            {" · "}
                            {entry.variantLabel}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                        {entry.oldInStock !== entry.newInStock && (
                          <>
                            stock {entry.oldInStock}
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="font-semibold text-blue-600">
                              {entry.newInStock}
                            </span>
                          </>
                        )}
                        {entry.oldInStock !== entry.newInStock &&
                          entry.oldLowStock !== entry.newLowStock && (
                            <span className="mx-1.5 text-slate-200">|</span>
                          )}
                        {entry.oldLowStock !== entry.newLowStock && (
                          <>
                            low {entry.oldLowStock}
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="font-semibold text-blue-600">
                              {entry.newLowStock}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => revertEntry(entry)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Revert this change"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <span className="text-[12px] text-slate-400">
            {changedEntries.length === 0
              ? "No changes yet"
              : `${changedEntries.length} change${changedEntries.length > 1 ? "s" : ""} ready to save`}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={bulkSaving}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkSave}
              disabled={bulkSaving || changedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SaveAll className="h-3.5 w-3.5" />
              )}
              {bulkSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
