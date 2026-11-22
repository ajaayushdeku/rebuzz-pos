"use client";

import { useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  Loader2,
  Percent,
  AlertCircle,
  Tag,
} from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { useDiscounts } from "@/hooks/useDiscounts";

import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useUpdateProduct } from "@/hooks/useProducts";
import { useProductsList } from "@/hooks/useProductsList";

interface ApplySlowItemDiscountDialogProps {
  open: boolean;
  productId: string;
  productName: string;
  discountId: string;
  onClose: () => void;
  onApplied?: () => void;
}

export default function ApplySlowItemDiscountDialog({
  open,
  productId,
  productName,
  discountId,
  onClose,
  onApplied,
}: ApplySlowItemDiscountDialogProps) {
  const { currency } = useCurrency();

  const [applyError, setApplyError] = useState("");

  const {
    data: products = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = useProductsList();

  const {
    data: discounts = [],
    isLoading: isDiscountsLoading,
    isFetching: isDiscountsFetching,
    isError: isDiscountsError,
  } = useDiscounts();

  const updateProductMutation = useUpdateProduct();

  const product = products.find((item) => item.id === productId);

  const discount = discounts.find((item) => item._id === discountId);

  const existingDiscountIds = product?.discounts ?? [];

  const alreadyApplied = existingDiscountIds.includes(discountId);

  // Other discounts already attached to this product.
  const otherAppliedDiscounts = discounts.filter(
    (item) => existingDiscountIds.includes(item._id) && item._id !== discountId,
  );

  const isLoading =
    isProductsLoading || isDiscountsLoading || isDiscountsFetching;

  const isLoadingError = isProductsError || isDiscountsError;

  const formatDiscountValue = (item: (typeof discounts)[number]) => {
    if (item.type === "percentage") {
      return `${item.rate}% off`;
    }

    return `${formatCurrencySymbolOnly(currency.symbol)}${item.rate} off`;
  };

  const handleApply = async () => {
    if (!product || !discount || alreadyApplied) return;

    setApplyError("");

    // Preserve all existing discounts and add the selected one.
    const updatedDiscountIds = Array.from(
      new Set([...existingDiscountIds, discountId]),
    );

    try {
      await updateProductMutation.mutateAsync({
        productId: product.id,
        fields: {
          discounts: updatedDiscountIds,
          discountType: "applyEverytime",
        },
      });

      onApplied?.();
      onClose();
    } catch {
      setApplyError(
        "The discount was created successfully, but couldn't be applied to this product. You can try again.",
      );
    }
  };

  const handleClose = () => {
    if (updateProductMutation.isPending) return;

    setApplyError("");
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      busy={updateProductMutation.isPending}
      title="Apply Discount"
      subtitle="Attach the selected discount to this product"
      icon={BadgePercent}
      iconColor="text-blue-600 dark:text-[#7ba2e3]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={updateProductMutation.isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={
              isLoading ||
              isLoadingError ||
              !product ||
              !discount ||
              alreadyApplied ||
              updateProductMutation.isPending
            }
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {updateProductMutation.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Applying...
              </>
            ) : alreadyApplied ? (
              "Already Applied"
            ) : (
              "Apply Discount"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex min-h-[150px] items-center justify-center gap-2 text-sm text-slate-500 dark:text-[#9ca9bc]">
            <Loader2 size={18} className="animate-spin" />
            Loading product and discount details...
          </div>
        ) : isLoadingError ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            Unable to load the product or discount details. Please try again.
          </div>
        ) : !product || !discount ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {!product
              ? "The selected product could not be found."
              : "The selected discount could not be found. Please refresh and try again."}
          </div>
        ) : (
          <>
            {/* Selected product */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-[#8490a5]">
                Selected product
              </p>

              <p className="text-sm font-semibold text-slate-800 dark:text-[#e8ecf4]">
                {productName}
              </p>
            </div>

            {/* Selected discount */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-400/20 dark:bg-blue-400/[0.06]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-[#8eb3f0]">
                  {discount.type === "percentage" ? (
                    <Percent size={17} />
                  ) : (
                    <BadgePercent size={17} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-[#e8ecf4]">
                    {discount.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-[#9ca9bc]">
                    {formatDiscountValue(discount)}
                  </p>
                </div>

                <CheckCircle2
                  size={17}
                  className="shrink-0 text-blue-600 dark:text-[#8eb3f0]"
                />
              </div>
            </div>

            {/* Other existing discounts - intentionally subtle */}
            {otherAppliedDiscounts.length > 0 && (
              <div className="rounded-lg border border-slate-200/80 px-3 py-3 dark:border-white/[0.07]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Tag
                      size={12}
                      className="text-slate-400 dark:text-[#8490a5]"
                    />
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#9ca9bc]">
                      Other applied discounts
                    </p>
                  </div>

                  <span className="text-[10px] tabular-nums text-slate-400 dark:text-[#8490a5]">
                    {otherAppliedDiscounts.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {otherAppliedDiscounts.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="min-w-0 truncate text-slate-600 dark:text-[#a9b4c7]">
                        {item.name}
                      </span>

                      <span className="shrink-0 font-medium tabular-nums text-slate-500 dark:text-[#8490a5]">
                        {formatDiscountValue(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alreadyApplied && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                This discount is already attached to this product.
              </p>
            )}

            {!alreadyApplied && existingDiscountIds.length > 0 && (
              <p className="text-[11px] text-slate-400 dark:text-[#8490a5]">
                Existing discounts will be preserved when applying this one.
              </p>
            )}
          </>
        )}

        {applyError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {applyError}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
