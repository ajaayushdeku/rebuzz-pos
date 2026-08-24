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
  Credit,
  CreditDetail,
  updateCredit,
  updateCreditItems,
  type CreditItem,
  type CreditPayment,
} from "@/services/apiCredit.client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  credit?: Credit;
  creditDetails?: CreditDetail;
  creditId?: string;
  creditUserId?: string;
  creditItems?: CreditItem[];
  creditPaymentHistory?: CreditPayment[];
  // ── Full customer profile (fetched by the edit page) ──
  customerProfile?: Customer;
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

/**
 * Split a stored variant label back into its option values.
 *
 * Only "/" and "·" separate values — a comma does NOT. Option values can
 * legitimately contain commas ("red, blue ,pink" and "s,m,l" are each a
 * SINGLE value), so splitting on them would shatter one value into three.
 */
function optionValuesFromLabel(label: string | undefined | null): string[] {
  return (label ?? "")
    .split(/[/·]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * A comparable key for a set of option values.
 *
 * Case- and order-insensitive: "Small/Cherry" and "cherry · small" both key
 * to the same thing, so a reordered option group still matches.
 */
function optionKey(values: string[]): string {
  return values
    .map((v) => v.toLowerCase().replace(/\s+/g, " ").trim())
    .sort()
    .join("|");
}

/**
 * Work out which variant a line refers to.
 *
 * OPTION VALUES COME FIRST, not the id. Updating a product regenerates its
 * variant ids, so the id stored on an old ticket routinely points at nothing
 * — which is why variant lines kept falling back to their stored (already
 * discounted) price. The option values are what actually identify a variant
 * across edits: "small/cherry" is still small + cherry no matter how many
 * times the product has been saved.
 *
 * The id is kept as a secondary check for the rare label-less line, and a
 * uniquely-matching price as a last resort.
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

  if (!variants.length) {
    return opts.variantId ? { variantId: opts.variantId } : {};
  }

  // 1. Option values — from the stored label, or parsed off the item name.
  const label = opts.label ?? labelFromName(opts.name);
  const values = optionValuesFromLabel(label);
  if (values.length) {
    const key = optionKey(values);
    const byValues = variants.find((v) => optionKey(v.optionValues) === key);
    // Return the variant's CURRENT id — the stored one may be stale.
    if (byValues) return { variant: byValues, variantId: byValues.id };
  }

  // 2. The stored id, for a line that never had a usable label.
  if (opts.variantId) {
    const byId = variants.find((v) => v.id === opts.variantId);
    if (byId) return { variant: byId, variantId: byId.id };
  }

  // 3. A price only one variant carries — ambiguous matches are rejected.
  if (typeof opts.price === "number" && opts.price > 0) {
    const byPrice = variants.filter((v) => v.price === opts.price);
    if (byPrice.length === 1) {
      return { variant: byPrice[0], variantId: byPrice[0].id };
    }
  }

  // Nothing matched. Keep the stored id so the line still round-trips as a
  // variant, but with no `variant` the caller knows its price is unverified.
  return opts.variantId ? { variantId: opts.variantId } : {};
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
 * The unit price a ticket line was last saved with.
 *
 * This is the figure the backend already computed — Pizza listed at 400 with
 * a 50 discount is stored as 350 — and it's what an existing line sends back
 * on update. A variant keeps its own copy one level down, which wins.
 */
function storedUnitPrice(raw: any): number | undefined {
  if (!raw) return undefined;
  const variantPrice = raw.variantItems?.unitPrice;
  if (typeof variantPrice === "number") return variantPrice;
  return typeof raw.unitPrice === "number" ? raw.unitPrice : undefined;
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
  // The stored label is the reliable key — see resolveVariant. The id is
  // passed too, but only gets used if the line has no usable label.
  const resolved = resolveVariant(product, {
    label: raw.variantItems?.name,
    name: raw.productName,
    variantId: rawVariantId(raw.variantItems),
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
    label: raw.variantItems?.name,
    name: item.productName,
    variantId: storedVariantId,
    // Last resort only. The stored price is net, so this can mis-match on a
    // discounted line.
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
  credit,
  creditDetails,
  creditId,
  creditUserId,
  creditItems = [],
  creditPaymentHistory = [],
  customerProfile,
}: InvoiceFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const profileName = customerProfile?.name;

  // ── State — pre-filled from initialData in edit mode ─────────────────────

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    tickets
      ? ({
          id: creditUserId ?? "",
          name:
            profileName ??
            creditDetails?.credit?.user?.name ??
            initialData?.customerName ??
            tickets.ticketName ??
            "",
          email: tickets.customerEmail ?? "",
          phone:
            (creditDetails?.credit?.user?.phone || tickets.phoneNumber) ?? "",
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
   * Ids of the lines already on the ticket (or credit) when the form loaded.
   * Captured once at mount, so rows added afterwards are never mistaken for
   * pre-existing ones.
   */
  const existingItemIdsRef = useRef<Set<string>>(
    new Set<string>([
      ...flattenTicketItems(tickets)
        .map((r: any) => r?._id)
        .filter(Boolean),
      ...creditItems.map((c: any) => c?._id).filter(Boolean),
    ]),
  );

  /**
   * Each line's price as first mapped, so a later hand-edit of the price
   * field can be told apart from an untouched line. Discounts aren't tracked
   * here — they're handled per discount in buildDiscountPayload.
   */
  const originalLinesRef = useRef<Map<string, number>>(new Map());
  const rememberOriginals = (list: InvoiceItem[]) => {
    originalLinesRef.current = new Map(list.map((i) => [i.id, i.price]));
  };

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

      const mappedCredit = rawCredit.map((c) => mapCreditItem(c, products));
      setItems(mappedCredit);
      rememberOriginals(mappedCredit);
      hasUpdatedItemsFromProducts.current = true;
      return;
    }

    const rawItems = rawTicketItemsRef.current;
    if (!rawItems?.length) return;

    const mapped = rawItems.map((raw: any) => mapRawItem(raw, products));
    setItems(mapped);
    rememberOriginals(mapped);
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

  /**
   * Where the form returns to when the edit ends.
   *
   * A credit is edited from its own detail page, so leaving — whether by
   * cancelling or by saving — belongs there. Routing to the invoice would drop
   * the user on a page about the original ticket instead of the credit they
   * were working on.
   */
  const returnHref =
    isCreditInvoice && creditId
      ? `/records/credits/${creditId}`
      : `/invoices/${invoiceNumber}`;

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

  /** Was this line already on the ticket when the form loaded? */
  const isExistingItem = (item: InvoiceItem) =>
    existingItemIdsRef.current.has(item.id);

  /**
   * Did the user type a new price into this line's price field?
   *
   * Only a hand-edit counts — changing discounts doesn't. Without this an
   * edited price would be silently discarded in favour of the stored one.
   */
  const isPriceEdited = (item: InvoiceItem) => {
    const original = originalLinesRef.current.get(item.id);
    if (original === undefined) return false;
    return original !== item.price;
  };

  /**
   * The unit price to send for a line.
   *
   * A line already on the ticket sends the price the TICKET holds — Pizza
   * saved at 350 goes back as 350. It's never re-derived from the list price,
   * which is what keeps repeated edits of the same invoice stable: netting
   * 350 again would send 300, then 250.
   *
   * Whether each discount still needs applying is expressed separately, per
   * discount, via `isEnabled` in buildDiscountPayload — so a new discount on
   * an existing line arrives as "apply this to the 350".
   *
   * New lines, and lines whose price the user typed over, send what's on
   * screen instead.
   */
  const outgoingUnitPrice = (item: InvoiceItem) => {
    const stored = storedUnitPrice(rawFor(item));
    const useStored =
      isExistingItem(item) && !isPriceEdited(item) && stored !== undefined;
    return useStored ? (stored as number) : item.price;
  };

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
    /**
     * The unit price this line is sending. Passed in rather than derived so
     * the variant block can't disagree with the item it belongs to.
     */
    unitPriceOverride?: number,
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

    // Prefer the LIVE variant's option values — the stored label may predate
    // an option being renamed. `variantId` above is likewise the resolved
    // variant's current id, not the (probably stale) stored one.
    const name = toPayloadLabel(
      variantLabel(variant) ||
        item.variantLabel ||
        item.variantItems?.name ||
        raw?.variantItems?.name ||
        labelFromName(item.name) ||
        "",
    );

    const unitPrice =
      unitPriceOverride ??
      variant?.price ??
      item.price ??
      item.variantItems?.unitPrice ??
      raw?.variantItems?.unitPrice ??
      0;

    // Only `variantItems` goes on the wire — the variant is identified there,
    // so top-level variantId / variantLabel would be redundant.
    return {
      variantItems: {
        // The update API keys the variant as `_id` (the fetch returns it as
        // `variantItems.variant`).
        _id: variantId,
        name,
        // Mirrors the item's own unitPrice — for an existing line that's the
        // ticket's stored figure, never a recomputed one.
        unitPrice,
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
  const buildDiscountPayload = (item: InvoiceItem) => {
    const rawDiscounts: any[] = rawFor(item)?.discounts ?? [];

    return item.discounts
      .map((id) => {
        const master = masterDiscounts.find((m) => m._id === id);
        if (!master) return null;

        // Was this exact discount already on this line when the ticket was
        // last saved? The fetched entry keys the master id under `discount`;
        // its own `_id` is the subdocument's.
        const existing = rawDiscounts.find(
          (d: any) => (d?.discount ?? d?._id) === id,
        );
        const wasAlreadyApplied = !!existing;

        return {
          ...(master as object),
          discount: master._id,
          // Reuse the subdocument id so the backend updates that row rather
          // than orphaning it and inserting a duplicate.
          ...(existing?._id ? { _id: existing._id } : {}),
          // Per DISCOUNT, not per line. One already on the ticket has had its
          // effect banked, so it goes back as a record: isEnabled false. One
          // added during this edit still needs applying: isEnabled true. A
          // line can carry both at once.
          isEnabled: !wasAlreadyApplied,
          isSelected: !wasAlreadyApplied,
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
          // The credit endpoint always takes LIST prices and applies the
          // discounts itself — unlike the ticket update, which wants the price already
          // net. So no stored-price override here, and no isEnabled:false.
          const variantPayload = buildVariantPayload(item, product);
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

      // Also update the credit's user and/or ticketName via the PATCH API.
      const creditUpdatePayload: { user?: string; ticketName?: string } = {};
      if (selectedCustomer?.id) creditUpdatePayload.user = selectedCustomer.id;
      if (invoiceTitle) creditUpdatePayload.ticketName = invoiceTitle;

      const creditUpdatePromise =
        Object.keys(creditUpdatePayload).length > 0
          ? updateCredit(creditId, creditUpdatePayload)
          : Promise.resolve();

      Promise.all([
        updateCreditItems(creditId, creditPayload),
        creditUpdatePromise,
      ])
        .then(() => {
          toast.success("Credit invoice updated");
          // Invalidate the ticket + credit caches so the detail page shows the
          // updated content immediately (same as the normal-invoice path).
          queryClient.invalidateQueries({
            queryKey: ["ticket", invoiceNumber],
          });
          queryClient.invalidateQueries({ queryKey: ["credits"] });
          queryClient.invalidateQueries({ queryKey: ["credits", "completed"] });
          queryClient.invalidateQueries({ queryKey: ["credits", "archived"] });
          queryClient.invalidateQueries({
            queryKey: ["credit-detail-by-id", creditId],
          });
          router.push(returnHref);
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
      // Decided per LINE, not per request: an edit can contain lines the
      // backend has already priced, lines added just now, and lines that were
      // there but have since been edited.
      // Existing line → the ticket's stored price; new or hand-edited →
      // what's on screen. See outgoingUnitPrice.
      const unitPrice = outgoingUnitPrice(item);
      const variantPayload = buildVariantPayload(item, product, unitPrice);

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
        discounts: buildDiscountPayload(item),
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
              onClick={() => router.push(returnHref)}
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
