"use client";

import { Loader2, Percent } from "lucide-react";
import { Discount } from "@/app/(app)/settings/discount/page";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

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
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title={editTarget ? "Edit Discount" : "Create New Discount"}
      description="Set how much comes off and how it's calculated"
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
            ) : editTarget ? (
              "Update Discount"
            ) : (
              "Create Discount"
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
              A clear name helps staff pick the right discount
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
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
            <h3 className="text-sm font-semibold text-gray-800">Amount</h3>
            <p className="text-xs text-gray-500">
              Choose a percentage of the total or a fixed amount
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
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
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
    </SettingsModalShell>
  );
};

export default EditDiscountModal;
