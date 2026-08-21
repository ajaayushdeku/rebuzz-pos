/** Shared types, tier styling and date parsing for the customer detail page. */

export type PurchaseHistoryItem = {
  grandTotal: number;
  paidAt?: string;
  createdAt?: string;
  isRefunded?: boolean;
  invoiceNo?: number;
  paymentMethod?: string;
  ticketName?: string;
  orderId?: string;
};

export type PurchaseHistoryResponse = {
  status: string;
  customerPurchases: PurchaseHistoryItem[];
};

// ── Tier badge styling ─────────────────────────────────────────────────────

export const TIER_BG: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-200 text-slate-800",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-indigo-100 text-indigo-800",
};

export const TIER_RING: Record<string, string> = {
  Bronze: "ring-amber-200",
  Silver: "ring-slate-300",
  Gold: "ring-yellow-300",
  Platinum: "ring-indigo-300",
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-200 text-green-800",
  refunded: "bg-gray-200 text-gray-800",
};

// ── Date parsing ───────────────────────────────────────────────────────────

/**
 * `paidAt` with NON-ZERO milliseconds is already Nepal local time; ".000" or
 * no fraction is UTC out of MongoDB and needs +5:45.
 *
 * This is the same rule as `parseNepalTime` in lib/mappers/transaction.ts and
 * `parseNepalDateTime` in the staff-detail helpers. The page previously used
 * an older "hour >= 12 means Nepal" heuristic, which mis-shifted every UTC
 * afternoon order — the two orders at 13:11:15.934 and 07:15:51.000 in the
 * same payload are the case that breaks it.
 */
export function parseNepalDate(rawDate: string): Date | null {
  if (!rawDate) return null;

  const normalized = rawDate.includes("T")
    ? rawDate.replace("Z", "")
    : rawDate.replace(" ", "T");

  const fraction = normalized.match(/\.(\d+)/)?.[1];
  const hasSubSecond = fraction != null && Number(fraction) > 0;

  const utc = new Date(normalized + "Z");
  if (isNaN(utc.getTime())) return null;

  if (hasSubSecond) {
    // Already Nepal time — re-read it as local rather than shifting it.
    const local = new Date(normalized);
    return isNaN(local.getTime()) ? null : local;
  }

  return new Date(utc.getTime() + (5 * 60 + 45) * 60 * 1000);
}
