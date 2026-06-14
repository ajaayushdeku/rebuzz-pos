import { Loader2, Percent, DollarSign } from "lucide-react";
import { Discount } from "@/app/(app)/settings/discount/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            {editTarget ? "Edit Discount" : "Create New Discount"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
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
                    <DollarSign size={11} />
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
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>

          <Button
            onClick={onSave}
            disabled={isPending || !form.name.trim() || form.rate <= 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Saving...
              </>
            ) : editTarget ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDiscountModal;
