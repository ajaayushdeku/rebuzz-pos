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

// ── Product / variant lookup ──────────────────────────────────────────────
// `product.variants` is an OBJECT, not an array:
//
//   variants: { _id, productId, options: [...], variantItems: [ ... ] }
//
// The variants live in `variants.variantItems`, each keyed by `_id` — not
// `id`. So `product.variants.find(v => v.id === someId)` THROWS
// ("find is not a function"), and `products.find(p => p.id === someId)`
// silently matches nothing when the API only returns `_id`. Both lookups go
// through these helpers instead.

type NormalizedVariant = {
  id: string;
  optionValues: string[];
  price: number;
  inStock?: number;
  lowStock?: number;
  costPrice: number;
};

/** Find a product by id, accepting `id` or `_id`. */
function findProduct(
  products: Product[] | undefined | null,
  productId: string | undefined | null,
): Product | undefined {
  if (!productId) return undefined;
  return (products ?? []).find(
    (p) => p.id === productId || (p as any)._id === productId,
  );
}

/**
 * All variants of a product, flattened and normalized. Tolerates both the raw
 * API object and an already-flattened array, so this keeps working whether or
 * not `useProductsList` normalizes upstream.
 */
function getVariants(product: Product | undefined | null): NormalizedVariant[] {
  const source: any = product?.variants;
  if (!source) return [];

  const list: any[] = Array.isArray(source)
    ? source
    : Array.isArray(source.variantItems)
      ? source.variantItems
      : [];

  return list
    .map((raw: any) => {
      const id = raw?.id ?? raw?._id;
      if (!id) return null;
      return {
        id,
        optionValues: Array.isArray(raw.optionValues) ? raw.optionValues : [],
        price: raw.price ?? 0,
        inStock: raw.inStock,
        lowStock: raw.lowStock,
        costPrice: raw.costPrice ?? 0,
      };
    })
    .filter(Boolean) as NormalizedVariant[];
}

/** Find one variant by id, accepting `id` or `_id` on the stored side. */
function findVariant(
  product: Product | undefined | null,
  variantId: string | undefined | null,
): NormalizedVariant | undefined {
  if (!variantId) return undefined;
  return getVariants(product).find((v) => v.id === variantId);
}

/** Human label for a variant, e.g. "small · cherry". */
function variantLabel(variant: NormalizedVariant | undefined): string {
  return variant?.optionValues.join(" · ") ?? "";
}

/** Trailing parenthesised label from a stored name: "Jelly (s,m,l)" → "s,m,l". */
function labelFromName(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  const match = name.match(/\(([^()]*)\)\s*$/);
  return match ? match[1].trim() : undefined;
}

/**
 * The variant label as the API wants it: "small/cherry", not "small · cherry".
 *
 * The UI joins option values with " · " for readability; the payload uses
 * "/". Converting here rather than at the join site keeps the display format
 * intact and also normalises labels that arrive already stored in either
 * form.
 */
function toPayloadLabel(label: string | undefined | null): string {
  return (label ?? "").replace(/\s*·\s*/g, "/").trim();
}

/** Loose label compare — ignores case, spacing, and "·" vs "," separators. */
function labelKey(label: string): string {
  return label.toLowerCase().replace(/·/g, ",").replace(/\s+/g, "");
}

/**
 * Work out which variant a line refers to.
 *
 * Ids are tried first. When none survive — an invoice saved by an earlier
 * build dropped `variantItems`, so the server only kept "Coke (small ·
 * vanilla)" and a unit price — the variant is recovered from the product by
 * matching the name's trailing label, then by a uniquely-matching price.
 */
function resolveVariant(
  product: Product | undefined,
  opts: {
    variantId?: string;
    name?: string;
    label?: string;
    price?: number;
  },
): { variant?: NormalizedVariant; variantId?: string } {
  const variants = getVariants(product);

  // 1. An explicit id.
  if (opts.variantId) {
    return {
      variant: variants.find((v) => v.id === opts.variantId),
      variantId: opts.variantId,
    };
  }

  if (!variants.length) return {};

  // 2. The label, either stored directly or parsed off the name.
  const label = opts.label ?? labelFromName(opts.name);
  if (label) {
    const key = labelKey(label);
    const byLabel = variants.find((v) => labelKey(variantLabel(v)) === key);
    if (byLabel) return { variant: byLabel, variantId: byLabel.id };
  }

  // 3. A price only one variant carries — ambiguous matches are rejected.
  if (typeof opts.price === "number" && opts.price > 0) {
    const byPrice = variants.filter((v) => v.price === opts.price);
    if (byPrice.length === 1) {
      return { variant: byPrice[0], variantId: byPrice[0].id };
    }
  }

  return {};
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
 * The ticket-product group id the update endpoint needs as `ticketProductId`.
 *
 * Note this is the GROUP's `_id` (`Tickets.items[0]._id`) — NOT the inner
 * item's `_id`, which sits one level deeper at `items[0].item[0]._id`. They
 * look alike and sort next to each other, so it's easy to send the wrong one.
 */
function ticketProductIdOf(ticket: any): string | undefined {
  return ticket?.items?.[0]?._id ?? undefined;
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
  const product = findProduct(products, raw.product);

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

  const productId = product.id ?? (product as any)._id;
  const resolved = resolveVariant(product, {
    variantId: rawVariantId(raw.variantItems),
    name: raw.productName,
    label: raw.variantItems?.name,
    price: raw.unitPrice,
  });
  const { variant, variantId } = resolved;

  // Variant recorded on the ticket but since removed from the product — keep
  // the stored snapshot so the line still round-trips through the update.
  if (variantId && !variant) {
    const label = raw.variantItems?.name ?? "";
    return {
      id: raw._id ?? crypto.randomUUID(),
      productId,
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
    const label = variantLabel(variant);
    return {
      id: raw._id ?? crypto.randomUUID(),
      productId,
      // Rows show the decorated name so staff can tell variants apart; the
      // payload sends the base product name (see baseProductName below).
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
    productId,
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
/**
 * Build an InvoiceItem from a stored credit item.
 *
 * IMPORTANT: the credit API stores the DISCOUNTED unit price. Taking
 * `item.unitPrice` straight into `price` puts a net figure in the form's
 * price column, which then reads as though the product itself got cheaper —
 * and, because the credit payload sends list prices, would re-discount the
 * line on every save.
 *
 * So price comes from the live product (or its variant) whenever the product
 * still exists; only quantity and the applied discounts come from the credit.
 * Same rule as `mapRawItem` on the ticket side.
 */
function mapCreditItem(item: CreditItem, products: Product[]): InvoiceItem {
  const raw = item as any;
  const storedVariantId = rawVariantId(raw.variantItems);
  const quantity = item.quantity ?? 1;
  const discounts = rawDiscountIds(item.discounts as any[]);
  const product = findProduct(products, item.product);

  /** The stored snapshot — used until products load, and for gone products. */
  const stored: InvoiceItem = {
    id: item._id ?? crypto.randomUUID(),
    productId: item.product ?? "",
    name: item.productName ?? "",
    description: "",
    quantity,
    price: item.unitPrice ?? 0,
    discounts,
    taxes: [],
    isTaxable: item.isTaxable ?? false,
    // Preserve variant info when present so it round-trips to the credit API.
    ...(storedVariantId
      ? {
          variantId: storedVariantId,
          variantLabel: raw.variantItems?.name ?? "",
          variantItems: {
            _id: storedVariantId,
            name: raw.variantItems?.name ?? "",
            unitPrice: raw.variantItems?.unitPrice ?? item.unitPrice ?? 0,
            quantity: raw.variantItems?.quantity ?? quantity,
            costPrice: raw.variantItems?.costPrice ?? 0,
          },
        }
      : {}),
  };

  if (!product) return stored;

  const productId = product.id ?? (product as any)._id;
  const { variant, variantId } = resolveVariant(product, {
    variantId: storedVariantId,
    name: item.productName,
    label: raw.variantItems?.name,
    // Only reached when there's no id and no label. The stored price is net,
    // so this can mis-match on a discounted line — it's a last resort.
    price: item.unitPrice,
  });

  // Variant recorded on the credit but since removed from the product.
  if (variantId && !variant) return { ...stored, productId };

  if (variant) {
    const label = variantLabel(variant);
    return {
      id: stored.id,
      productId,
      name: `${product.name} (${label})`,
      description: label,
      quantity,
      // The variant's LIST price, not the credit's stored net price.
      price: variant.price,
      discounts,
      taxes: [],
      isTaxable: product.isTaxable ?? item.isTaxable ?? false,
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

  // Standard product — again the product's LIST price.
  return {
    id: stored.id,
    productId,
    name: product.name,
    description: product.description ?? "",
    quantity,
    price: product.price,
    discounts,
    taxes: [],
    isTaxable: product.isTaxable ?? item.isTaxable ?? false,
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
      return creditItems.map((c) => mapCreditItem(c, []));
    }
    const rawItems = flattenTicketItems(tickets);
    if (rawItems.length) return rawItems.map((raw) => mapRawItem(raw, []));
    return [{ id: crypto.randomUUID(), ...DEFAULT_ITEM }];
  });

  // Store raw ticket items to update with product details once products load
  const rawTicketItemsRef = useRef(flattenTicketItems(tickets));
  // Same, for a credit invoice's own items.
  const rawCreditItemsRef = useRef(creditItems);
  // Identifies the ticket-product group being updated.
  const ticketProductIdRef = useRef(ticketProductIdOf(tickets));

  /**
   * Ids of the lines that were ALREADY on the ticket (or credit) when this
   * form loaded. Captured once at mount, so rows added afterwards are never
   * mistaken for pre-existing ones.
   *
   * These two groups are sent differently — see `netUnitPrice`.
   */
  const existingItemIdsRef = useRef<Set<string>>(
    new Set<string>([
      ...flattenTicketItems(tickets)
        .map((r: any) => r?._id)
        .filter(Boolean),
      ...creditItems.map((c: any) => c?._id).filter(Boolean),
    ]),
  );
  const hasUpdatedItemsFromProducts = useRef(false);

  // Re-map items against the live products list once it loads, so prices,
  // names and variant data reflect the product as it is now.
  //
  // This matters most for credits: their stored unitPrice is the DISCOUNTED
  // figure, so without this pass the price column shows a net amount.
  useEffect(() => {
    if (hasUpdatedItemsFromProducts.current || !products.length) return;

    if (isCreditInvoice) {
      // Credit invoices re-map from the CREDIT's items, never the ticket's.
      const rawCredit = rawCreditItemsRef.current;
      if (!rawCredit?.length) return;

      setItems(rawCredit.map((c) => mapCreditItem(c, products)));
      hasUpdatedItemsFromProducts.current = true;
      return;
    }

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
   * Was this line already on the ticket when the form loaded?
   *
   * Existing lines were stored with the discount baked into their unit price,
   * so they go back the same way — net price, discounts flagged off. Lines
   * added during this edit have never been priced by the backend, so they go
   * out like a new ticket's: list price, discounts enabled, backend applies
   * them. Sending a new line as "already discounted" would silently drop the
   * discount; sending an existing line as "apply this" double-discounts it.
   *
   * This applies to the TICKET endpoint only — the credit endpoint always
   * takes list prices (see the credit payload in handleSave).
   */
  const isExistingItem = (item: InvoiceItem) =>
    existingItemIdsRef.current.has(item.id);

  /**
   * Per-unit discount for a line.
   *
   * A fixed discount is charged per unit (matching the row-total maths
   * above), so it comes off the unit price directly; a percentage comes off
   * proportionally.
   */
  const unitDiscountFor = (discountIds: string[], unitPrice: number) =>
    discountIds.reduce((sum, id) => {
      const d = masterDiscounts.find((m) => m._id === id);
      if (!d) return sum;
      return (
        sum + (d.type === "percentage" ? (unitPrice * d.rate) / 100 : d.rate)
      );
    }, 0);

  /**
   * List price minus the per-unit discount — a 91 variant with a "50 off"
   * discount becomes 41.
   *
   * Used only for lines ALREADY on the ticket, whose stored price is already
   * net. Those go out with `isEnabled: false` (see buildDiscountPayload) so
   * the backend doesn't subtract the discount a second time.
   *
   * Newly added lines, and every line on create, send the list price with
   * discounts enabled and let the backend do the arithmetic.
   */
  const netUnitPrice = (listPrice: number, discountIds: string[]) =>
    Math.max(0, listPrice - unitDiscountFor(discountIds, listPrice));

  /**
   * The BASE product name for the payload.
   *
   * Rows display "Coke (small · vanilla)" so staff can tell variants apart,
   * but the item carries the parent's name — the variant is identified by
   * `variantItems`. Falls back to stripping the trailing "(label)" when the
   * product isn't in the list.
   */
  const baseProductName = (item: InvoiceItem, product?: Product) => {
    if (product?.name) return product.name;
    const stripped = item.name?.replace(/\s*\([^()]*\)\s*$/, "").trim();
    return stripped || item.name || "";
  };

  /**
   * Resolve the variant block for an outgoing item.
   *
   * Ids come from the form item, its own stored snapshot, or the raw ticket
   * item; if none survive, the variant is recovered from the product by name
   * or price. A variant line must never degrade into a plain item.
   *
   * NOTE: discounts do NOT go in here. They sit at ITEM level for both plain
   * and variant lines — a variant inherits its parent product's discounts, so
   * one discounts array on the item covers both cases. A nested second copy
   * risks the backend applying it twice.
   */
  const buildVariantPayload = (
    item: InvoiceItem,
    product?: Product,
    /** Send the discounted price instead of the list price. */
    useNetPrice = false,
  ) => {
    const raw = rawFor(item);

    const { variant, variantId } = resolveVariant(product, {
      variantId:
        item.variantId ??
        item.variantItems?._id ??
        rawVariantId(raw?.variantItems),
      name: item.name ?? raw?.productName,
      label: item.variantLabel ?? item.variantItems?.name,
      price: item.price,
    });

    if (!variantId) return {};

    const name = toPayloadLabel(
      variantLabel(variant) ||
        item.variantLabel ||
        item.variantItems?.name ||
        raw?.variantItems?.name ||
        labelFromName(item.name) ||
        "",
    );

    const listPrice =
      variant?.price ??
      item.variantItems?.unitPrice ??
      raw?.variantItems?.unitPrice ??
      item.price ??
      0;

    // Only `variantItems` goes on the wire — the variant is identified there,
    // so top-level variantId / variantLabel would be redundant.
    return {
      variantItems: {
        // The update API keys the variant as `_id` (the fetch returns it as
        // `variantItems.variant`).
        _id: variantId,
        name,
        unitPrice: useNetPrice
          ? netUnitPrice(listPrice, item.discounts)
          : listPrice,
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
   * Discounts for the TICKET endpoint: the master discount's fields, plus
   * `discount` holding the master id. When the discount was already on this
   * ticket, its existing subdocument `_id` is reused so the backend updates
   * that row instead of orphaning it.
   */
  const buildDiscountPayload = (item: InvoiceItem, alreadyApplied = false) => {
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
          // When the unit price already has the discount taken off, the
          // discount is a RECORD of what was applied, not an instruction to
          // apply it — leaving these true makes the backend deduct twice.
          ...(alreadyApplied ? { isEnabled: false, isSelected: false } : {}),
        };
      })
      .filter(Boolean);
  };

  /**
   * Discounts for the CREDIT items endpoint — a narrower shape:
   *
   *   { _id, name, type, rate }
   *
   * `_id` here is the MASTER discount id, not a ticket subdocument id, and
   * there are no isEnabled / isSelected flags: the credit endpoint takes list
   * prices and applies the discounts itself. Applies to variant lines too — a
   * variant inherits its parent product's discounts.
   */
  const buildCreditDiscountPayload = (item: InvoiceItem) =>
    item.discounts
      .map((id) => {
        const master = masterDiscounts.find((m) => m._id === id);
        if (!master) return null;
        return {
          _id: master._id,
          name: master.name,
          type: master.type,
          rate: master.rate,
        };
      })
      .filter(Boolean) as Array<{
      _id: string;
      name: string;
      type: string;
      rate: number;
    }>;

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
          const product = findProduct(products, item.productId);
          // The credit endpoint takes LIST prices and applies the discounts
          // itself — unlike the ticket update, which wants the price already
          // net. So no netUnitPrice here, and no isEnabled:false flags.
          const variantPayload = buildVariantPayload(item, product, false);
          const discounts = buildCreditDiscountPayload(item);

          return {
            id: item.productId || item.id,
            name: baseProductName(item, product),
            quantity: item.quantity,
            unitPrice:
              (variantPayload as any).variantItems?.unitPrice ?? item.price,
            isTaxable: item.isTaxable ?? false,
            // Omitted entirely when the line has none, matching the API's own
            // payload rather than sending an empty array.
            ...(discounts.length > 0 ? { discounts } : {}),
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
      const product = findProduct(products, item.productId);
      // Decided per LINE, not per request: an edit can contain both lines the
      // backend has already priced and lines added just now.
      const alreadyPriced = isExistingItem(item);
      const variantPayload = buildVariantPayload(item, product, alreadyPriced);

      // A variant line prices off the variant, not the parent product.
      const unitPrice =
        (variantPayload as any).variantItems?.unitPrice ??
        (alreadyPriced ? netUnitPrice(item.price, item.discounts) : item.price);

      // Loud in dev when a line belongs to a product with variants but no
      // variant could be resolved — it's about to be sent as a plain item.
      if (
        process.env.NODE_ENV !== "production" &&
        !(variantPayload as any).variantItems &&
        getVariants(product).length > 0
      ) {
        console.warn(
          `[InvoiceForm] "${item.name}" belongs to a product with variants but no variant could be resolved.`,
          {
            item,
            raw: rawFor(item),
            availableVariants: getVariants(product).map((v) => ({
              id: v.id,
              label: variantLabel(v),
              price: v.price,
            })),
          },
        );
      }

      return {
        id: item.productId,
        // Base product name — the variant lives in `variantItems`.
        name: baseProductName(item, product),
        quantity: item.quantity,
        unitPrice,
        note: null,
        isTaxable: item.isTaxable ?? false,
        discounts: buildDiscountPayload(item, alreadyPriced),
        ...variantPayload,
      };
    });

    const ticketData: CreateTicketInput & { ticketProductId?: string } = {
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
      // Which ticket-product group this update targets. Only exists in edit
      // mode — a new ticket has no group yet.
      ...(ticketProductIdRef.current
        ? { ticketProductId: ticketProductIdRef.current }
        : {}),
    };

    if (isEditMode && invoiceNumber) {
      if (!ticketProductIdRef.current) {
        toast.error("This invoice is missing its ticket reference.");
        return;
      }

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
