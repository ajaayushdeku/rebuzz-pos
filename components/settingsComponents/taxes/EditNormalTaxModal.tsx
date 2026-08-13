"use client";

import { Loader2, Percent, Receipt } from "lucide-react";
import { Tax } from "@/services/apiTaxes.client";
import ModalShell from "@/components/ui/ModalShell";

const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const EditNormalTaxModal = ({
  open,
  onOpenChange,
  tax,
  form,
  onFormChange,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tax: Tax | null;
  form: { name: string; rate: number };
  onFormChange: (form: { name: string; rate: number }) => void;
  onSave: () => void;
  isPending: boolean;
}) => {
  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      title={tax ? "Edit Tax" : "Create New Tax"}
      subtitle="Name the tax and set the rate applied to taxable items"
      icon={Receipt}
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
            ) : (
              "Save Tax"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Details ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How this tax appears on invoices
            </p>
          </div>

          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
            Tax Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="e.g. VAT"
            className={inputClass}
          />
        </div>

        {/* ── Rate ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Rate
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Percentage added to the taxable amount
            </p>
          </div>

          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
            Rate (%)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Percent className="h-3.5 w-3.5" />
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.rate}
              onChange={(e) =>
                onFormChange({ ...form, rate: Number(e.target.value) })
              }
              className={`${inputClass} pl-8`}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default EditNormalTaxModal;
