import type { Credit, CreditPayment } from "@/services/apiCredit.client";

/**
 * A credit's state, as the detail page reasons about it.
 *
 * The API's own `status` only distinguishes archived from the rest, so
 * "completed" is derived from the due amount — a credit whose dues are settled
 * is finished whether or not the backend has stamped it yet.
 */
export type CreditState = "archived" | "completed" | "ongoing";

export function creditState(credit: Credit | null | undefined): CreditState {
  if (!credit) return "ongoing";
  if (credit.status === "archived") return "archived";
  if (credit.status === "completed" || (credit.dueAmount ?? 0) <= 0)
    return "completed";
  return "ongoing";
}

export const CREDIT_STATE_LABEL: Record<CreditState, string> = {
  archived: "Credit Archived",
  completed: "Credit Cleared",
  ongoing: "On Credit",
};

/**
 * Hatched status pills, matching the invoice detail page — the diagonal weave
 * is what separates a document state from an ordinary coloured chip.
 */
export const CREDIT_STATE_PILL: Record<
  CreditState,
  { className: string; style: React.CSSProperties }
> = {
  archived: {
    className: "border-gray-300 text-gray-700",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(156, 163, 175, 0.2) 2px, rgba(156, 163, 175, 0.2) 4px)",
      backgroundColor: "rgba(156, 163, 175, 0.3)",
    },
  },
  completed: {
    className: "border-green-300 text-green-700",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(134, 239, 172, 0.2) 2px, rgba(134, 239, 172, 0.2) 4px)",
      backgroundColor: "rgba(134, 239, 172, 0.3)",
    },
  },
  ongoing: {
    className: "border-violet-300 text-violet-700",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(167, 139, 250, 0.2) 2px, rgba(167, 139, 250, 0.2) 4px)",
      backgroundColor: "rgba(167, 139, 250, 0.25)",
    },
  },
};

/** Sum of every payment recorded against the credit. */
export function totalPaid(payments: CreditPayment[] | undefined): number {
  return (payments ?? []).reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0);
}

/** Newest first — the order the payment list reads in. */
export function sortPaymentsDesc(
  payments: CreditPayment[] | undefined,
): CreditPayment[] {
  return [...(payments ?? [])].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );
}

/**
 * The credit API returns "YYYY-MM-DD HH:mm:ss.SSS" — a space, not a T — which
 * Safari refuses to parse. Swapping the separator is what makes it a date.
 */
export function formatPaymentDate(raw: string): string {
  const d = new Date(raw.replace(" ", "T"));
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

export function formatDateLong(raw: string | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw.includes(" ") ? raw.replace(" ", "T") : raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
}

export function formatTimeShort(raw: string | undefined): string {
  if (!raw) return "";
  const d = new Date(raw.includes(" ") ? raw.replace(" ", "T") : raw);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
}
