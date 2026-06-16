"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CreateDiscountDialog } from "./CreateDiscount";
import DiscountPickerModal from "./DiscountPickerModal";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

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

  return (
    <div className="border-t bg-gray-50/50 px-4 py-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <CreateDiscountDialog />

        {/* <div className="flex-1">
          <Select onValueChange={onDiscountSelect} value="">
            <SelectTrigger className="border-dashed border-gray-300 text-gray-500 text-sm">
              <SelectValue placeholder="Apply a discount..." />
            </SelectTrigger>
            <SelectContent>
              {masterDiscounts.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No discounts available
                </div>
              ) : (
                masterDiscounts.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name} (
                    {d.type === "percentage" ? `${d.rate}%` : `$${d.rate}`})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div> */}

        {/* + button opens modal */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
          title="Apply discount"
        >
          <Plus className="w-4 h-4" />
        </button>

        {selectedDiscountIds.length === 0 && (
          <span className="text-sm text-gray-400">No discount applied</span>
        )}
      </div>

      {/* Applied discounts */}
      {selectedDiscountIds.length > 0 && (
        <div className="space-y-1">
          {selectedDiscountIds.map((id) => {
            const d = getDiscount(id);
            if (!d) return null;
            const amount =
              d.type === "percentage" ? (subtotal * d.rate) / 100 : d.rate;
            return (
              <div
                key={id}
                className="flex items-center justify-between text-sm px-1"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  <button
                    type="button"
                    onClick={() => onDiscountRemove(id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <span>{d.name}</span>

                  <span className="text-gray-400 text-xs">
                    (
                    {d.type === "percentage"
                      ? ` ${d.rate}% `
                      : ` ${formatCurrencySymbol(d.rate, currency.symbol, currency.locale)} `}
                    )
                  </span>
                </div>

                <span className="text-blue-500 font-medium">
                  -{" "}
                  {formatCurrencySymbol(
                    amount,
                    currency.symbol,
                    currency.locale,
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtotal + discount summary */}
      <div className="flex justify-end border-t pt-3">
        <div className="text-right space-y-1.5 min-w-52">
          <div className="flex justify-between gap-12 text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="font-medium text-gray-800">
              {formatCurrencySymbol(subtotal, currency.symbol, currency.locale)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between gap-12 text-sm text-blue-500 font-medium">
              <span>Discount</span>
              <span>
                -{" "}
                {formatCurrencySymbol(
                  discountAmount,
                  currency.symbol,
                  currency.locale,
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-12 text-sm font-semibold text-gray-700 border-t pt-1.5">
            <span>After Discount</span>
            <span>
              {formatCurrencySymbol(
                Math.max(0, subtotal - discountAmount),
                currency.symbol,
                currency.locale,
              )}
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
