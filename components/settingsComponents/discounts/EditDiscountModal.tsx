"use client";

import { Loader2, Percent, BadgePercent } from "lucide-react";
import { Discount } from "@/app/(app)/settings/discount/page";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import ModalShell from "@/components/ui/ModalShell";

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const EditDiscountModal = ({
  open,
  onOpenChange,
  editTarget,
  form,
  onFormChange,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: Discount | null;
  form: DiscountForm;
  onFormChange: (form: DiscountForm) => void;
  onSave: () => void;
  isPending: boolean;
}) => {
  const { currency } = useCurrency();

  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      title={editTarget ? "Edit Discount" : "Create New Discount"}
      subtitle="Set how much comes off and how it's calculated"
      icon={BadgePercent}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !form.name.trim() || form.rate <= 0}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : editTarget ? (
              "Update Discount"
            ) : (
              "Create Discount"
            )}
          </button>
        </div>
      }
    >
      {/* ── Details ── */}
      <div className="space-y-5">
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              A clear name helps staff pick the right discount
            </p>
          </div>

          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
            Discount Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="e.g. Seasonal Sale"
            className={inputClass}
          />
        </div>

        {/* ── Amount ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Amount
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a percentage of the total or a fixed amount
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    type: e.target.value as DiscountType,
                  })
                }
                className={`${inputClass} appearance-none`}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
                Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
                  {form.type === "percentage" ? (
                    <Percent size={11} />
                  ) : (
                    formatCurrencySymbolOnly(currency.symbol)
                  )}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.rate}
                  onChange={(e) =>
                    onFormChange({ ...form, rate: Number(e.target.value) })
                  }
                  className={`${inputClass} pl-7`}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default EditDiscountModal;
