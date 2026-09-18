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

/**
 * The badge for a customer the ladder does not cover, and the treatment used
 * before it loads. A configured tier is painted with the colour the loyalty
 * settings gave it — see `useTierStyle` — so there is no map of tier names
 * here: the names belong to the business, not to this app.
 */
export const NO_TIER_STYLE = {
  bg: "bg-gray-100 text-gray-500",
  ring: "ring-gray-200",
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  completed: "bg-green-200 text-green-800",
  refunded: "bg-gray-200 text-gray-800",
};
