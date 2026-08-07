"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CreateDiscountDialog } from "./CreateDiscount";
import DiscountPickerModal from "./DiscountPickerModal";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

interface Discount {
  _id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
}

interface InvoiceDiscountCreateProps {
  subtotal: number;
  discountAmount: number;
  masterDiscounts: Discount[];
  selectedDiscountIds: string[];
  onDiscountSelect: (id: string) => void;
  onDiscountRemove: (id: string) => void;
}

export default function InvoiceDiscountCreate({
  subtotal,
  discountAmount,
  masterDiscounts,
  selectedDiscountIds,
  onDiscountSelect,
  onDiscountRemove,
}: InvoiceDiscountCreateProps) {
  const { currency } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const getDiscount = (id: string) => masterDiscounts.find((d) => d._id === id);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    // Untinted and column-friendly — the old full-width grey band stopped
    // halfway across the card once Payment History took the right side.
    <div className="px-5 py-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Discount
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <CreateDiscountDialog />

        {/* + button opens modal */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-8 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          title="Apply discount"
        >
          <Plus className="w-3.5 h-3.5" />
          Add a discount
        </button>

        {selectedDiscountIds.length === 0 && (
          <span className="text-xs text-gray-400">No discount applied</span>
        )}
      </div>

      {/* Applied discounts */}
      {selectedDiscountIds.length > 0 && (
        <div className="rounded-lg border border-gray-100 divide-y divide-gray-100">
          {selectedDiscountIds.map((id) => {
            const d = getDiscount(id);
            if (!d) return null;
            const amount =
              d.type === "percentage" ? (subtotal * d.rate) / 100 : d.rate;
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 text-gray-600">
                  <button
                    type="button"
                    onClick={() => onDiscountRemove(id)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <span className="truncate">{d.name}</span>

                  <span className="text-gray-400 text-xs shrink-0">
                    {d.type === "percentage"
                      ? `(${d.rate}%)`
                      : `(${fmt(d.rate)})`}
                  </span>
                </div>

                <span className="text-blue-500 font-medium shrink-0 tabular-nums">
                  - {fmt(amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtotal + discount summary */}
      <div className="flex justify-end border-t border-gray-100 pt-3">
        <div className="text-right space-y-1.5 min-w-52">
          <div className="flex justify-between gap-12 text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-medium text-gray-800 tabular-nums">
              {fmt(subtotal)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between gap-12 text-sm text-blue-500 font-medium">
              <span>Discount</span>
              <span className="tabular-nums">- {fmt(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between gap-12 text-sm font-semibold text-gray-700 border-t border-gray-100 pt-1.5">
            <span>After Discount</span>
            <span className="tabular-nums">
              {fmt(Math.max(0, subtotal - discountAmount))}
            </span>
          </div>
        </div>
      </div>

      <DiscountPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        discounts={masterDiscounts}
        selectedIds={selectedDiscountIds}
        onApply={(ids) => {
          // Sync: add newly selected, keep removed ones removed
          const toAdd = ids.filter((id) => !selectedDiscountIds.includes(id));
          const toRemove = selectedDiscountIds.filter(
            (id) => !ids.includes(id),
          );
          toAdd.forEach(onDiscountSelect);
          toRemove.forEach(onDiscountRemove);
        }}
        title="Apply Invoice Discounts"
      />
    </div>
  );
}
