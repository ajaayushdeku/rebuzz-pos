"use client";

export interface Credit {
  _id: string;
  user: { _id: string; name: string } | null;
  adminId: string;
  total: number;
  grandTotal: number;
  discount: number;
  taxamt: number;
  status: string;
  creationDate: string;
  createdAt: string;
  updatedAt: string;
  dueAmount: number;
}

/** Fetch every credit. */
export async function fetchCreditsClient(): Promise<Credit[]> {
  const res = await fetch("/api/credit/getall", { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Failed to fetch credits");
  }
  const json = await res.json();
  return json?.data?.credits ?? [];
}

/** Local timestamp "YYYY-MM-DD HH:mm:ss.SSS" — the format the credit API expects. */
function formatNow(): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

interface TicketLike {
  _id?: string;
  adminId?: string;
  total?: number;
  discount?: number | null;
  paymentMethod?: string;
  isTaxExclusive?: boolean;
  taxId?: string | null;
  tax?: { _id?: string } | string | null;
  customerId?: string | null;
  user?: string | null;
  customerEmail?: string | null;
  phoneNumber?: string | null;
  items?: Array<{ tax?: string | null }>;
}

interface DetailBill {
  _id?: string;
  orderId?: string;
  adminId?: string;
  customerId?: string | null;
  total?: number;
  discount?: number | null;
  paymentMethod?: string;
  isTaxExclusive?: boolean;
  tax?: { _id?: string } | null;
}

/** First non-empty string among the candidates. */
function firstId(...vals: (string | null | undefined)[]): string {
  for (const v of vals) if (v) return v;
  return "";
}

/** Resolve the customer ObjectId for a ticket, looking it up by phone/email. */
async function resolveCustomerId(ticket: TicketLike): Promise<string> {
  const direct = firstId(ticket.customerId, ticket.user);
  if (direct) return direct;

  const phone = ticket.phoneNumber;
  const email = ticket.customerEmail;
  const query = phone ? `phone=${phone}` : email ? `email=${email}` : "";
  if (!query) return "";

  try {
    const res = await fetch(`/api/customers/lookup?${query}`, {
      cache: "no-store",
    });
    if (!res.ok) return "";
    const json = await res.json();
    return firstId(json?.data?.users?.[0]?._id);
  } catch {
    return "";
  }
}

/**
 * Move an existing invoice/ticket into the credit section.
 *
 * The credit API requires valid ObjectIds for `user`, `ticketId` and `taxId`,
 * so we source them from the ticket (and bill detail when present). The
 * customer id is resolved via the customer lookup when the ticket only carries
 * a phone/email.
 */
export async function moveInvoiceToCredit(
  invoiceNo: number | string,
): Promise<void> {
  // Ticket is the primary source (works for unpaid invoices too).
  let ticket: TicketLike = {};
  try {
    const res = await fetch(`/api/tickets/${invoiceNo}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      ticket = (json?.data?.Tickets ?? {}) as TicketLike;
    }
  } catch {
    // fall through — we still try the bill below
  }

  // Bill detail is a secondary source (only exists for billed/paid invoices).
  let bill: DetailBill | null = null;
  try {
    const res = await fetch(`/api/transactions/${invoiceNo}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      bill = (json?.data?.bill ?? null) as DetailBill | null;
    }
  } catch {
    // non-fatal
  }

  const ticketId = firstId(ticket._id, bill?.orderId, bill?._id);
  const user = firstId(
    await resolveCustomerId(ticket),
    bill?.customerId ?? undefined,
  );
  const taxId = firstId(
    ticket.taxId ?? undefined,
    typeof ticket.tax === "string" ? ticket.tax : ticket.tax?._id,
    ticket.items?.find((g) => !!g.tax)?.tax ?? undefined,
    bill?.tax?._id,
  );
  const adminId = firstId(ticket.adminId, bill?.adminId);

  if (!user) {
    throw new Error("Could not determine the customer for this invoice");
  }
  if (!ticketId) {
    throw new Error("Could not determine the ticket for this invoice");
  }

  const isExclusive = ticket.isTaxExclusive ?? bill?.isTaxExclusive ?? true;
  const now = formatNow();

  const payload = {
    creationDate: now,
    discount: ticket.discount ?? bill?.discount ?? 0,
    grandTotal: 0,
    isAddonTaxEnabled: false,
    isExclusiveTaxEnabled: isExclusive,
    isInclusiveTaxEnabled: !isExclusive,
    items: [] as unknown[],
    paidAt: now,
    paymentAmount: "0",
    paymentMethod: ticket.paymentMethod ?? bill?.paymentMethod ?? "cash",
    tax: {
      adminId,
      isEnabled: false,
      isSelected: false,
      isToogleLoading: false,
      name: null,
      rate: null,
    },
    taxId,
    taxamt: 0,
    ticketId,
    total: ticket.total ?? bill?.total ?? 0,
    user,
  };

  const res = await fetch(`/api/credit/create/${invoiceNo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { data?: { message?: string }; message?: string; error?: string })
        ?.data?.message ||
        (data as { message?: string }).message ||
        (data as { error?: string }).error ||
        "Failed to move invoice to credit",
    );
  }
}
