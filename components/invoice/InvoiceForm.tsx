"use client";

import { useDiscounts } from "@/hooks/useDiscounts";
import { useCreateTicket, useUpdateTicket } from "@/hooks/useTickets";
import { useTaxes } from "@/hooks/useTaxes";
import { useProductsList } from "@/hooks/useProductsList";

import { Customer } from "@/lib/types/customer";
import { InvoiceItem } from "@/lib/types/invoice";
import { Product } from "@/lib/types/product";
import { CreateTicketInput } from "@/lib/types/ticket";
import {
  updateCreditItems,
  type CreditItem,
  type CreditPayment,
} from "@/services/apiCredit.client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody } from "@/components/ui/table";

import CustomerSelector from "./CustomerSelector";
import AddInvoiceHeader from "./AddInvoiceHeader";
import InvoiceItemsSelector from "./InvoiceItemsSelector";
import InvoiceDiscountCreate from "./InvoiceDiscountCreate";
import InvoiceTaxCreate from "./InvoiceTaxCreate";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

interface InvoiceFormProps {
  initialData?: any;
  isEditMode?: boolean;
  invoiceNumber?: string;
  // ── Credit-invoice support ──
  isCreditInvoice?: boolean;
  creditId?: string;
  creditItems?: CreditItem[];
  creditPaymentHistory?: CreditPayment[];
}

const DEFAULT_ITEM: Omit<InvoiceItem, "id"> = {
  productId: "",
  name: "",
  description: "",
  quantity: 1,
  price: 0,
  discounts: [],
  taxes: [],
  isTaxable: false,
};

interface CustomDiscount {
  id: string;
  type: "fixed" | "percentage";
  value: number;
}

// ── Raw-payload normalisers ───────────────────────────────────────────────
// The ticket API and the update payload disagree on two field names. Both
// mismatches are isolated here so the rest of the form only sees InvoiceItem.

/**
 * The variant id on a FETCHED item lives under `variantItems.variant`, while
 * the UPDATE payload expects it under `variantItems._id`. Reading the wrong
 * key is what silently dropped variant data on edit. Every spelling seen in
 * the wild is accepted here so a shape change can't break the round-trip.
 */
function rawVariantId(rawVariantItems: any): string | undefined {
  if (!rawVariantItems) return undefined;
  return (
    rawVariantItems.variant ??
    rawVariantItems._id ??
    rawVariantItems.variantId ??
    rawVariantItems.id ??
    undefined
  );
}

/**
 * A fetched discount is a subdocument: `_id` is the subdocument's own id and
 * `discount` holds the master discount id that `masterDiscounts` is keyed by.
 * Taking `_id` here means no discount ever matches on edit.
 */
function rawDiscountIds(rawDiscounts: any[] | undefined): string[] {
  return (rawDiscounts ?? [])
    .map((d: any) => (typeof d === "string" ? d : (d?.discount ?? d?._id)))
    .filter(Boolean);
}

/** `items` is an array of GROUPS, each holding an `item` array. Flatten all. */
function flattenTicketItems(ticket: any): any[] {
  return (ticket?.items ?? []).flatMap((group: any) => group?.item ?? []);
}

/**
 * Build an InvoiceItem from a raw ticket item.
 *
 * Everything except QUANTITY is sourced from the live products list when the
 * product still exists — name, price, description, taxability and variant
 * details all reflect the product as it is today, not as it was invoiced.
 * Quantity, and the discounts the user actually applied, come from the ticket.
 */
function mapRawItem(raw: any, products: Product[]): InvoiceItem {
  const quantity = raw.quantity ?? 1;
  const discounts = rawDiscountIds(raw.discounts);
  const product = products.find((p) => p.id === raw.product);

  // Product no longer in the list (custom or deleted) — keep what was stored.
  if (!product) {
    const storedVariantId = rawVariantId(raw.variantItems);
    return {
      id: raw._id ?? crypto.randomUUID(),
      productId: raw.product ?? "",
      name: raw.productName ?? "",
      description: raw.description ?? "",
      quantity,
      price: raw.unitPrice ?? 0,
      discounts,
      taxes: [],
      isTaxable: raw.isTaxable ?? false,
      ...(storedVariantId
        ? {
            variantId: storedVariantId,
            variantLabel: raw.variantItems?.name ?? "",
            variantItems: {
              _id: storedVariantId,
              name: raw.variantItems?.name ?? "",
              unitPrice: raw.variantItems?.unitPrice ?? raw.unitPrice ?? 0,
              quantity,
              costPrice: raw.variantItems?.costPrice ?? 0,
            },
          }
        : {}),
    };
  }

  const variantId = rawVariantId(raw.variantItems);
  const variant = variantId
    ? product.variants?.find((v) => v.id === variantId)
    : undefined;

  // Variant recorded on the ticket but since removed from the product — keep
  // the stored snapshot so the line still round-trips through the update.
  if (variantId && !variant) {
    const label = raw.variantItems?.name ?? "";
    return {
      id: raw._id ?? crypto.randomUUID(),
      productId: product.id,
      name: raw.productName ?? product.name,
      description: label,
      quantity,
      price: raw.variantItems?.unitPrice ?? raw.unitPrice ?? 0,
      discounts,
      taxes: [],
      isTaxable: raw.isTaxable ?? false,
      variantId,
      variantLabel: label,
      variantItems: {
        _id: variantId,
        name: label,
        unitPrice: raw.variantItems?.unitPrice ?? raw.unitPrice ?? 0,
        quantity,
        costPrice: raw.variantItems?.costPrice ?? 0,
      },
    };
  }

  if (variant) {
    const label = variant.optionValues?.join(" · ") ?? "";
    return {
      id: raw._id ?? crypto.randomUUID(),
      productId: product.id,
      name: `${product.name} (${label})`,
      description: label,
      quantity,
      price: variant.price,
      discounts,
      taxes: [],
      isTaxable: product.isTaxable ?? raw.isTaxable ?? false,
      variantId: variant.id,
      variantLabel: label,
      variantItems: {
        _id: variant.id,
        name: label,
        unitPrice: variant.price,
        quantity,
        costPrice: variant.costPrice ?? 0,
      },
    };
  }

  // Standard product
  return {
    id: raw._id ?? crypto.randomUUID(),
    productId: product.id,
    name: product.name,
    description: product.description ?? raw.description ?? "",
    quantity,
    price: product.price,
    discounts,
    taxes: [],
    isTaxable: product.isTaxable ?? raw.isTaxable ?? false,
  };
}

// ── Helper: map a credit item (from the credit detail API) to InvoiceItem ──
function mapCreditItem(item: CreditItem): InvoiceItem {
  const raw = item as any;
  const variantId = rawVariantId(raw.variantItems);
  const quantity = item.quantity ?? 1;

  return {
    id: item._id ?? crypto.randomUUID(),
    productId: item.product ?? "",
    name: item.productName ?? "",
    description: "",
    quantity,
    price: item.unitPrice ?? 0,
    discounts: rawDiscountIds(item.discounts as any[]),
    taxes: [],
    isTaxable: item.isTaxable ?? false,
    // Preserve variant info when present so it round-trips to the credit API.
    ...(variantId
      ? {
          variantId,
          variantLabel: raw.variantItems?.name ?? "",
          variantItems: {
            _id: variantId,
            name: raw.variantItems?.name ?? "",
            unitPrice: raw.variantItems?.unitPrice ?? item.unitPrice ?? 0,
            quantity: raw.variantItems?.quantity ?? quantity,
            costPrice: raw.variantItems?.costPrice ?? 0,
          },
        }
      : {}),
  };
}

export default function InvoiceForm({
  initialData,
  isEditMode,
  invoiceNumber,
  isCreditInvoice = false,
  creditId,
  creditItems = [],
  creditPaymentHistory = [],
}: InvoiceFormProps) {
  const router = useRouter();
  const { currency } = useCurrency();
  const { mutate: saveTicket, isPending: isCreating } = useCreateTicket();
  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket();
  const { data: products = [] } = useProductsList();
  const { data: masterDiscounts = [] } = useDiscounts();
  const { data: taxData } = useTaxes();

  // `updateCreditItems` is a plain promise with no pending flag of its own, so
  // without this the Save button stays live and a credit can be submitted twice.
  const [isSavingCredit, setIsSavingCredit] = useState(false);
  const isPending = isCreating || isUpdating || isSavingCredit;

  const tickets = initialData?.Tickets;

  // ── State — pre-filled from initialData in edit mode ─────────────────────

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    tickets
      ? ({
          // Use actual customer name if available, fallback to ticketName
          name: initialData?.customerName ?? tickets.ticketName ?? "",
          email: tickets.customerEmail ?? "",
          phone: tickets.phoneNumber ?? "",
        } as Customer)
      : null,
  );

  // UI only — the picker starts open when there's no customer yet.
  const [showCustomerPicker, setShowCustomerPicker] = useState(() => !tickets);

  // Invoice title is separate from customer name
  const [invoiceTitle, setInvoiceTitle] = useState(tickets?.ticketName ?? "");

  const [notes, setNotes] = useState(
    initialData?.ticket?.note?.split("|Invoice:")[0]?.trim() ?? "",
  );

  // Seed from the ticket immediately (products may not have loaded yet); the
  // effect below re-maps against the live product data once it arrives.
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (isCreditInvoice && creditItems.length > 0) {
      return creditItems.map(mapCreditItem);
    }
    const rawItems = flattenTicketItems(tickets);
    if (rawItems.length) return rawItems.map((raw) => mapRawItem(raw, []));
    return [{ id: crypto.randomUUID(), ...DEFAULT_ITEM }];
  });

  // Store raw ticket items to update with product details once products load
  const rawTicketItemsRef = useRef(flattenTicketItems(tickets));
  const hasUpdatedItemsFromProducts = useRef(false);

  // Re-map items against the live products list once it loads, so prices,
  // names and variant data reflect the product as it is now.
  useEffect(() => {
    // Credit invoices are seeded from the credit's own items — never clobber
    // them with the ticket's.
    if (isCreditInvoice) return;
    if (hasUpdatedItemsFromProducts.current || !products.length) return;

    const rawItems = rawTicketItemsRef.current;
    if (!rawItems?.length) return;

    setItems(rawItems.map((raw: any) => mapRawItem(raw, products)));
    hasUpdatedItemsFromProducts.current = true;
  }, [products, isCreditInvoice]);

  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [customDiscounts, setCustomDiscounts] = useState<CustomDiscount[]>(
    () => {
      // In edit mode, if the invoice has a stored discount amount and no
      // pre-defined discount ids, pre-fill a fixed-type custom discount.
      if (
        isEditMode &&
        !tickets?.discounts?.length &&
        (tickets?.discount ?? 0) > 0
      ) {
        return [
          {
            id: crypto.randomUUID(),
            type: "fixed" as const,
            value: tickets?.discount ?? 0,
          },
        ];
      }
      return [];
    },
  );

  // Active tax — surfaced from InvoiceTaxCreate
  const [activeTaxId, setActiveTaxId] = useState<string | null>(null);
  const [activeTaxRate, setActiveTaxRate] = useState<number>(0);

  // Grouped taxes are valid selections too — matching the add page.
  const activeTaxDetails =
    taxData?.taxes?.find((t) => t._id === activeTaxId) ??
    taxData?.groupedTaxes?.find((g: any) => g._id === activeTaxId) ??
    null;

  // ── Calculations ──────────────────────────────────────────────────────────

  const itemsSubtotal = items.reduce((sum, item) => {
    const rowRawTotal = item.quantity * item.price;
    const rowDiscount = item.discounts.reduce((dSum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return dSum;
      return (
        dSum +
        (d.type === "percentage"
          ? (rowRawTotal * d.rate) / 100
          : d.rate * item.quantity)
      );
    }, 0);
    return sum + (rowRawTotal - rowDiscount);
  }, 0);

  // Subtotal for taxable items only (after item-level discounts)
  const taxableSubtotal = items.reduce((sum, item) => {
    if (!item.isTaxable) return sum;
    const rowRawTotal = item.quantity * item.price;
    const rowDiscount = item.discounts.reduce((dSum, dId) => {
      const d = masterDiscounts.find((m) => m._id === dId);
      if (!d) return dSum;
      return (
        dSum +
        (d.type === "percentage"
          ? (rowRawTotal * d.rate) / 100
          : d.rate * item.quantity)
      );
    }, 0);
    return sum + Math.max(0, rowRawTotal - rowDiscount);
  }, 0);

  const masterDiscountValue = selectedDiscountIds.reduce((sum, id) => {
    const d = masterDiscounts.find((m) => m._id === id);
    if (!d) return sum;
    return (
      sum + (d.type === "percentage" ? (itemsSubtotal * d.rate) / 100 : d.rate)
    );
  }, 0);

  const customDiscountValue = customDiscounts.reduce((sum, d) => {
    if (d.type === "percentage") {
      return sum + (itemsSubtotal * d.value) / 100;
    }
    return sum + d.value;
  }, 0);

  const hasAnyDiscount =
    selectedDiscountIds.length > 0 || customDiscounts.length > 0;

  const globalDiscountValue = hasAnyDiscount
    ? masterDiscountValue + customDiscountValue
    : isEditMode
      ? (tickets?.discount ?? 0) // ← use stored discount amount in edit mode
      : 0;

  const afterDiscountTotal = Math.max(0, itemsSubtotal - globalDiscountValue);

  // Tax is calculated on taxable items subtotal (before global discounts),
  // matching the per-item tax pill display in InvoiceItemsSelector
  const totalTaxValue = (taxableSubtotal * activeTaxRate) / 100;
  const finalTotal = afterDiscountTotal + totalTaxValue;

  // ── Credit payment totals (credit invoices only) ─────────────────────────
  // Only payments with an actual amount paid count toward the deduction.
  const paidPayments = creditPaymentHistory.filter(
    (p) => (p.paymentAmount ?? 0) > 0,
  );
  const totalPaid = paidPayments.reduce(
    (sum, p) => sum + (p.paymentAmount ?? 0),
    0,
  );
  // New grand total on the form — the tax grand total minus what's already paid.
  const amountDueAfterPayments = Math.max(0, finalTotal - totalPaid);

  const formatPaymentDate = (raw: string) => {
    const d = new Date(raw.replace(" ", "T"));
    return isNaN(d.getTime())
      ? raw
      : d.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

  // Payments only render once there's something to deduct.
  const showPaymentHistory = isCreditInvoice && paidPayments.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleItemDiscountAdd = (itemId: string, discountId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discounts: [...new Set([...item.discounts, discountId])],
            }
          : item,
      ),
    );
  };

  const handleItemDiscountRemove = (itemId: string, discountId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discounts: item.discounts.filter((id) => id !== discountId),
            }
          : item,
      ),
    );
  };

  const handleDiscountSelect = (id: string) => {
    setSelectedDiscountIds((prev) => [...new Set([...prev, id])]);
  };

  const handleDiscountRemove = (id: string) => {
    setSelectedDiscountIds((prev) => prev.filter((d) => d !== id));
  };

  const handleCustomDiscountAdd = () => {
    setCustomDiscounts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "fixed", value: 0 },
    ]);
  };

  const handleCustomDiscountUpdate = (
    id: string,
    field: "type" | "value",
    value: string | number,
  ) => {
    setCustomDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleCustomDiscountRemove = (id: string) => {
    setCustomDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  /** The original raw ticket item a form row came from, if any. */
  const rawFor = (item: InvoiceItem): any =>
    rawTicketItemsRef.current.find((r: any) => r?._id && r._id === item.id);

  /**
   * Resolve the variant block for an outgoing item.
   *
   * Three independent sources, in order of freshness: the form item, its own
   * stored snapshot, then the raw ticket item. A variant line must never
   * degrade into a plain item just because one of them is missing — that is
   * exactly what made the update drop `variantItems`.
   */
  const buildVariantPayload = (item: InvoiceItem, product?: Product) => {
    console.log("ITEM:", item);
    console.log("PRODU:", product);
    const raw = rawFor(item);
    const variantId =
      item.variantId ??
      item.variantItems?._id ??
      rawVariantId(raw?.variantItems);
    console.log("VAR ID:", variantId);
    if (!variantId) return {};

    const variant = product?.variants?.find((v) => v.id === variantId);
    console.log("V:", variant);
    const name =
      item.variantLabel ||
      item.variantItems?.name ||
      variant?.optionValues?.join(" · ") ||
      "";

    return {
      // variantId,
      // variantLabel: name,
      variantItems: {
        // The update API keys the variant as `_id` (the fetch returns it as
        // `variantItems.variant`).
        _id: variantId,
        name,
        unitPrice:
          variant?.price ??
          item.variantItems?.unitPrice ??
          raw?.variantItems?.unitPrice ??
          item.price ??
          0,
        // Kept in step with the line quantity — they must not drift.
        quantity: item.quantity,
        costPrice:
          variant?.costPrice ??
          item.variantItems?.costPrice ??
          raw?.variantItems?.costPrice ??
          0,
      },
    };
  };

  /**
   * Discount objects in the shape the update endpoint expects: the master
   * discount's fields, plus `discount` holding the master id. When the
   * discount was already on this ticket, its existing subdocument `_id` is
   * reused so the backend updates that row instead of orphaning it.
   */
  const buildDiscountPayload = (item: InvoiceItem) => {
    const rawDiscounts: any[] = rawFor(item)?.discounts ?? [];

    return item.discounts
      .map((id) => {
        const master = masterDiscounts.find((m) => m._id === id);
        if (!master) return null;

        const existing = rawDiscounts.find(
          (d: any) => (d?.discount ?? d?._id) === id,
        );

        return {
          ...(master as object),
          discount: master._id,
          ...(existing?._id ? { _id: existing._id } : {}),
        };
      })
      .filter(Boolean);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0 || items.every((item) => !item.name)) {
      toast.error("Please add at least one item");
      return;
    }

    const filteredItems = items.filter(
      (item) => item.name && item.quantity > 0,
    );

    // ── Credit invoice: use the credit items API ────────────────────────────
    if (isCreditInvoice) {
      if (!creditId) {
        toast.error("Credit not found for this invoice");
        return;
      }

      const creditPayload = {
        items: filteredItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          const variantPayload = buildVariantPayload(item, product);
          return {
            id: item.productId || item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            isTaxable: item.isTaxable ?? false,
            ...("variantItems" in variantPayload
              ? { variantItems: variantPayload.variantItems }
              : {}),
          };
        }),
        taxId: activeTaxId ?? "",
        isExclusiveTaxEnabled: !!activeTaxId,
        isAddonTaxEnabled: false,
      };

      setIsSavingCredit(true);
      updateCreditItems(creditId, creditPayload)
        .then(() => {
          toast.success("Credit invoice updated");
          router.push(`/invoices/${invoiceNumber}`);
        })
        .catch((err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to update credit invoice",
          );
        })
        .finally(() => setIsSavingCredit(false));
      return;
    }

    // ── Normal invoice ──────────────────────────────────────────────────────
    const mappedItems = filteredItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      console.log("PRODUCDD:", product);
      const variantPayload = buildVariantPayload(item, product);
      console.log("VARRRR:", variantPayload);

      // A variant line prices off the variant, not the parent product.
      const unitPrice =
        (variantPayload as any).variantItems?.unitPrice ?? item.price;

      // Loud in dev when a line looks like a variant (parent has variants,
      // or the name is suffixed) but no variant id could be resolved.
      if (
        process.env.NODE_ENV !== "production" &&
        !(variantPayload as any).variantItems &&
        product?.variants?.length
      ) {
        console.warn(
          `[InvoiceForm] "${item.name}" belongs to a product with variants but is being sent without variantItems.`,
          { item, raw: rawFor(item) },
        );
      }

      return {
        id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice,
        note: null,
        isTaxable: item.isTaxable ?? false,
        discounts: buildDiscountPayload(item),
        ...variantPayload,
      };
    });

    console.log("MAP ITEMS:", mappedItems);

    const ticketData: CreateTicketInput = {
      ticketName: invoiceTitle || selectedCustomer?.name || "Walk-in Customer",
      customerEmail: selectedCustomer?.email || "",
      phoneNumber: selectedCustomer?.phone || "",
      total: itemsSubtotal,
      discount: globalDiscountValue,
      totalDiscount: globalDiscountValue,
      grandTotal: finalTotal,
      taxId: activeTaxId,
      note: `${notes}${invoiceNumber ? `|Invoice: ${invoiceNumber}` : ""}`,
      items: mappedItems,
      isTaxExclusive: !!activeTaxId,
    };

    if (isEditMode && invoiceNumber) {
      updateTicket(
        { invoiceNumber, ticketData },
        {
          onSuccess: () => {
            router.push(`/invoices/${invoiceNumber}`);
          },
          onError: (err) => {
            toast.error(`Update failed: ${err.message}`);
          },
        },
      );
    } else {
      saveTicket(ticketData, {
        onSuccess: (response) => {
          const newId = response?.data?.ticket?.invoice;
          if (newId) router.push(`/invoices/${newId}`);
        },
        onError: (err) => {
          toast.error(`Save failed: ${err.message}`);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-50 p-6 md:p-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="md:text-3xl text-2xl font-bold text-gray-900">
            {isEditMode ? `Edit Invoice #${invoiceNumber}` : "New Invoice"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {isCreditInvoice && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                Credit
              </span>
            )}
            {isEditMode && tickets?.createdAt && (
              <p className="text-sm text-gray-400">
                Created at{" "}
                {new Date(tickets.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/invoices/${invoiceNumber}`)}
              className="border-gray-300 text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Saving..."}
              </>
            ) : isEditMode ? (
              <>
                <Save className="h-4 w-4" />
                Update Invoice
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save and Continue
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border-gray-200 border shadow-sm rounded-xl bg-white overflow-hidden">
        {/* ── Bill to + Invoice title ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-5 pt-5 border-b border-gray-100 pb-8">
          {/* Customer */}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Bill to
            </p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {selectedCustomer?.name || "No customer selected"}
            </p>
            {(selectedCustomer?.email || selectedCustomer?.phone) && (
              <p className="text-xs text-gray-500  tracking-wider  mt-0.5 truncate">
                {[selectedCustomer?.email, selectedCustomer?.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowCustomerPicker((v) => !v)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {showCustomerPicker
                ? "Cancel"
                : selectedCustomer
                  ? "Choose a different customer"
                  : "Choose a customer"}
            </button>

            {/* Existing selector — unchanged, just revealed on demand */}
            {showCustomerPicker && (
              <div className="mt-3">
                <CustomerSelector
                  value={selectedCustomer}
                  onCustomerSelect={(c) => {
                    setSelectedCustomer(c);
                    setShowCustomerPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Invoice title */}
          <div className="sm:justify-self-end w-full sm:max-w-xs">
            <Label
              htmlFor="invoiceTitle"
              className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1 block"
            >
              Invoice Title
            </Label>
            <Input
              className="hover:bg-blue-50 font-semibold px-3 h-9 text-sm w-full"
              id="invoiceTitle"
              placeholder="Invoice"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
            />
            {invoiceNumber && (
              <p className="text-[11px] text-gray-400 mt-1 sm:text-right">
                Invoice #{invoiceNumber}
              </p>
            )}
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="overflow-x-auto">
          <Table>
            <AddInvoiceHeader />
            <TableBody>
              <InvoiceItemsSelector
                products={products}
                items={items}
                onItemsChange={setItems}
                masterDiscounts={masterDiscounts}
                onAddDiscount={handleItemDiscountAdd}
                onRemoveDiscount={handleItemDiscountRemove}
                activeTax={
                  activeTaxId && activeTaxDetails
                    ? {
                        id: activeTaxId,
                        name: activeTaxDetails.name,
                        rate: activeTaxRate,
                      }
                    : null
                }
              />
            </TableBody>
          </Table>
        </div>

        {/* ── Discount ── */}
        <InvoiceDiscountCreate
          subtotal={itemsSubtotal}
          discountAmount={globalDiscountValue}
          masterDiscounts={masterDiscounts}
          selectedDiscountIds={selectedDiscountIds}
          onDiscountSelect={handleDiscountSelect}
          onDiscountRemove={handleDiscountRemove}
          customDiscounts={customDiscounts}
          onCustomDiscountAdd={handleCustomDiscountAdd}
          onCustomDiscountUpdate={handleCustomDiscountUpdate}
          onCustomDiscountRemove={handleCustomDiscountRemove}
        />

        {/* ── Tax ── */}
        <InvoiceTaxCreate
          subtotal={afterDiscountTotal}
          taxAmount={totalTaxValue}
          finalTotal={finalTotal}
          onActiveTaxChange={(taxId, rate) => {
            setActiveTaxId(taxId);
            setActiveTaxRate(rate);
          }}
        />

        {/* ── Payments received (credit invoices) ──
            Sits directly under the Grand Total and shares its right-aligned
            column, so payments read as a continuation of the totals rather
            than a separate panel. */}
        {showPaymentHistory && (
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="space-y-1.5 min-w-[320px] max-w-full">
                {paidPayments.map((p) => (
                  <div
                    key={p._id}
                    className="flex justify-between gap-8 text-xs text-gray-600 font-semibold  "
                  >
                    <span>
                      Payment on {formatPaymentDate(p.paymentDate)} using{" "}
                      {p.paymentMethod || "cash"}:
                    </span>
                    <span className="font-medium text-gray-800 tabular-nums shrink-0">
                      {formatCurrencySymbol(
                        p.paymentAmount ?? 0,
                        currency.symbol,
                        currency.locale,
                      )}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between gap-8 text-sm font-bold text-blue-600 border-t border-gray-100 pt-2 mt-1">
                  <span>Amount Due ({currency.code || "NPR"})</span>
                  <span className="tabular-nums shrink-0">
                    {formatCurrencySymbol(
                      amountDueAfterPayments,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        <div className="px-5 py-4 border-t border-gray-100">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Notes / Terms
          </label>
          <input
            className="w-full focus:outline-none text-sm text-gray-700 placeholder:text-gray-300 p-2 rounded-lg border border-transparent focus:border-gray-200 hover:border-gray-200 transition"
            placeholder="Enter notes or terms of service..."
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
