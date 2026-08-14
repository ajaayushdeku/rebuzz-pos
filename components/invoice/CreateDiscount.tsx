"use client";

import { useState } from "react";
import { Percent, Loader2, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalShell from "@/components/ui/ModalShell";
import SelectMenu from "@/components/ui/SelectMenu";
import { useCreateDiscount } from "@/hooks/useDiscounts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";

const DISCOUNT_TYPES: { value: "percentage" | "fixed"; label: string }[] = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount" },
];

export const CreateDiscountDialog = () => {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const { mutate: createDiscount, isPending } = useCreateDiscount();

  const [formData, setFormData] = useState({
    name: "",
    type: "percentage" as "percentage" | "fixed",
    rate: 0,
  });

  const reset = () => setFormData({ name: "", type: "percentage", rate: 0 });

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

  // Matches SelectMenu's trigger (rounded-xl, py-2.5, 13px) so the Type
  // dropdown and the Value field sit on the same baseline and height.
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-dashed text-sm border-blue-400 text-blue-600 hover:bg-blue-50"
      >
        <BadgePercent className="h-4 w-4" />
        Create New Discount
      </Button>

      <ModalShell
        open={open}
        onClose={() => handleOpenChange(false)}
        busy={isPending}
        title="Create New Discount"
        subtitle="Set how much comes off and how it is calculated"
        icon={BadgePercent}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                isPending || !formData.name.trim() || formData.rate <= 0
              }
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
                <SelectMenu
                  value={formData.type}
                  options={DISCOUNT_TYPES}
                  onChange={(type) => setFormData({ ...formData, type })}
                  className="w-full"
                  capitalize={false}
                  aria-label="Discount type"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
                  Value
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
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
                    className={`${inputClass} pl-7 tabular-nums`}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
};
