"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/types/product";
import { FREE_PRODUCT_LIMIT } from "@/lib/config/plans";
import ModalShell from "@/components/ui/ModalShell";
import SelectMenu from "@/components/ui/SelectMenu";
import {
  VariantOptionsEditor,
  VariantRowsEditor,
  buildVariantRows,
  rowKey,
  usableOptions,
  type VariantOption,
  type VariantRow,
} from "@/components/product/ProductVariantsEditor";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useDiscounts } from "@/hooks/useDiscounts";
import { CreateDiscountDialog } from "@/components/invoice/CreateDiscount";
import toast from "react-hot-toast";
import { formatCurrencySymbolOnly } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

/**
 * Same colour code as the product detail modal: each data domain owns one hue,
 * used only on labels, icons and rails — never as a fill.
 */
const DOMAIN = {
  price: { rail: "bg-emerald-500", label: "text-emerald-700" },
  cost: { rail: "bg-amber-500", label: "text-amber-700" },
  stock: { rail: "bg-blue-500", label: "text-blue-700" },
  discount: { rail: "bg-cyan-500", label: "text-cyan-700" },
} as const;

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
  discounts: string[];
};

type FormErrors = Partial<Record<keyof ProductFormData, string>>;

/** "812 KB" / "1.4 MB" — shown next to the stated upload limit. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

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
  discounts: [],
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
        checked ? "bg-blue-600" : "bg-slate-200"
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

type Step = "details" | "options" | "variants";

const STEPS: { id: Step; label: string }[] = [
  { id: "details", label: "Product" },
  { id: "options", label: "Options" },
  { id: "variants", label: "Pricing" },
];

/**
 * Where you are in the variant flow. Steps already behind you are buttons —
 * going back a page should not mean hunting for the footer.
 */
function StepBar({
  step,
  onStep,
  canPrice,
}: {
  step: Step;
  onStep: (step: Step) => void;
  /** Pricing is only reachable once the options produce combinations. */
  canPrice: boolean;
}) {
  const current = STEPS.findIndex((s) => s.id === step);

  return (
    <nav aria-label="Product form steps" className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isCurrent = i === current;
        // Options is always open — the bar is only rendered once variants are
        // on. Pricing waits until the options actually generate rows.
        const reachable =
          i < current ||
          s.id === "options" ||
          (s.id === "variants" && canPrice);

        return (
          <div key={s.id} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            )}
            <button
              type="button"
              disabled={isCurrent || !reachable}
              onClick={() => onStep(s.id)}
              aria-current={isCurrent ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[12px] font-semibold transition ${
                isCurrent
                  ? "bg-blue-50/90 text-cyan-700 ring-1 ring-inset ring-blue-100"
                  : reachable
                    ? "text-slate-500 hover:bg-slate-100"
                    : "text-slate-300"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCurrent
                    ? "bg-cyan-600 text-white"
                    : i < current
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < current ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

/** Section heading — an eyebrow with an optional right-hand note. */
function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {title}
        </h3>
        {note && <span className="text-[11px] text-slate-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** Label + control + error, with an optional domain rail on the label. */
function Field({
  label,
  domain,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  domain?: keyof typeof DOMAIN;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        {domain && (
          <span
            className={`h-3 w-[3px] rounded-full ${DOMAIN[domain].rail}`}
            aria-hidden="true"
          />
        )}
        <label
          className={`text-[11px] font-medium uppercase tracking-[0.06em] ${
            domain ? DOMAIN[domain].label : "text-slate-400"
          }`}
        >
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full h-9 rounded-lg border px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:border-transparent transition";
const inputClass = `${inputBase} border-slate-200 focus:ring-blue-500`;
const inputErrorClass = `${inputBase} border-rose-300 focus:ring-rose-400`;

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  initialName?: string;
  onSuccess?: (product: Product) => void;
  /**
   * The account is on Free and has used every product it allows.
   *
   * Passed only by the add flow. Editing an existing product is never blocked
   * — the limit is on how many products exist, and an edit does not add one.
   */
  limitReached?: boolean;
}

export default function ProductFormModal({
  open,
  onClose,
  product,
  initialName,
  onSuccess,
  limitReached = false,
}: ProductFormModalProps) {
  const { currency } = useCurrency();

  const isEditMode = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories = [] } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const { data: discounts = [] } = useDiscounts();

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#60a5fa");

  // ── Variants ──
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>(
    {},
  );
  const [step, setStep] = useState<Step>("details");

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
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image must be under 1MB");
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
        discounts: product.discounts ?? [],
      });
      setErrors({});
      setSubmitError(null);
      setImageFile(null);
      setImagePreview(product.image ?? null);

      // Rebuild the editor from the option groups and their saved rows.
      const loadedOptions: VariantOption[] = (product.options ?? []).map(
        (o) => ({ id: o.id, title: o.title, values: o.values ?? [] }),
      );
      const loadedRows: VariantRow[] = (product.variants ?? []).map((v) => ({
        key: rowKey(v.optionValues),
        id: v.id,
        optionValues: v.optionValues,
        isAvailable: v.isAvailable ?? true,
        costPrice: v.costPrice ?? 0,
        price: v.price ?? 0,
        inStock: v.inStock ?? 0,
        lowStock: v.lowStock ?? 0,
      }));
      setHasVariants(loadedRows.length > 0);
      setOptions(loadedOptions);
      setVariantRows(
        loadedOptions.length > 0
          ? buildVariantRows(loadedOptions, loadedRows)
          : loadedRows,
      );
      setVariantErrors({});
      setStep("details");
    } else if (!product && open) {
      setForm({ ...INITIAL_FORM, name: initialName ?? "" });
      setErrors({});
      setSubmitError(null);
      setImageFile(null);
      setImagePreview(null);
      setHasVariants(false);
      setOptions([]);
      setVariantRows([]);
      setVariantErrors({});
      setStep("details");
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
    setSubmitError(null);
    setShowNewCategory(false);
    setNewCategoryName("");
    setNewCategoryColor("#60a5fa");
    setImageFile(null);
    setImagePreview(null);
    setHasVariants(false);
    setOptions([]);
    setVariantRows([]);
    setVariantErrors({});
    setStep("details");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Validation ──
  /**
   * Returns the page the first problem is on, so a failed save can take the
   * user to it — an error on a page they cannot see is a dead end.
   */
  const validate = (): { ok: boolean; step?: Step } => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (form.price < 0) e.price = "Price cannot be negative.";
    if (form.costPrice < 0) e.costPrice = "Cost price cannot be negative.";
    // Stock lives on the variants when there are any, so the parent's own
    // stock fields aren't in play.
    if (form.usesStocks && !hasVariants) {
      if (form.inStock < 0) e.inStock = "In stock cannot be negative.";
      if (form.lowStock < 0) e.lowStock = "Low stock cannot be negative.";
      if (form.lowStock > form.inStock)
        e.lowStock = "Low stock cannot exceed in stock.";
    }

    const ve: Record<string, string> = {};
    if (hasVariants) {
      const named = options.filter((o) => o.title.trim() && o.values.length);
      if (named.length === 0) {
        e.name = e.name ?? undefined;
        toast.error("Give each option a name and at least one value");
        setErrors(e);
        setVariantErrors({});
        return { ok: false, step: "options" };
      }

      for (const row of variantRows) {
        if (row.price < 0 || row.costPrice < 0) {
          ve[row.key] = "Price and cost cannot be negative.";
        } else if (form.usesStocks) {
          // Stock is only in play while the product tracks it.
          if (row.inStock < 0 || row.lowStock < 0) {
            ve[row.key] = "Stock values cannot be negative.";
          } else if (row.lowStock > row.inStock) {
            ve[row.key] = "Low stock cannot exceed in stock.";
          }
        }
      }
    }

    setErrors(e);
    setVariantErrors(ve);

    if (Object.keys(e).length > 0) return { ok: false, step: "details" };
    if (Object.keys(ve).length > 0) return { ok: false, step: "variants" };
    return { ok: true };
  };

  const handleSave = async () => {
    setSubmitError(null);
    const check = validate();
    if (!check.ok) {
      if (check.step) setStep(check.step);
      return;
    }

    // If user is creating a new category inline, create it first
    let categoryId = form.categoryId;
    if (showNewCategory && newCategoryName.trim()) {
      try {
        const newCat = await createCategoryMutation.mutateAsync({
          name: newCategoryName.trim(),
          color: newCategoryColor.replace("#", ""),
        });
        categoryId = newCat._id;
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to create category",
        );
        return;
      }
    }

    /**
     * Variants go over the wire as flat multipart keys, exactly as the API
     * expects them:
     *
     *   options[0][title]                  Size
     *   options[0][values][0]              small
     *   variantItems[0][optionValues][0]   small
     *   variantItems[0][optionValues][1]   cherry
     *   variantItems[0][price]             80
     *
     * Building the flat keys here rather than a nested object matters: the
     * request carries an image File, so it's FormData, and a nested object
     * appended to FormData stringifies to "[object Object]".
     */
    const variantFields: Record<string, string> = {};

    if (hasVariants) {
      options
        .filter((o) => o.title.trim() && o.values.length > 0)
        .forEach((option, i) => {
          variantFields[`options[${i}][title]`] = option.title.trim();
          option.values.forEach((value, j) => {
            variantFields[`options[${i}][values][${j}]`] = value;
          });
        });

      variantRows.forEach((row, i) => {
        row.optionValues.forEach((value, j) => {
          variantFields[`variantItems[${i}][optionValues][${j}]`] = value;
        });
        variantFields[`variantItems[${i}][isAvailable]`] = String(
          row.isAvailable,
        );
        variantFields[`variantItems[${i}][price]`] = String(row.price);
        variantFields[`variantItems[${i}][costPrice]`] = String(row.costPrice);

        // Stock only while the product tracks it.
        if (form.usesStocks) {
          variantFields[`variantItems[${i}][inStock]`] = String(row.inStock);
          variantFields[`variantItems[${i}][lowStock]`] = String(row.lowStock);
        }
      });
    }

    // With variants, price, cost and stock live on the rows — the parent
    // reports zeros, which is what the API's own payload sends.
    const parentPrice = hasVariants ? 0 : form.price;
    const parentCostPrice = hasVariants ? 0 : form.costPrice;
    const parentInStock = hasVariants ? 0 : form.inStock;
    const parentLowStock = hasVariants ? 0 : form.lowStock;

    // `mutateAsync` rejects on failure and both `onError` callbacks were
    // commented out, so a failed save previously surfaced nothing at all.
    try {
      if (isEditMode && product) {
        await updateMutation.mutateAsync(
          {
            productId: product.id,
            fields: {
              name: form.name,
              price: parentPrice,
              costPrice: parentCostPrice,
              description: form.description,
              isTaxable: form.isTaxable,
              usesStocks: form.usesStocks,
              inStock: parentInStock,
              lowStock: parentLowStock,
              soldBy: "each",
              categories: categoryId,
              image: imageFile,
              discounts: form.discounts,
              discountType: "applyEverytime",
              ...variantFields,
            },
          },
          {
            onSuccess: () => {
              // toast.success(`Product "${form.name}" updated`);
              resetForm();
              onClose();
            },
            // onError: (err) => {
            //   toast.error(`Update failed: ${err.message}`);
            // },
          },
        );
      } else {
        const payload: Record<string, unknown> = {
          name: form.name,
          price: parentPrice,
          costPrice: parentCostPrice,
          description: form.description,
          isTaxable: form.isTaxable,
          usesStocks: form.usesStocks,
          soldBy: "each",
          categories: categoryId,
          image: imageFile,
          discounts: form.discounts,
          discountType: "applyEverytime",
        };
        // The parent's own counters are sent as 0 alongside variants, matching
        // the API payload.
        if (form.usesStocks) {
          payload.inStock = parentInStock;
          payload.lowStock = parentLowStock;
        }
        Object.assign(payload, variantFields);

        await createMutation.mutateAsync(payload, {
          onSuccess: (result) => {
            toast.success(`Product "${result.name}" created`);
            onSuccess?.(result);
            resetForm();
            onClose();
          },
          // onError: (err) => {
          //   toast.error(`Create failed: ${err.message}`);
          // },
        });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Failed to update product"
            : "Failed to create product",
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const symbol = formatCurrencySymbolOnly(currency.symbol);

  // The chrome follows the page: the header says where you are, not what the
  // modal was opened for.
  const HEADINGS: Record<Step, { title: string; subtitle: string }> = {
    details: {
      title: isEditMode ? "Update product" : "Create product",
      subtitle: isEditMode
        ? "Change this product's details, pricing and stock."
        : "Add a product with its pricing, image and stock.",
    },
    options: {
      title: "Variant options",
      subtitle: "Name each option and list the values it can take.",
    },
    variants: {
      title: "Variant pricing",
      subtitle: "Set price, cost and stock for every combination.",
    },
  };
  const heading = HEADINGS[step];

  const namedOptions = usableOptions(options);
  /** Pricing has something to price only once the options generate rows. */
  const canPrice = namedOptions.length > 0 && variantRows.length > 0;
  const variantErrorCount = Object.keys(variantErrors).length;

  // Live margin — both figures are on screen, so show what they add up to.
  const margin = form.price - form.costPrice;
  const marginPct =
    form.costPrice > 0 ? Math.round((margin / form.costPrice) * 100) : null;

  /**
   * The Free plan is full.
   *
   * Shown in place of the form rather than as a banner above it: a form the
   * user can fill in and then not save is worse than no form at all. Every
   * hook above has already run, so this return is safe to take conditionally.
   */
  if (limitReached) {
    return (
      <ModalShell
        open={open}
        onClose={onClose}
        title="Product limit reached"
        subtitle={`The Free plan includes ${FREE_PRODUCT_LIMIT} products.`}
        icon={Package}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl px-5 py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Close
            </button>
            <Link
              href="/subscriptions"
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-blue-700"
            >
              View plans
            </Link>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="space-y-1.5 text-[13px] leading-relaxed text-amber-900">
            <p>
              You have used all{" "}
              <span className="font-semibold">{FREE_PRODUCT_LIMIT}</span>{" "}
              products your Free plan allows, so a new one cannot be added.
            </p>
            <p className="text-amber-800/90">
              Upgrading lifts the limit. Nothing you already have is affected —
              your products, their variants and their stock stay exactly as they
              are, and you can keep editing them.
            </p>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
          Variants do not count toward the limit — only base products do. If a
          new line is a size or a flavour of something you already sell, add it
          as a variant of that product instead.
        </p>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      busy={isPending}
      title={heading.title}
      subtitle={heading.subtitle}
      icon={Package}
      maxWidth="max-w-5xl"
      bodyMaxHeight="max-h-[78vh]"
      bodyMinHeight="min-h-[78vh]"
      footer={
        <div className="space-y-3 absolute bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-6 py-4">
          {/* Server-side failure for the whole submit — sits by the Save
              button so the reason is where the retry is. Per-field validation
              still renders under its own control. */}
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5"
            >
              <AlertCircle size={14} className="mt-px shrink-0 text-rose-500" />
              <p className="text-[12px] font-medium text-rose-700">
                {submitError}
              </p>
            </div>
          )}

          {/* Saving belongs to the product page. The variant pages carry a
              Back / Done pair instead, so there is no way to save from a page
              whose own validation has not been seen. */}
          {step === "details" ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {isPending
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                    ? "Update product"
                    : "Save product"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                {step === "options"
                  ? canPrice
                    ? `${variantRows.length} combination${
                        variantRows.length > 1 ? "s" : ""
                      } ready to price`
                    : "Name an option and add at least one value."
                  : "Nothing is saved until you save the product."}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setStep(step === "variants" ? "options" : "details")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStep(step === "options" ? "variants" : "details")
                  }
                  disabled={step === "options" && !canPrice}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      }
    >
      {step !== "details" && (
        <div className="space-y-5">
          <StepBar step={step} onStep={setStep} canPrice={canPrice} />

          {step === "options" ? (
            <VariantOptionsEditor
              options={options}
              rows={variantRows}
              onOptionsChange={setOptions}
              onRowsChange={setVariantRows}
            />
          ) : (
            <VariantRowsEditor
              options={options}
              rows={variantRows}
              currencySymbol={symbol}
              showStock={form.usesStocks}
              errors={variantErrors}
              onRowsChange={setVariantRows}
            />
          )}
        </div>
      )}

      <div className={`space-y-7 ${step === "details" ? "" : "hidden"}`}>
        {hasVariants && (
          <StepBar step={step} onStep={setStep} canPrice={canPrice} />
        )}

        {/* ── Image ── */}
        <Section title="Image">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Product"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon size={22} className="text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Upload size={13} />
                  {imagePreview ? "Change image" : "Upload image"}
                </button>
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                  >
                    <X size={13} />
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1.5 ml-1.5 text-[11px] text-slate-400">
                PNG or JPG, up to 1MB.
              </p>

              {imageFile && (
                <p className="mt-1.5 ml-1.5 flex items-baseline gap-1.5 text-[11px]">
                  <span
                    className="min-w-0 truncate font-medium text-slate-600"
                    title={imageFile.name}
                  >
                    {imageFile.name}
                  </span>
                  <span className="shrink-0 text-slate-400">
                    ({formatFileSize(imageFile.size)})
                  </span>
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Details ── */}
        <Section title="Details">
          <div className="space-y-3">
            <Field label="Product name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Popcorn"
                className={errors.name ? inputErrorClass : inputClass}
              />
            </Field>

            <Field label="Category">
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
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryName("");
                        setNewCategoryColor("#60a5fa");
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
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
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {createCategoryMutation.isPending
                        ? "Creating..."
                        : "Create & select"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectMenu
                      value={form.categoryId}
                      options={[
                        { value: "", label: "No category" },
                        ...categories.map((cat) => ({
                          value: cat._id,
                          label: cat.name,
                        })),
                      ]}
                      onChange={(v) => set("categoryId", v)}
                      placeholder="No category"
                      className="w-full"
                      triggerClassName="h-9 border border-slate-200 rounded-lg"
                      capitalize={false}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    title="Create new category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short description..."
                rows={2}
                className={`${inputClass} h-auto resize-none py-2`}
              />
            </Field>
          </div>
        </Section>

        {/* ── Pricing ── */}
        <Section
          title="Pricing"
          note={
            !hasVariants && marginPct !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                  margin >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {margin >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {symbol}
                {Math.abs(margin).toLocaleString()} margin ({marginPct}%)
              </span>
            ) : undefined
          }
        >
          {hasVariants && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-cyan-700">
              Each variant carries its own price and cost, so these are set per
              row below.
            </p>
          )}

          <div
            className={`grid grid-cols-2 gap-3 ${
              hasVariants ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Field label="Selling price" domain="price" error={errors.price}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
                  {symbol}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set("price", Number(e.target.value))}
                  className={`${errors.price ? inputErrorClass : inputClass} pl-9 tabular-nums`}
                  placeholder="0"
                />
              </div>
            </Field>

            <Field label="Cost price" domain="cost" error={errors.costPrice}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
                  {symbol}
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.costPrice}
                  onChange={(e) => set("costPrice", Number(e.target.value))}
                  className={`${errors.costPrice ? inputErrorClass : inputClass} pl-9 tabular-nums`}
                  placeholder="0"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Discounts ── */}
        {/* One list, selected state on the row. The separate "Applied
              discounts" summary listed the same items a second time. */}
        <Section
          title="Discounts"
          note={
            form.discounts.length > 0
              ? `${form.discounts.length} selected`
              : undefined
          }
        >
          {discounts.length === 0 ? (
            <p className="text-[13px] text-slate-400">
              No discounts yet. Create one below.
            </p>
          ) : (
            <div className="max-h-44 space-y-1.5 overflow-y-auto -mr-1 pr-1">
              {discounts.map((d) => {
                const isSelected = form.discounts.includes(d._id);
                return (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() =>
                      set(
                        "discounts",
                        isSelected
                          ? form.discounts.filter((x) => x !== d._id)
                          : [...form.discounts, d._id],
                      )
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-[13px] transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50/60"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-3.5 w-1 shrink-0 rounded-full ${
                          isSelected ? DOMAIN.discount.rail : "bg-slate-200"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-slate-800">
                        {d.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                        {d.type === "percentage"
                          ? `${d.rate}% off`
                          : `${symbol}${d.rate} off`}
                      </span>
                    </span>

                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <CreateDiscountDialog />
          </div>
        </Section>

        {/* ── Tax & stock ── */}
        <Section title="Tax & stock">
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-slate-800">
                  Taxable
                </p>
                <p className="text-[11px] text-slate-400">
                  Apply tax to this product
                </p>
              </div>
              <Toggle
                checked={form.isTaxable}
                onChange={(v) => set("isTaxable", v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-slate-800">
                  Track stock
                </p>
                <p className="text-[11px] text-slate-400">
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

            {/* Stock fields live inside the same card, so turning the toggle
                  on extends it rather than opening a detached block. */}
            {form.usesStocks && hasVariants && (
              <div className="px-4 py-3">
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-cyan-700">
                  Stock is counted per variant, in the section below.
                </p>
              </div>
            )}

            {form.usesStocks && !hasVariants && (
              <div className="space-y-3 px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="In stock" domain="stock" error={errors.inStock}>
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
                      className={`${
                        errors.inStock ? inputErrorClass : inputClass
                      } tabular-nums`}
                      placeholder="e.g. 50"
                    />
                  </Field>

                  <Field
                    label="Low stock alert"
                    domain="stock"
                    error={errors.lowStock}
                    hint={
                      !errors.lowStock &&
                      form.lowStock > 0 &&
                      form.lowStock <= 5 ? (
                        <span className="text-amber-600">
                          Alerts when stock reaches {form.lowStock}
                        </span>
                      ) : undefined
                    }
                  >
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
                      className={`${
                        errors.lowStock ? inputErrorClass : inputClass
                      } tabular-nums ${
                        !errors.lowStock &&
                        form.lowStock > 0 &&
                        form.lowStock <= form.inStock &&
                        form.lowStock <= 5
                          ? "border-amber-300 focus:ring-amber-400"
                          : ""
                      }`}
                      placeholder="e.g. 5"
                    />
                  </Field>
                </div>

                <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                  The inventory page charts stock against a 5,000-unit scale.
                  You can still hold more than that.
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* ── Variants ── */}
        <Section
          title="Variants"
          note={
            hasVariants && variantRows.length > 0
              ? `${variantRows.length} combination${variantRows.length > 1 ? "s" : ""}`
              : undefined
          }
        >
          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 h-3.5 w-1 shrink-0 rounded-full bg-cyan-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[13px] font-medium text-slate-800">
                    Sell in variants
                  </p>
                  <p className="text-[11px] text-slate-400">
                    For different sizes, colours or other options
                  </p>
                </div>
              </div>
              <Toggle
                checked={hasVariants}
                onChange={(v) => {
                  setHasVariants(v);
                  if (v) {
                    if (options.length === 0) {
                      // Start with one empty option so there's somewhere to type.
                      setOptions([
                        { id: crypto.randomUUID(), title: "", values: [] },
                      ]);
                      setVariantRows([]);
                    }
                    // Straight through to the options page — that is where the
                    // work is, and this page stays a page.
                    setStep("options");
                  } else {
                    setVariantErrors({});
                  }
                }}
              />
            </div>

            {/* The editors live on their own pages; what stays here is a
                summary of what they produced and the way back into them. */}
            {hasVariants && (
              <div className="space-y-3 border-t border-slate-100 p-4">
                {namedOptions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {namedOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-baseline gap-1.5"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                          {option.title}
                        </span>
                        <span className="text-[12px] capitalize text-slate-600">
                          {option.values.join(" · ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">
                    No options yet — add one to generate variants.
                  </p>
                )}

                {variantErrorCount > 0 && (
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {variantErrorCount} variant
                    {variantErrorCount > 1 ? "s need" : " needs"} fixing on the
                    pricing page.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("options")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Edit options
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("variants")}
                    disabled={!canPrice}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-cyan-700 transition hover:bg-blue-100 disabled:opacity-40"
                  >
                    Price {variantRows.length} variant
                    {variantRows.length === 1 ? "" : "s"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </ModalShell>
  );
}
