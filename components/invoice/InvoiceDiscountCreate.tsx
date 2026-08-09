"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ChevronDown, Tags } from "lucide-react";
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

interface CustomDiscount {
  id: string;
  type: "fixed" | "percentage";
  value: number;
}

interface InvoiceDiscountCreateProps {
  subtotal: number;
  discountAmount: number;
  masterDiscounts: Discount[];
  selectedDiscountIds: string[];
  onDiscountSelect: (id: string) => void;
  onDiscountRemove: (id: string) => void;
  customDiscounts: CustomDiscount[];
  onCustomDiscountAdd: () => void;
  onCustomDiscountUpdate: (
    id: string,
    field: "type" | "value",
    value: string | number,
  ) => void;
  onCustomDiscountRemove: (id: string) => void;
  /**
   * Optional. Lets a selected pre-defined discount's rate/type be overridden
   * for this invoice only. Without it those two inputs render read-only —
   * editing them would otherwise change nothing on screen, since the parent
   * reads the rate straight off `masterDiscounts`.
   */
  onDiscountOverride?: (
    id: string,
    field: "type" | "value",
    value: string | number,
  ) => void;
}

/**
 * Type dropdown matching the InvoiceTable's "All Status" dropdown style.
 */
function TypeDropdown({
  value,
  editable,
  currencySymbol,
  onChange,
}: {
  value: "fixed" | "percentage";
  editable: boolean;
  currencySymbol: string;
  onChange: (t: "fixed" | "percentage") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const options = [
    { value: "fixed" as const, label: currencySymbol },
    { value: "percentage" as const, label: "%" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={!editable}
        onClick={() => setOpen((o) => !o)}
        className="w-20 flex items-center justify-between gap-1 pl-3 pr-2 py-1.5 text-[13px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 cursor-pointer transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        <span>{value === "fixed" ? currencySymbol : "%"}</span>
        {editable && (
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {editable && (
        <div
          className={`absolute z-30 mt-1 w-20 origin-top rounded-md border border-gray-200 bg-white shadow-lg p-0.5 transition-all duration-200 ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
                value === opt.value
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One discount row: label · value · type · amount · delete.
 * Positioned on the right side, matching the payment history layout.
 */
function DiscountRow({
  label,
  value,
  type,
  amount,
  currencySymbol,
  editable,
  onValueChange,
  onTypeChange,
  onRemove,
}: {
  label: string;
  value: number;
  type: "fixed" | "percentage";
  amount: string;
  currencySymbol: string;
  editable: boolean;
  onValueChange: (v: number) => void;
  onTypeChange: (t: "fixed" | "percentage") => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-5 min-w-[420px] max-w-full">
        <span
          className="w-28 shrink-0 text-sm text-gray-600 truncate text-right"
          title={label}
        >
          {label}
        </span>

        <input
          type="number"
          min={0}
          value={value}
          disabled={!editable}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="h-8 w-24 rounded-lg border border-gray-200 px-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />

        <TypeDropdown
          value={type}
          editable={editable}
          currencySymbol={currencySymbol}
          onChange={onTypeChange}
        />

        <span className="min-w-[96px] text-right text-sm font-medium text-gray-800 tabular-nums">
          {amount}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
          title="Remove discount"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function InvoiceDiscountCreate({
  subtotal,
  discountAmount,
  masterDiscounts,
  selectedDiscountIds,
  onDiscountSelect,
  onDiscountRemove,
  customDiscounts,
  onCustomDiscountAdd,
  onCustomDiscountUpdate,
  onCustomDiscountRemove,
  onDiscountOverride,
}: InvoiceDiscountCreateProps) {
  const { currency } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const getDiscount = (id: string) => masterDiscounts.find((d) => d._id === id);

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const hasAnyDiscount =
    selectedDiscountIds.length > 0 || customDiscounts.length > 0;

  return (
    <div className="px-5 py-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Discount
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* + button opens inline form */}
        <button
          type="button"
          onClick={() => setShowInlineForm((v) => !v)}
          className="h-8 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
          title="Add discount"
        >
          <Plus className="w-3.5 h-3.5" />
          Add a discount
        </button>

        {/* Select from discount collection — only when inline form is open */}
        {showInlineForm && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-8 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Select from discount collection"
          >
            <Tags className="w-3.5 h-3.5" />
            Select from discount collection
          </button>
        )}

        {/* Create New Discount — only when inline form is open */}
        {/* {showInlineForm && <CreateDiscountDialog />} */}

        {!hasAnyDiscount && !showInlineForm && (
          <span className="text-xs text-gray-400">No discount applied</span>
        )}
      </div>

      {/* ── Discount rows ──
          Pre-defined and custom discounts share one row layout so the section
          reads as a single list. Rows stay visible once something is applied,
          even after the add controls are collapsed. */}
      {(showInlineForm || hasAnyDiscount) && (
        <div className="flex flex-col items-end gap-2">
          {/* Pre-defined discounts — labelled with the discount's own name */}
          {selectedDiscountIds.map((id) => {
            const d = getDiscount(id);
            if (!d) return null;
            const amount =
              d.type === "percentage" ? (subtotal * d.rate) / 100 : d.rate;

            return (
              <DiscountRow
                key={id}
                label={d.name}
                value={d.rate}
                type={d.type}
                amount={fmt(amount)}
                currencySymbol={currency.symbol}
                editable={!!onDiscountOverride}
                onValueChange={(v) => onDiscountOverride?.(id, "value", v)}
                onTypeChange={(t) => onDiscountOverride?.(id, "type", t)}
                onRemove={() => onDiscountRemove(id)}
              />
            );
          })}

          {/* Custom discounts */}
          {customDiscounts.map((d) => {
            const amount =
              d.type === "percentage" ? (subtotal * d.value) / 100 : d.value;

            return (
              <DiscountRow
                key={d.id}
                label="Discount"
                value={d.value}
                type={d.type}
                amount={fmt(amount)}
                currencySymbol={currency.symbol}
                editable
                onValueChange={(v) => onCustomDiscountUpdate(d.id, "value", v)}
                onTypeChange={(t) => onCustomDiscountUpdate(d.id, "type", t)}
                onRemove={() => onCustomDiscountRemove(d.id)}
              />
            );
          })}

          {/* Add custom discount — only when no custom form is open (max 1 at a time) */}
          {showInlineForm && customDiscounts.length === 0 && (
            <button
              type="button"
              onClick={onCustomDiscountAdd}
              className="h-8 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              title="Add custom discount"
            >
              <Plus className="w-3.5 h-3.5" />
              Add custom discount
            </button>
          )}
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
        title="Apply Discounts"
      />
    </div>
  );
}
