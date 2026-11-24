"use client";

import { useState } from "react";
import { Percent, Loader2, BadgePercent } from "lucide-react";
import ModalShell, {
  modalInput,
  SectionLabel,
} from "@/components/ui/ModalShell";
import SelectMenu from "@/components/ui/SelectMenu";
import { useCreateDiscount } from "@/hooks/useDiscounts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

export const DISCOUNT_TYPES: {
  value: "percentage" | "fixed";
  label: string;
}[] = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount" },
];

interface CreateDiscountDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (discountId: string) => void;
  initialName?: string;
  initialRate?: number;
  initialType?: "percentage" | "fixed";
}

type DiscountFormData = {
  name: string;
  type: "percentage" | "fixed";
  rate: number | undefined;
};

export const CreateDiscountDialog = ({
  open: openProp,
  onOpenChange,
  onCreated,
  initialName = "",
  initialRate = 0,
  initialType = "percentage",
}: CreateDiscountDialogProps) => {
  const { currency } = useCurrency();

  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const { mutate: createDiscount, isPending } = useCreateDiscount();

  const [formData, setFormData] = useState<DiscountFormData>({
    name: initialName,
    type: initialType,
    rate: initialRate,
  });

  const reset = () => {
    setFormData({
      name: initialName,
      type: initialType,
      rate: initialRate,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || (formData.rate ?? 0) <= 0) return;

    if (formData.type === "percentage" && (formData.rate ?? 0) > 100) {
      return;
    }

    const payload = {
      discounts: [
        {
          name: formData.name.trim(),
          rate: formData.rate,
          type: formData.type,
          isEnabled: false,
        },
      ],
    };

    createDiscount(payload, {
      onSuccess: (response) => {
        const result = response as unknown as {
          data?: {
            message?: {
              discounts?: Array<{ _id?: string }>;
            };
          };
        };

        const discountId = result?.data?.message?.discounts?.[0]?._id;

        if (discountId) {
          onCreated?.(discountId);
        }

        handleOpenChange(false);
      },
    });
  };

  const isInvalidRate =
    (formData.rate ?? 0) <= 0 ||
    (formData.type === "percentage" && (formData.rate ?? 0) > 100);

  return (
    <>
      {!isControlled && (
        <HeaderActionButton
          variant="dashed"
          hideLabelOnMobile
          icon={BadgePercent}
          label="Create New Discount"
          onClick={() => handleOpenChange(true)}
        />
      )}

      <ModalShell
        open={open}
        onClose={() => handleOpenChange(false)}
        busy={isPending}
        title="Create New Discount"
        subtitle="Set how much comes off and how it is calculated"
        icon={BadgePercent}
        iconColor="text-blue-600 dark:text-[#7ba2e3]"
        iconBgColor="bg-blue-50 dark:bg-blue-400/10"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !formData.name.trim() || isInvalidRate}
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
        <div className="space-y-5">
          <div>
            <div className="mb-3">
              <SectionLabel>Details</SectionLabel>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-[#6b7588]">
                A clear name helps staff pick the right discount
              </p>
            </div>

            <SectionLabel>Discount Name</SectionLabel>
            <input
              placeholder="e.g. Seasonal Sale"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={modalInput}
            />
          </div>

          <div>
            <div className="mb-3">
              <SectionLabel>Amount</SectionLabel>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-[#6b7588]">
                Choose a percentage of the total or a fixed amount
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel>Type</SectionLabel>
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
                <SectionLabel>Value</SectionLabel>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 dark:text-[#7b869b]">
                    {formData.type === "percentage" ? (
                      <Percent size={11} />
                    ) : (
                      formatCurrencySymbolOnly(currency.symbol)
                    )}
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={formData.type === "percentage" ? 100 : undefined}
                    step="any"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rate:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    className={`${modalInput} pl-7 tabular-nums`}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault();
                      }
                    }}
                    onWheelCapture={(e) => {
                      e.currentTarget.blur();
                    }}
                    placeholder="0"
                  />
                </div>

                {formData.type === "percentage" &&
                  (formData.rate ?? 0) > 100 && (
                    <p className="mt-1 text-[11px] text-red-500">
                      Percentage cannot exceed 100%.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
};
