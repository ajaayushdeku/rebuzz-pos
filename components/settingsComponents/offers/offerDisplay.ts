import type { DiscountType, Offer } from "@/services/apiOffers.client";
import { formatCurrencySymbol } from "@/utils/helper";
import { toBsLabel } from "@/lib/nepaliDate";

/**
 * How the list names each kind of deal.
 *
 * Keyed by the API's `type` rather than the builder's deal id, because a stored
 * offer only carries the type — the card it was created from is not saved. The
 * wording follows the builder's cards so a merchant recognises what they made.
 */
export const TYPE_LABEL: Record<DiscountType, string> = {
  percent: "Percentage off",
  amount: "Rupee discount",
  bogo: "Buy 1, get 1",
  freeItem: "Free item",
};

/** 0-6 as the chips in the builder write them. */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The days of the week, in week order, for a row of chips.
 *
 * Monday first, as step 3 of the builder lists them, while the values stay the
 * API's 0-6 with Sunday as 0 — the order they are shown in and the numbers they
 * are stored as are two different things.
 */
export const DAY_CHIPS = [1, 2, 3, 4, 5, 6, 0].map((value) => ({
  value,
  label: DAY_NAMES[value],
}));

/**
 * A stored date as `<input type="date">` needs it.
 *
 * The POS answers with whatever Mongo gave it, which for a date field is a full
 * ISO timestamp — `2026-10-01T00:00:00.000Z`. A date input silently shows
 * nothing for that, which is why the dates looked empty in the edit modal even
 * though the offer had them.
 *
 * The timestamp is cut rather than parsed through `Date`: these are calendar
 * days, and `new Date("2026-10-01T00:00:00.000Z")` read back in Kathmandu is
 * 05:45 on the 1st — correct here, but the same code on a negative offset lands
 * on the 30th of September.
 */
export function toDateInput(value: string | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

/** A stored time as `<input type="time">` needs it — "9:00" becomes "09:00". */
export function toTimeInput(value: string | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** "18:13" as a person reads it. */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * "2026-09-12" as "27 Bhadra 2083".
 *
 * Bikram Sambat, like the dates in the builder and on the customer's card: a
 * merchant who set the offer for Dashain should not have to convert back to
 * recognise it. Falls back to the Gregorian date when the conversion is
 * unavailable rather than printing nothing.
 */
export function formatDate(input: string): string {
  // Dates arrive as full ISO timestamps; the BS converter wants a plain day.
  const value = toDateInput(input) || input;
  const bs = toBsLabel(value);
  return bs ? bs.replace(/\s*BS$/, "") : formatDateEn(input);
}

/**
 * The same day in the Gregorian calendar — "12 Sep 2026".
 *
 * Shown beside the BS date rather than instead of it: the offer was set up
 * against a festival, so BS is the calendar it belongs to, but the phone, the
 * accounts and anyone outside Nepal are all on this one, and converting in your
 * head to answer "has it finished?" is not a thing to ask of a settings page.
 */
export function formatDateEn(input: string): string {
  const value = toDateInput(input) || input;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The deal in as few characters as it can be put — "15% off", "Rs 100 off".
 *
 * A deal with no amount describes itself in `TYPE_LABEL` already, so this is
 * only the figure beside it and returns null rather than repeating the name.
 */
export function dealAmount(
  offer: Offer,
  currency: string,
  locale?: string,
): string | null {
  if (offer.value === undefined || offer.value <= 0) return null;

  return offer.type === "percent"
    ? `${offer.value}% off`
    : `${formatCurrencySymbol(offer.value, currency, locale)} off`;
}

/**
 * One thing worth saying about when the offer runs.
 *
 * `note` is the same fact in other words — the Gregorian date under the BS one —
 * rather than a second fact, so a row can print it smaller and a narrow screen
 * can drop it without losing anything.
 */
export type ScheduleLine = { text: string; note?: string };

/**
 * When the offer runs, a line at a time.
 *
 * Dates, then days, then hours, each dropped when it is not set, because an
 * offer with no window is not "no dates" — it is simply always on, and printing
 * an em dash for each missing part makes a sparse row look broken.
 */
export function scheduleLines(offer: Offer): ScheduleLine[] {
  const lines: ScheduleLine[] = [];

  const range = (
    from: string | undefined,
    to: string | undefined,
    format: (value: string) => string,
  ) => {
    if (from && to) return `${format(from)} – ${format(to)}`;
    if (to) return `Until ${format(to)}`;
    return `From ${format(from as string)}`;
  };

  if (offer.startDate || offer.endDate) {
    lines.push({
      text: range(offer.startDate, offer.endDate, formatDate),
      note: range(offer.startDate, offer.endDate, formatDateEn),
    });
  }

  if (offer.days && offer.days.length > 0 && offer.days.length < 7) {
    // In week order, not the order they happen to be stored in, so "Fri, Sat"
    // never reads as "Sat, Fri".
    lines.push({
      text: [...offer.days]
        .sort((a, b) => a - b)
        .map((day) => DAY_NAMES[day])
        .filter(Boolean)
        .join(", "),
    });
  }

  if (offer.startTime && offer.endTime) {
    lines.push({
      text: `${formatTime(toTimeInput(offer.startTime))} – ${formatTime(toTimeInput(offer.endTime))}`,
    });
  }

  return lines;
}

/** The limits, for the row's second line — "Min Rs 500 · 2 per customer". */
export function limitLine(
  offer: Offer,
  currency: string,
  locale?: string,
): string | null {
  const parts = [
    offer.minSpend && offer.minSpend > 0
      ? `Min ${formatCurrencySymbol(offer.minSpend, currency, locale)}`
      : null,
    offer.perCustomerLimit && offer.perCustomerLimit > 0
      ? `${offer.perCustomerLimit} per customer`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}
