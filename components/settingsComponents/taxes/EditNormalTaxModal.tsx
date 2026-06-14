import { Loader2, Percent } from "lucide-react";
import { Tax } from "@/services/apiTaxes.client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Edit Tax
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">
              Tax Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="e.g. VAT"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">
              Rate (%)
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                className="pl-7"
                value={form.rate}
                onChange={(e) =>
                  onFormChange({ ...form, rate: Number(e.target.value) })
                }
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Percent className="h-3.5 w-3.5" />
              </span>
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
            className="bg-blue-600 hover:bg-blue-700 text-sm rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditNormalTaxModal;
