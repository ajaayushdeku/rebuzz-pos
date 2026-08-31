import { CreateTicketInput } from "@/lib/types/ticket";

export const createTicket = async (ticketData: CreateTicketInput) => {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ticketData),
  });
  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to save invoice");
  }
  return result;
};

/**
 * Normalise one outgoing item.
 *
 * This is a whitelist — anything not named here is dropped before it reaches
 * the API. Variant lines carry three extra fields, and leaving them off the
 * list silently downgraded every variant item to its parent product no matter
 * what the form built. Add new item fields HERE as well as in the form.
 */
const toUpdateItem = (item: any) => {
  const variantId = item.variantId ?? item.variantItems?._id;

  return {
    // Omitted entirely when the line has no catalogue product behind it — a
    // custom line is described by its name and price. Sending `id: ""` would
    // claim a product that does not exist.
    ...(item.id ? { id: item.id } : {}),
    name:
      (item.name ?? "").replace(/\s*\([^()]*\)\s*$/, "").trim() || item.name,
    unitPrice: item.unitPrice ?? 0,
    quantity: item.quantity ?? 1,
    isTaxable: item.isTaxable ?? false,
    note: item.note ?? "",
    discounts: item.discounts ?? [],
    // ── Variant support ──
    // Only present on variant lines, so a standard item still sends the
    // plain shape rather than a set of null keys.
    ...(variantId
      ? {
          // variantId,
          // variantLabel: item.variantLabel ?? item.variantItems?.name ?? "",
          variantItems: {
            _id: variantId,
            name: item.variantItems?.name ?? item.variantLabel ?? "",
            unitPrice: item.variantItems?.unitPrice ?? item.unitPrice ?? 0,
            // Mirrors the line quantity — the two must not drift apart.
            quantity: item.variantItems?.quantity ?? item.quantity ?? 1,
            costPrice: item.variantItems?.costPrice ?? 0,
          },
        }
      : {}),
  };
};

export const updateTicket = async ({
  invoiceNumber,
  ticketData,
}: {
  invoiceNumber: string;
  ticketData: any;
}) => {
  const payload = {
    // ticketProductId: ticketData.ticketProductId ?? null,
    ticketName: ticketData.ticketName,
    customerEmail: ticketData.customerEmail,
    phoneNumber: ticketData.phoneNumber,
    grandTotal: ticketData.grandTotal ?? null,
    total: ticketData.total ?? null,
    // grandTotal: null,
    // total: null,
    taxId: ticketData.taxId ?? null,
    isTaxExclusive: !!ticketData.taxId,
    // ✅ include discount fields — same as create
    discount: ticketData.discount ?? 0,
    totalDiscount: ticketData.totalDiscount ?? 0,
    // A row counts as real once it has a name. It used to need a product id
    // too, which quietly discarded every custom line — the row is on screen,
    // the save reports success, and the item was never in the request. A line
    // the backend cannot accept should come back as an error, not vanish.
    items: (ticketData.items ?? [])
      .filter((item: any) => (item.name ?? "").trim())
      .map(toUpdateItem),
  };

  const res = await fetch(`/api/tickets/${invoiceNumber}/update-ticketName`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok || result.status !== "success") {
    throw new Error(result.message || "Failed to update invoice");
  }
  return result;
};

export const getTicketByInvoice = async (invoiceNumber: string) => {
  const response = await fetch(`/api/tickets/${invoiceNumber}`);
  if (!response.ok) throw new Error("Failed to fetch invoice");
  return response.json();
};
