"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  initialName: string;
  isCustom: boolean;
  onConfirm: (name: string, price: number) => void;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function ProductDetailModal({
  open,
  onClose,
  initialName,
  isCustom,
  onConfirm,
}: ProductDetailModalProps) {
  const [name, setName] = useState(isCustom ? "" : initialName);
  const [price, setPrice] = useState<number | "">("");
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const validate = () => {
    const e: { name?: string; price?: string } = {};
    if (isCustom && !name.trim()) e.name = "Product name is required.";
    if (!price || Number(price) <= 0) e.price = "A valid price is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(isCustom ? name : initialName, Number(price));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            {isCustom
              ? "Custom Product Details"
              : `Set price for "${initialName}"`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {isCustom && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Product name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name)
                    setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="e.g. Special Burger"
                className={
                  errors.name
                    ? inputClass.replace("border-gray-200", "border-red-300")
                    : inputClass
                }
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                Rs
              </span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value === "" ? "" : Number(e.target.value));
                  if (errors.price)
                    setErrors((p) => ({ ...p, price: undefined }));
                }}
                placeholder="0.00"
                className={`${
                  errors.price
                    ? inputClass.replace("border-gray-200", "border-red-300")
                    : inputClass
                } pl-8`}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
