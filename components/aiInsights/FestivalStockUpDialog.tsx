"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Plus,
  Boxes,
} from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import type { Product } from "@/lib/types/product";
import type { FestivalPrep } from "@/lib/ai-insights/sections/festivalPrep";
import {
  bulkUpdateStock,
  type BulkStockUpdateItem,
} from "@/services/product/apiProduct.client";

interface FestivalStockUpDialogProps {
  festival: FestivalPrep;
  products: Product[];
  productsLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StockRow {
  key: string;
  productName: string;
  variantName?: string;
  currentStock: number;
  lowStock: number;
  isVariant: boolean;
  productId?: string;
  variantId?: string;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getVariantName(optionValues: string[]): string {
  return optionValues.join(" · ") || "Unnamed variant";
}

export default function FestivalStockUpDialog({
  festival,
  products,
  productsLoading,
  open,
  onOpenChange,
}: FestivalStockUpDialogProps) {
  const queryClient = useQueryClient();

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const stockRows = useMemo(() => {
    const rows: StockRow[] = [];
    const unmatched: string[] = [];
    const notTracked: string[] = [];

    // Avoid processing duplicate AI recommendations.
    const recommendations = Array.from(
      new Map(
        festival.stockUp.map((name) => [normalizeName(name), name.trim()]),
      ).values(),
    );

    for (const recommendedName of recommendations) {
      const product = products.find(
        (candidate) =>
          normalizeName(candidate.name) === normalizeName(recommendedName),
      );

      if (!product) {
        unmatched.push(recommendedName);
        continue;
      }

      if (!product.usesStocks) {
        notTracked.push(product.name);
        continue;
      }

      // Variant products must be updated through their individual variants.
      if (product.variants && product.variants.length > 0) {
        const availableVariants = product.variants.filter(
          (variant) => variant.isAvailable !== false,
        );

        if (availableVariants.length === 0) {
          notTracked.push(`${product.name} (no available variants)`);
          continue;
        }

        for (const variant of availableVariants) {
          rows.push({
            key: `variant-${variant.id}`,
            productName: product.name,
            variantName: getVariantName(variant.optionValues),
            currentStock: variant.inStock ?? 0,
            lowStock: variant.lowStock ?? 0,
            isVariant: true,
            variantId: variant.id,
          });
        }
      } else {
        rows.push({
          key: `product-${product.id}`,
          productName: product.name,
          currentStock: product.inStock ?? 0,
          lowStock: product.lowStock ?? 0,
          isVariant: false,
          productId: product.id,
        });
      }
    }

    return { rows, unmatched, notTracked };
  }, [festival.stockUp, products]);

  const { rows, unmatched, notTracked } = stockRows;

  const totalAdditional = rows.reduce(
    (total, row) => total + Math.max(0, Number(quantities[row.key]) || 0),
    0,
  );

  const selectedCount = rows.filter(
    (row) => (Number(quantities[row.key]) || 0) > 0,
  ).length;

  const mutation = useMutation({
    mutationFn: (updates: BulkStockUpdateItem[]) => bulkUpdateStock(updates),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["products-list"],
      });

      setSuccessMessage(
        `${result.totalItemsUpdated} stock adjustment${
          result.totalItemsUpdated === 1 ? "" : "s"
        } updated successfully.`,
      );

      if (result.notFoundCount > 0) {
        setSubmitError(
          `${result.notFoundCount} item(s) could not be found and were not updated.`,
        );
      }
    },
    onError: (error: Error) => {
      setSubmitError(error.message || "Failed to update stock.");
    },
  });

  useEffect(() => {
    setQuantities({});
    setSubmitError(null);
    setSuccessMessage(null);
    mutation.reset();
    // Reset when switching to another festival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festival.id]);

  const handleQuantityChange = (key: string, value: string) => {
    // Allow only whole, non-negative quantities.
    const sanitized = value.replace(/[^\d]/g, "");

    setQuantities((previous) => ({
      ...previous,
      [key]: sanitized,
    }));
  };

  const handleSubmit = () => {
    setSubmitError(null);

    const updates = rows.reduce<BulkStockUpdateItem[]>((updates, row) => {
      const additional = Number(quantities[row.key]) || 0;

      if (additional <= 0) return updates;

      const inStock = row.currentStock + additional;

      if (row.isVariant && row.variantId) {
        updates.push({
          isVariant: true,
          variantId: row.variantId,
          inStock,
          lowStock: row.lowStock,
        });
      } else if (row.productId) {
        updates.push({
          id: row.productId,
          inStock,
          lowStock: row.lowStock,
          isVariant: false,
        });
      }

      return updates;
    }, []);

    if (updates.length === 0) {
      setSubmitError("Enter an additional quantity for at least one item.");
      return;
    }

    mutation.mutate(updates);
  };

  const isBusy = mutation.isPending;

  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Stock up for ${festival.label}`}
      subtitle="Review recommended products and enter the additional quantities."
      icon={PackagePlus}
      iconColor="text-amber-600 dark:text-amber-300"
      iconBgColor="bg-amber-50 dark:bg-amber-400/10"
      busy={isBusy}
      maxWidth="max-w-2xl"
      bodyMaxHeight="max-h-[65vh]"
      footer={
        successMessage ? (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <CheckCircle2 size={16} />
            Done
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 dark:text-[#9aa6bd]">
                {selectedCount} adjustment{selectedCount === 1 ? "" : "s"}{" "}
                selected
              </span>
              <span className="font-semibold text-gray-800 dark:text-[#e8ecf4]">
                +{totalAdditional.toLocaleString()} additional units
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-[12px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-[#c3ccdc] dark:hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isBusy ||
                  productsLoading ||
                  rows.length === 0 ||
                  selectedCount === 0
                }
                onClick={handleSubmit}
                className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#244074] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-[#1c345f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating stock...
                  </>
                ) : (
                  <>
                    <PackagePlus size={15} />
                    Confirm stock-up
                  </>
                )}
              </button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {productsLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-[12px] text-gray-500 dark:text-[#9aa6bd]">
            <Loader2 size={17} className="animate-spin" />
            Loading your products...
          </div>
        ) : successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"
              />
              <div>
                <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">
                  Stock updated successfully
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                  {successMessage}
                </p>

                {submitError && (
                  <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
                    {submitError}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-400/20 dark:bg-amber-400/5">
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
              />
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                Enter how many additional units you want. We&lsquo;ll add them
                to the current stock when updating your inventory.
              </p>
            </div>

            {rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9aa6bd]">
                    Recommended inventory
                  </p>
                  <span className="text-[10px] text-gray-400 dark:text-[#8490a5]">
                    {rows.length} stock item{rows.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-2">
                  {rows.map((row) => {
                    const additional = Math.max(
                      0,
                      Number(quantities[row.key]) || 0,
                    );
                    const targetStock = row.currentStock + additional;

                    return (
                      <div
                        key={row.key}
                        className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-[#aab4c4]">
                              {row.isVariant ? (
                                <Boxes size={15} />
                              ) : (
                                <PackagePlus size={15} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-gray-800 dark:text-[#e8ecf4]">
                                {row.productName}
                              </p>
                              {row.variantName && (
                                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-[#9aa6bd]">
                                  {row.variantName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-gray-400 dark:text-[#8490a5]">
                              Current stock
                            </p>
                            <p className="text-[13px] font-semibold tabular-nums text-gray-700 dark:text-[#e8ecf4]">
                              {row.currentStock.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                          <div className="min-w-0">
                            <label
                              htmlFor={`stock-${row.key}`}
                              className="text-[10px] font-medium text-gray-500 dark:text-[#9aa6bd]"
                            >
                              Additional quantity
                            </label>
                            <div className="relative mt-1 w-36">
                              <Plus
                                size={13}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                              <input
                                id={`stock-${row.key}`}
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                value={quantities[row.key] ?? "0"}
                                onChange={(event) =>
                                  handleQuantityChange(
                                    row.key,
                                    event.target.value,
                                  )
                                }
                                disabled={isBusy}
                                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-[12px] font-medium tabular-nums text-gray-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]"
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 dark:text-[#8490a5]">
                              New stock
                            </p>
                            <p className="text-[13px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                              {targetStock.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {unmatched.length > 0 && (
              <div className="rounded-xl border border-amber-200/80 p-3 dark:border-amber-400/20">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Recommendations not found in your products
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                  {unmatched.join(", ")}
                </p>
              </div>
            )}

            {notTracked.length > 0 && (
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="text-[11px] font-semibold text-gray-600 dark:text-[#c3ccdc]">
                  Products not available for stock adjustment
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-[#9aa6bd]">
                  These products don&lsquo;t currently have eligible stock
                  tracking: {notTracked.join(", ")}
                </p>
              </div>
            )}

            {rows.length === 0 &&
              unmatched.length === 0 &&
              notTracked.length === 0 && (
                <div className="flex min-h-32 flex-col items-center justify-center text-center">
                  <PackagePlus
                    size={23}
                    className="text-gray-400 dark:text-[#8490a5]"
                  />
                  <p className="mt-2 text-[12px] font-medium text-gray-700 dark:text-[#e8ecf4]">
                    No stock recommendations
                  </p>
                </div>
              )}

            {submitError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-400/20 dark:bg-red-400/5">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-300"
                />
                <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                  {submitError}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
