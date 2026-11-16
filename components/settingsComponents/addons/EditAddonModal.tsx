"use client";

import { Loader2, Shapes } from "lucide-react";
import type { Addon } from "@/lib/types/addons";
import ModalShell, {
  modalInput,
  SectionLabel,
} from "@/components/ui/ModalShell";

export type AddonFormValues = {
  name: string;
  price: number;
  description: string;
  maxAvailable?: number;
};

interface EditAddonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: Addon | null;
  form: AddonFormValues;
  onFormChange: (form: AddonFormValues) => void;
  onSave: () => void;
  isPending: boolean;
  isLoading?: boolean;
  loadError?: boolean;
}

const inputBase =
  "w-full h-10 rounded-lg border border-gray-300  px-3 text-[13px] text-slate-800 placeholder:text-slate-300 dark:bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent transition dark:placeholder:text-[#7b869b] dark:text-[#e8ecf4]";
const inputClass = `${inputBase} border-gray-300  dark:border-white/15`;

const EditAddonModal = ({
  open,
  onOpenChange,
  editTarget,
  form,
  onFormChange,
  onSave,
  isPending,
  isLoading = false,
  loadError = false,
}: EditAddonModalProps) => {
  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      title={editTarget ? "Edit Add-on" : "Create New Add-on"}
      subtitle="Configure the name, price and availability of your add-on"
      icon={Shapes}
      iconColor="text-blue-600 dark:text-[#7ba2e3]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={
              isPending ||
              isLoading ||
              !form.name.trim() ||
              !Number.isFinite(form.price) ||
              form.price < 0
            }
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Loading...
              </>
            ) : editTarget ? (
              "Update Add-on"
            ) : (
              "Create Add-on"
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {loadError ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-red-500">
              Failed to load add-on details
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Please close the modal and try again.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400 dark:text-[#9aa6bd]">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            Loading add-on details...
          </div>
        ) : (
          <>
            {/* Details */}
            <div>
              <div className="mb-3">
                <SectionLabel>Details</SectionLabel>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-[#6b7588]">
                  Basic information about this add-on
                </p>
              </div>

              <SectionLabel>Add-on Name</SectionLabel>
              <input
                value={form.name}
                onChange={(e) =>
                  onFormChange({ ...form, name: e.target.value })
                }
                placeholder="e.g. Extra Cheese"
                className={`${modalInput} mt-1`}
              />
            </div>

            {/* Price */}
            <div>
              <SectionLabel>Price</SectionLabel>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#6b7588]">
                Set the additional amount charged for this add-on
              </p>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    price: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                placeholder="e.g. 100"
                className={`${modalInput} mt-2`}
              />
            </div>

            {/* Description */}
            <div>
              <SectionLabel>Description</SectionLabel>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#6b7588]">
                An optional short description
              </p>

              <textarea
                value={form.description}
                onChange={(e) =>
                  onFormChange({ ...form, description: e.target.value })
                }
                placeholder="Describe this add-on..."
                rows={3}
                className={`${inputClass} mt-2 h-auto resize-none py-2`}
              />
            </div>

            {/* Availability */}
            <div>
              <SectionLabel>Maximum Available</SectionLabel>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#6b7588]">
                Optional limit on how many can be selected
              </p>

              <input
                type="number"
                min="0"
                step="1"
                value={form.maxAvailable ?? ""}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    maxAvailable:
                      e.target.value === ""
                        ? undefined
                        : Math.max(0, Math.floor(Number(e.target.value))),
                  })
                }
                placeholder="Leave empty for no limit"
                className={`${modalInput} mt-2`}
              />
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};

export default EditAddonModal;
