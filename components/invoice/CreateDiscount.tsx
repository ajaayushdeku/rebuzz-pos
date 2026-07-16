"use client";

import { useState } from "react";
import { Plus, Percent, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateDiscount } from "@/hooks/useDiscounts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

export const CreateDiscountDialog = () => {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const { mutate: createDiscount, isPending } = useCreateDiscount();

  const [formData, setFormData] = useState({
    name: "",
    type: "percentage" as "percentage" | "fixed",
    rate: 0,
  });

  const reset = () =>
    setFormData({ name: "", type: "percentage", rate: 0 });

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const handleSave = () => {
    if (!formData.name.trim() || formData.rate <= 0) return;

    const payload = {
      discounts: [
        {
          name: formData.name,
          rate: formData.rate,
          type: formData.type,
          isEnabled: false,
        },
      ],
    };

    createDiscount(payload, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
      >
        <Plus className="h-4 w-4" />
        Create New Discount
      </Button>

      <SettingsModalShell
        open={open}
        onOpenChange={handleOpenChange}
        title="Create New Discount"
        description="Set how much comes off and how it's calculated"
        footer={
          <>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className={modalCancelBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !formData.name.trim() || formData.rate <= 0}
              className={modalPrimaryBtn}
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating...
                </>
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
              placeholder="e.g. Seasonal Sale"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "percentage" | "fixed",
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
                    {formData.type === "percentage" ? (
                      <Percent size={11} />
                    ) : (
                      formatCurrencySymbolOnly(currency.symbol)
                    )}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rate: Number(e.target.value),
                      })
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
    </>
  );
};
