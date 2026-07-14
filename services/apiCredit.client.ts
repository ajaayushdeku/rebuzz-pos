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
  invoiceNo: number;
}

export interface CreditPayment {
  _id: string;
  credit: string;
  paymentMethod: string;
  dueAmount: number;
  paymentDate: string;
  paymentAmount: number;
  isGrouped: boolean;
  groupedFrom: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreditItem {
  _id: string;
  product: string;
  productName: string;
  unitPrice: number;
  preTaxPrice: number;
  taxApplied: boolean;
  taxAmount: number;
  costPrice: number;
  quantity: number;
  discount: number;
  isTaxable: boolean;
  note: string | null;
  addons: unknown[];
  discounts: unknown[];
}

export interface CreditDetail {
  credit: Credit;
  items: CreditItem[];
  paymentHistory: CreditPayment[];
}

/** Fetch every credit. */
export async function fetchCreditsClient(): Promise<Credit[]> {
  const res = await fetch("/api/credit/getall", { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message || "Failed to fetch credits",
    );
  }
  const json = await res.json();
  return json?.data?.credits ?? [];
}

/** Fetch a single credit's full detail (credit + items + payment history). */
export async function fetchCreditDetail(
  creditId: string,
): Promise<CreditDetail> {
  const res = await fetch(`/api/credit/${creditId}/getcredit`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message || "Failed to fetch credit detail",
    );
  }
  const json = await res.json();
  const d = json?.data ?? {};
  return {
    credit: d.credit,
    items: d.items ?? [],
    paymentHistory: d.paymentHistory ?? [],
  };
}

/** Raw credit shape as returned by the by-status endpoint (user is an id). */
interface RawStatusCredit extends Omit<Credit, "user"> {
  user: { _id: string; name: string } | string | null;
}

/**
 * Normalise a by-status credit so `user` is always an object|null, resolving
 * the customer name from the supplied id→name map when the API only returned
 * the user id.
 */
function normaliseCredit(
  raw: RawStatusCredit,
  nameById: Map<string, string>,
): Credit {
  let user: Credit["user"];
  if (typeof raw.user === "string") {
    user = { _id: raw.user, name: nameById.get(raw.user) ?? "" };
  } else {
    user = raw.user ?? null;
  }
  return { ...raw, user };
}

/** Build an id→name map from the customers list (for user enrichment). */
async function fetchCustomerNameMap(): Promise<Map<string, string>> {
  try {
    const res = await fetch("/api/customers", { cache: "no-store" });
    if (!res.ok) return new Map();
    const json = await res.json();
    const users: Array<{ _id: string; name: string }> =
      json?.data?.users ?? [];
    return new Map(users.map((u) => [u._id, u.name]));
  } catch {
    return new Map();
  }
}

/**
 * Fetch credits filtered by status.
 *
 * The by-status endpoint returns `user` as a bare id, so we enrich each row
 * with the customer's name from the customers API.
 * @param status one of "ongoing" | "completed" | "archived".
 */
export async function fetchCreditsByStatus(status: string): Promise<Credit[]> {
  const res = await fetch(`/api/credit/status/${status}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ||
        "Failed to fetch credits by status",
    );
  }
  const json = await res.json();
  const credits: RawStatusCredit[] = json?.data?.credits ?? [];

  // Only pay the cost of the customers lookup when some user is unresolved.
  const needsLookup = credits.some((c) => typeof c.user === "string");
  const nameById = needsLookup ? await fetchCustomerNameMap() : new Map();

  return credits.map((c) => normaliseCredit(c, nameById));
}

/** Archive (soft-delete) a credit. */
export async function archiveCredit(creditId: string): Promise<void> {
  const res = await fetch(`/api/credit/${creditId}/archive`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { data?: { message?: string }; message?: string })?.data
        ?.message ||
        (data as { message?: string }).message ||
        "Failed to archive credit",
    );
  }
}

/** Fetch the payment history for a single credit. */
export async function fetchCreditPaymentHistory(
  creditId: string,
): Promise<CreditPayment[]> {
  const res = await fetch(`/api/credit/${creditId}/payment-history`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ||
        "Failed to fetch payment history",
    );
  }
  const json = await res.json();
  return json?.data?.creditPayment ?? [];
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
      (
        data as {
          data?: { message?: string };
          message?: string;
          error?: string;
        }
      )?.data?.message ||
        (data as { message?: string }).message ||
        (data as { error?: string }).error ||
        "Failed to move invoice to credit",
    );
  }
}
