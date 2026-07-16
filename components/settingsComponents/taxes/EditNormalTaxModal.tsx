"use client";

import { Loader2, Percent } from "lucide-react";
import { Tax } from "@/services/apiTaxes.client";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

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
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title={tax ? "Edit Tax" : "Create New Tax"}
      description="Name the tax and set the rate applied to taxable items"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !form.name.trim() || form.rate <= 0}
            className={modalPrimaryBtn}
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
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Details ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>
            <p className="text-xs text-gray-500">
              How this tax appears on invoices
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
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
            <h3 className="text-sm font-semibold text-gray-800">Rate</h3>
            <p className="text-xs text-gray-500">
              Percentage added to the taxable amount
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Rate (%)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
    </SettingsModalShell>
  );
};

export default EditNormalTaxModal;
