import { useState } from "react";
import { Plus, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDiscount } from "@/hooks/useDiscounts";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";

export const CreateDiscountDialog = () => {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const { mutate: createDiscount, isPending } = useCreateDiscount();

  const [formData, setFormData] = useState({
    name: "",
    type: "percentage" as "percentage" | "fixed",
    rate: 0,
  });

  const handleSave = () => {
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
        setFormData({
          name: "",
          type: "percentage",
          rate: 0,
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4" />
          Create New Discount
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            Create New Discount
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label
              htmlFor="discount-name"
              className="text-xs font-medium text-gray-500 block"
            >
              Discount Name
            </Label>
            <Input
              id="discount-name"
              placeholder="e.g., Seasonal Sale"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-gray-500 block ">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val: "percentage" | "fixed") =>
                  setFormData({
                    ...formData,
                    type: val,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage ( % )</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium text-gray-500 block">
                Value
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  className="pl-7"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rate: Number(e.target.value),
                    })
                  }
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {formData.type === "percentage" ? (
                    <Percent size={11} />
                  ) : (
                    formatCurrencySymbolOnly(currency.symbol)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
