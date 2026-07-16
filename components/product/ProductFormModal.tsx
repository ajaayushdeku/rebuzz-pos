"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Upload, ImageIcon, X, Loader2 } from "lucide-react";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
} from "@/components/settingsComponents/SettingsModalShell";
import { Product } from "@/lib/types/product";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import toast from "react-hot-toast";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

type ProductFormData = {
  name: string;
  price: number;
  costPrice: number;
  description: string;
  isTaxable: boolean;
  usesStocks: boolean;
  inStock: number;
  lowStock: number;
  categoryId: string;
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
  categoryId: "",
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
  /** Pre-fill product name when creating */
  initialName?: string;
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
  initialName,
  onSuccess,
}: ProductFormModalProps) {
  const { currency } = useCurrency();

  const isEditMode = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories = [] } = useCategories();
  const createCategoryMutation = useCreateCategory();

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#60a5fa");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(product?.image ?? null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

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
        categoryId: product.categories ?? "",
      });
      setErrors({});
      setImageFile(null);
      setImagePreview(product.image ?? null);
    } else if (!product && open) {
      setForm({ ...INITIAL_FORM, name: initialName ?? "" });
      setErrors({});
      setImageFile(null);
      setImagePreview(null);
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
    setShowNewCategory(false);
    setNewCategoryName("");
    setNewCategoryColor("#60a5fa");
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
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

    // If user is creating a new category inline, create it first
    let categoryId = form.categoryId;
    if (showNewCategory && newCategoryName.trim()) {
      try {
        const newCat = await createCategoryMutation.mutateAsync({
          name: newCategoryName.trim(),
          color: newCategoryColor.replace("#", ""),
        });
        categoryId = newCat._id;
      } catch {
        toast.error("Failed to create category");
        return;
      }
    }

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
            soldBy: "each",
            categories: categoryId,
            image: imageFile,
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
        soldBy: "each",
        categories: categoryId,
        image: imageFile,
      };
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
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm();
          onClose();
        }
      }}
      title={isEditMode ? "Update Product" : "Create New Product"}
      description={
        isEditMode
          ? "Update this product's details, pricing and stock"
          : "Add a product with its pricing, image and stock"
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isPending}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={modalPrimaryBtn}
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {isEditMode ? "Updating..." : "Saving..."}
              </>
            ) : isEditMode ? (
              "Update Product"
            ) : (
              "Save Product"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
          {/* ── Product image ── */}
          <Section title="Product Image">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={22} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Upload size={13} />
                    {imagePreview ? "Change image" : "Upload image"}
                  </button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <X size={13} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  PNG or JPG, up to 5MB.
                </p>
              </div>
            </div>
          </Section>

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

              {/* Category dropdown */}
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Category
                </Label>
                {showNewCategory ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName("");
                          setNewCategoryColor("#60a5fa");
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCategoryName.trim()) {
                            toast.error("Category name is required");
                            return;
                          }
                          try {
                            const newCat =
                              await createCategoryMutation.mutateAsync({
                                name: newCategoryName.trim(),
                                color: newCategoryColor.replace("#", ""),
                              });
                            set("categoryId", newCat._id);
                            setShowNewCategory(false);
                            setNewCategoryName("");
                            setNewCategoryColor("#60a5fa");
                          } catch {
                            toast.error("Failed to create category");
                          }
                        }}
                        disabled={createCategoryMutation.isPending}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {createCategoryMutation.isPending
                          ? "Creating..."
                          : "Create & Select"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={categoryDropdownRef}>
                      <select
                        value={form.categoryId}
                        onChange={(e) => set("categoryId", e.target.value)}
                        className={`${inputClass} appearance-none pr-8`}
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 4.5L6 7.5L9 4.5"
                            stroke="#9CA3AF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition shrink-0"
                      title="Create new category"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 1V13M1 7H13"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
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
                    {formatCurrencySymbolOnly(currency.symbol)}
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
                    {formatCurrencySymbolOnly(currency.symbol)}
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
        </div>
    </SettingsModalShell>
  );
}
