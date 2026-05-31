"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types/product";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import toast from "react-hot-toast";

type SoldBy = "each" | "volume" | "";

type ProductFormData = {
  name: string;
  price: number;
  costPrice: number;
  description: string;
  isTaxable: boolean;
  usesStocks: boolean;
  inStock: number;
  lowStock: number;
  soldBy: SoldBy;
};

type FormErrors = Partial<Record<keyof ProductFormData, string>>;

const INITIAL_FORM: ProductFormData = {
  name: "",
  price: 0,
  costPrice: 0,
  description: "",
  isTaxable: false,
  usesStocks: false,
  inStock: 0,
  lowStock: 0,
  soldBy: "",
};

// ── Reusable toggle ──
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Section card ──
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const inputErrorClass =
  "w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass an existing product for edit mode */
  product?: Product | null;
  /**
   * Callback fired after successful save (create or update).
   * Not required — the modal handles its own toasts and invalidation.
   */
  onSuccess?: (product: Product) => void;
}

export default function ProductFormModal({
  open,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const isEditMode = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing
  useEffect(() => {
    if (product && open) {
      setForm({
        name: product.name,
        price: product.price,
        costPrice: product.costPrice ?? 0,
        description: product.description ?? "",
        isTaxable: product.isTaxable,
        usesStocks: product.usesStocks,
        inStock: product.inStock ?? 0,
        lowStock: product.lowStock ?? 0,
        soldBy: product.soldBy ?? "",
      });
      setErrors({});
    } else if (!product && open) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [product, open]);

  const set = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  // ── Validation ──
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (form.price < 0) e.price = "Price cannot be negative.";
    if (form.costPrice < 0) e.costPrice = "Cost price cannot be negative.";
    if (form.usesStocks) {
      if (form.inStock < 0) e.inStock = "In stock cannot be negative.";
      if (form.lowStock < 0) e.lowStock = "Low stock cannot be negative.";
      if (form.lowStock > form.inStock)
        e.lowStock = "Low stock cannot exceed in stock.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (isEditMode && product) {
      await updateMutation.mutateAsync(
        {
          productId: product.id,
          fields: {
            name: form.name,
            price: form.price,
            costPrice: form.costPrice,
            description: form.description,
            isTaxable: form.isTaxable,
            usesStocks: form.usesStocks,
            inStock: form.inStock,
            lowStock: form.lowStock,
            soldBy: form.soldBy,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Product "${form.name}" updated`);
            resetForm();
            onClose();
          },
          onError: (err) => {
            toast.error(`Update failed: ${err.message}`);
          },
        },
      );
    } else {
      const payload: Record<string, unknown> = {
        name: form.name,
        price: form.price,
        costPrice: form.costPrice,
        description: form.description,
        isTaxable: form.isTaxable,
        usesStocks: form.usesStocks,
      };
      if (form.soldBy) payload.soldBy = form.soldBy;
      if (form.usesStocks) {
        payload.inStock = form.inStock;
        payload.lowStock = form.lowStock;
      }

      await createMutation.mutateAsync(payload, {
        onSuccess: (result) => {
          toast.success(`Product "${result.name}" created`);
          onSuccess?.(result);
          resetForm();
          onClose();
        },
        onError: (err) => {
          toast.error(`Create failed: ${err.message}`);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            {isEditMode ? "Update Product" : "Create New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Product info ── */}
          <Section title="Product Info">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Product name <span className="text-red-500">*</span>
                </Label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Popcorn"
                  className={errors.name ? inputErrorClass : inputClass}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Description
                </Label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Short description..."
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </Section>

          {/* ── Pricing ── */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Selling price
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                    className={`${errors.price ? inputErrorClass : inputClass} pl-7`}
                    placeholder="0"
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Cost price
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.costPrice}
                    onChange={(e) => set("costPrice", Number(e.target.value))}
                    className={`${errors.costPrice ? inputErrorClass : inputClass} pl-7`}
                    placeholder="0"
                  />
                </div>
                {errors.costPrice && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.costPrice}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* ── Tax & Inventory ── */}
          <Section title="Tax & Inventory">
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              {/* Is taxable */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Is Taxable
                  </p>
                  <p className="text-xs text-gray-400">
                    Apply tax to this product
                  </p>
                </div>
                <Toggle
                  checked={form.isTaxable}
                  onChange={(v) => set("isTaxable", v)}
                />
              </div>

              {/* Track stock */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Track Stock
                  </p>
                  <p className="text-xs text-gray-400">
                    Monitor inventory levels
                  </p>
                </div>
                <Toggle
                  checked={form.usesStocks}
                  onChange={(v) => {
                    set("usesStocks", v);
                    if (!v) {
                      set("inStock", 0);
                      set("lowStock", 0);
                      setErrors((prev) => ({
                        ...prev,
                        inStock: undefined,
                        lowStock: undefined,
                      }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Stock fields — shown only when usesStocks is true */}
            {form.usesStocks && (
              <div className="space-y-3">
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⓘ In the inventory page, the maximum stock threshold for all
                  products is set to 1,000 units.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">
                      In stock
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={form.inStock}
                      onChange={(e) => {
                        set("inStock", Number(e.target.value));
                        if (form.lowStock > Number(e.target.value)) {
                          setErrors((prev) => ({
                            ...prev,
                            lowStock: "Low stock cannot exceed in stock.",
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            lowStock: undefined,
                          }));
                        }
                      }}
                      className={errors.inStock ? inputErrorClass : inputClass}
                      placeholder="e.g. 50"
                    />
                    {errors.inStock && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.inStock}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">
                      Low stock threshold
                    </Label>
                    <input
                      type="number"
                      min={0}
                      value={form.lowStock}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        set("lowStock", val);
                        if (val > form.inStock) {
                          setErrors((prev) => ({
                            ...prev,
                            lowStock: "Low stock cannot exceed in stock.",
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            lowStock: undefined,
                          }));
                        }
                      }}
                      className={`${errors.lowStock ? inputErrorClass : inputClass} ${
                        form.lowStock > 0 &&
                        form.lowStock <= form.inStock &&
                        form.lowStock <= 5
                          ? "border-amber-300 focus:ring-amber-400"
                          : ""
                      }`}
                      placeholder="e.g. 5"
                    />
                    {errors.lowStock ? (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.lowStock}
                      </p>
                    ) : form.lowStock > 0 && form.lowStock <= 5 ? (
                      <p className="text-xs text-amber-500 mt-1">
                        ⚠ Alert triggers when stock reaches this level
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* ── Sold by / Inventory type ── */}
          <Section title="Inventory Type">
            <div className="grid grid-cols-2 gap-2">
              {(["each", "volume"] as SoldBy[]).filter(Boolean).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("soldBy", form.soldBy === opt ? "" : opt)}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                    form.soldBy === opt
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
            {!form.soldBy && (
              <p className="text-xs text-gray-400 mt-1">
                Optional — select how this product is measured.
              </p>
            )}
          </Section>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isPending}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isPending
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update Product"
                : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
