export type TransactionStatus = "completed" | "pending" | "failed" | "refunded";

export const statusStyles: Record<
  TransactionStatus,
  { cell: string; badge: string }
> = {
  completed: {
    cell: "text-green-800",
    badge: "bg-green-200",
  },
  pending: {
    cell: "text-yellow-800",
    badge: "bg-yellow-200",
  },
  failed: {
    cell: "text-red-800",
    badge: "bg-red-300",
  },
  refunded: {
    cell: "text-gray-800",
    badge: "bg-gray-300",
  },
};

export type PaymentMethod = "Card" | "Cash" | "Loyalty" | "QR";

export const paymentMethods: Record<
  PaymentMethod,
  { cell: string; badge: string }
> = {
  Card: {
    cell: "text-green-800",
    badge: "bg-green-200",
  },
  Cash: {
    cell: "text-gray-800",
    badge: "bg-gray-200",
  },
  Loyalty: {
    cell: "text-purple-800",
    badge: "bg-purple-200",
  },
  QR: {
    cell: "text-blue-800",
    badge: "bg-blue-200",
  },
};

/**
 * Map a raw backend payment method onto a {@link PaymentMethod} key.
 *
 * The API is inconsistent — "cash", "Cash", "qr", "Qr Payment" all occur — so
 * indexing `paymentMethods` with the raw string misses and silently falls back
 * to grey. Normalising first is what makes the badge colours correct.
 *
 * The returned key doubles as the display label, since the keys are already
 * written the way they should read.
 */
export function normalizePaymentMethod(method?: string | null): PaymentMethod {
  const lower = (method ?? "").toLowerCase();
  if (lower.includes("qr")) return "QR";
  if (lower.includes("card")) return "Card";
  if (lower.includes("loyalty") || lower.includes("point")) return "Loyalty";
  if (lower.includes("cash") || !lower) return "Cash";
  // Unrecognised method — preserved so the UI shows what the backend actually
  // said ("Bank Transfer") rather than inventing "Cash". Use
  // `paymentMethodStyle` for the badge, which falls back safely.
  return method as PaymentMethod;
}

/**
 * How a document should name the way it was paid: "Cash", "QR", or "Cash & QR"
 * when more than one was used.
 *
 * A credit settled in instalments can mix methods, but the bill records only
 * the last one — so the payment history is the authority when there is one,
 * and the bill's own method is the fallback.
 */
export function paymentModeLabel(
  payments?: Array<{ paymentMethod?: string | null }> | null,
  fallback?: string | null,
): string {
  const seen: string[] = [];
  for (const payment of payments ?? []) {
    const method = normalizePaymentMethod(payment.paymentMethod);
    if (method && !seen.includes(method)) seen.push(method);
  }

  if (seen.length > 0) return seen.join(" & ");
  return fallback ? normalizePaymentMethod(fallback) : "N/A";
}

/** Badge styling for any method, recognised or not. Never undefined. */
export function paymentMethodStyle(method?: string | null): {
  cell: string;
  badge: string;
} {
  return paymentMethods[normalizePaymentMethod(method)] ?? paymentMethods.Cash;
}
