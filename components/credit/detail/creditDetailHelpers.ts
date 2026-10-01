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

/** The diagonal weave, at whatever colour and strength the theme wants. */
const hatch = (rgba: string) =>
  `repeating-linear-gradient(45deg, transparent, transparent 2px, ${rgba} 2px, ${rgba} 4px)`;

/**
 * Classes every hatched pill carries, picking its two fills from the custom
 * properties below.
 *
 * The weave and the wash are a `background-image` and a `background-color`, and
 * an inline style cannot carry a `dark:` variant — so each is declared twice and
 * these classes choose. It matters more than it looks: the light fills are
 * low-alpha light hues, which composite *downwards* over a dark card. Measured
 * on `#161d2e`, `rgba(156,163,175,0.3)` lands at `#3e4555`, where the light ink
 * reads 1.07:1 — the pill would look empty rather than coloured.
 */
export const CREDIT_STATE_PILL_CLASS =
  "bg-[image:var(--pill-weave-light)] bg-[var(--pill-wash-light)] " +
  "dark:bg-[image:var(--pill-weave-dark)] dark:bg-[var(--pill-wash-dark)]";

/**
 * Hatched status pills, matching the invoice detail page — the diagonal weave
 * is what separates a document state from an ordinary coloured chip.
 *
 * Each state names both themes' weave and wash. The dark halves are the same
 * hue one step brighter and a little stronger, so the chip still reads as a
 * weave rather than a flat tint; their inks measure 7.0–7.9:1 on the card.
 */
export const CREDIT_STATE_PILL: Record<
  CreditState,
  { className: string; style: React.CSSProperties }
> = {
  archived: {
    className:
      "border-gray-300 text-gray-700 dark:border-white/20 dark:text-[#c3ccdc]",
    style: {
      "--pill-weave-light": hatch("rgba(156, 163, 175, 0.2)"),
      "--pill-wash-light": "rgba(156, 163, 175, 0.3)",
      "--pill-weave-dark": hatch("rgba(255, 255, 255, 0.14)"),
      "--pill-wash-dark": "rgba(255, 255, 255, 0.1)",
    } as React.CSSProperties,
  },
  completed: {
    className:
      "border-green-300 text-green-700 dark:border-emerald-400/40 dark:text-emerald-300",
    style: {
      "--pill-weave-light": hatch("rgba(134, 239, 172, 0.2)"),
      "--pill-wash-light": "rgba(134, 239, 172, 0.3)",
      "--pill-weave-dark": hatch("rgba(94, 233, 181, 0.22)"),
      "--pill-wash-dark": "rgba(94, 233, 181, 0.14)",
    } as React.CSSProperties,
  },
  ongoing: {
    className:
      "border-violet-300 text-violet-700 dark:border-violet-400/40 dark:text-violet-300",
    style: {
      "--pill-weave-light": hatch("rgba(167, 139, 250, 0.2)"),
      "--pill-wash-light": "rgba(167, 139, 250, 0.25)",
      "--pill-weave-dark": hatch("rgba(218, 178, 255, 0.22)"),
      "--pill-wash-dark": "rgba(218, 178, 255, 0.14)",
    } as React.CSSProperties,
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
