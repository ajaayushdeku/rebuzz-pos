import { nepalToday } from "@/lib/nepalDate";

/**
 * The window the customer leaderboard and the at-risk list actually cover.
 *
 * `getTopCustomers` keeps a purchase when its month and year match today's
 * (see `apiCustomerDash.ts`), so the window is the CURRENT CALENDAR MONTH —
 * the 1st through today — and not a rolling 30 days. "This month" alone could
 * be read either way, which is the whole reason this exists: the label states
 * the dates so there is nothing to infer.
 *
 * Built from `nepalToday()` rather than the browser's clock, because the
 * purchase dates are normalised to Nepal time before being compared. A viewer
 * in another timezone would otherwise see a range that disagrees with the rows
 * underneath it for a few hours either side of midnight.
 */
export interface MonthToDate {
  /** "Oct 1 – Oct 2" — or just "Oct 1" on the first of the month. */
  label: string;
  /** "October 1 – October 2, 2026", for the tooltip and the aria-label. */
  longLabel: string;
  /** True on the 1st, when the range is a single day. */
  isFirstOfMonth: boolean;
}

export function monthToDate(today: string = nepalToday()): MonthToDate {
  const [year, month, day] = today.split("-").map(Number);

  // UTC, so the Date is a plain calendar date with no local clock in it — the
  // same reason `daysFromNepalToday` builds its dates this way.
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month - 1, day));

  const short = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const long = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

  const isFirstOfMonth = day === 1;

  return {
    label: isFirstOfMonth ? short(end) : `${short(start)} – ${short(end)}`,
    longLabel: isFirstOfMonth
      ? `${long(end)}, ${year}`
      : `${long(start)} – ${long(end)}, ${year}`,
    isFirstOfMonth,
  };
}
