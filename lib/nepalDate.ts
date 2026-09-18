/**
 * Calendar dates in Nepal time, from instants stored in UTC.
 *
 * The backend takes a plain "2026-09-30" and stores the instant that date
 * begins in Nepal, which comes back as "2026-09-29T18:15:00.000Z". Slicing the
 * first ten characters off that reads 29 September — a day early, and wrong on
 * every machine rather than only some.
 *
 * Adding the offset before reading the parts fixes it deterministically: the
 * same rule the rest of this codebase uses for MongoDB timestamps, and the
 * reason nothing here calls `getDate()` on a raw instant.
 */

/** Nepal is UTC+5:45 — the 45 is why a whole-hour shortcut does not work. */
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/**
 * The Nepal calendar day an instant falls on, as YYYY-MM-DD.
 *
 * A value that is already a plain date is returned untouched: it carries no
 * time to convert, and shifting it would move it a day.
 *
 * Returns null for anything unparseable, so a caller can tell "no due date"
 * from "a due date we could not read" rather than rendering "Invalid Date".
 */
export function nepalDateString(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const value = String(raw);

  // Date-only, e.g. "2026-09-30". Already a calendar day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;

  // Shift, then read UTC parts. Reading local parts instead would give the
  // right answer only for someone whose laptop is set to Nepal.
  return new Date(instant.getTime() + NEPAL_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * An instant as Nepal wall-clock time, e.g. "Sep 30, 2026, 10:45 AM".
 *
 * The offset is added and the result formatted with `timeZone: "UTC"` — the
 * same two-step this codebase uses for every other MongoDB timestamp. Reading
 * it with the machine's own zone would give a different answer per viewer, and
 * the wrong one for anybody outside Nepal.
 */
export function formatNepalDateTime(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  const instant = new Date(String(raw));
  if (Number.isNaN(instant.getTime())) return null;

  return new Date(instant.getTime() + NEPAL_OFFSET_MS).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * How a due date reads at a glance: "12 days to go", "Today", "3 days ago".
 *
 * Named for the reader's position rather than the date's — "to go" and "ago"
 * are what someone scanning a list wants, where a bare date makes them do the
 * subtraction themselves.
 */
export function dueDateRelativeLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `${days} days to go` : `${Math.abs(days)} days ago`;
}

/** Today in Nepal, as YYYY-MM-DD. */
export function nepalToday(): string {
  return nepalDateString(new Date().toISOString()) as string;
}

/**
 * Whole days from today in Nepal to a Nepal calendar date. Negative once past.
 *
 * Both sides are plain dates by this point, so this is calendar arithmetic
 * with no clock in it — no hour of the day can tip the answer by one.
 */
export function daysFromNepalToday(date: string | null): number | null {
  if (!date) return null;

  const toUtcMidnight = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return Date.UTC(y, m - 1, d);
  };

  const target = toUtcMidnight(date);
  const today = toUtcMidnight(nepalToday());
  if (target === null || today === null) return null;

  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

export interface NepalStamp {
  /** "13:55" */
  time24: string;
  /** "01:55 PM" */
  time12: string;
  /** "Sep 16, 2026" */
  date: string;
  /** The real moment, for "2 hours ago". */
  instant: Date;
}

/**
 * A POS timestamp as the time it was in Nepal, whichever form it arrives in.
 *
 * The POS sends two kinds, and they must be read differently:
 * - `createdAt` is a true instant, "2026-09-16T08:10:04.785Z". It is 1:55pm in
 *   Nepal. Reading it as if it were already Nepal time — which stripping the
 *   "Z" does — shows 08:10, five hours and forty-five minutes early.
 * - `paidAt` has no zone, "2026-09-16 08:10:35.000". It is UTC, unless it has
 *   non-zero milliseconds, in which case it is already Nepal wall-clock time.
 *   Same rule as `parseNepalTime` in lib/mappers/transaction.ts, which Order
 *   History uses.
 *
 * Formatted in UTC after shifting, so the answer is Nepal time on every
 * machine, not only on one whose clock is set to Nepal.
 */
export function nepalStamp(raw: string | null | undefined): NepalStamp | null {
  if (!raw) return null;
  const value = String(raw).trim();

  let instant: Date;
  if (/^\d{13}$/.test(value)) {
    instant = new Date(Number(value));
  } else if (/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value)) {
    instant = new Date(value);
  } else {
    const normalized = value.replace(" ", "T");
    const fraction = normalized.match(/\.(\d+)/)?.[1];
    const alreadyNepal = fraction != null && Number(fraction) > 0;
    const asUtc = new Date(`${normalized}Z`);
    instant = alreadyNepal
      ? new Date(asUtc.getTime() - NEPAL_OFFSET_MS)
      : asUtc;
  }
  if (Number.isNaN(instant.getTime())) return null;

  const wall = new Date(instant.getTime() + NEPAL_OFFSET_MS);
  const time = (hour12: boolean) =>
    wall.toLocaleTimeString("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });

  return {
    time24: time(false),
    time12: time(true),
    date: wall.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    instant,
  };
}

/** "moments ago", "12 min ago", "3 hours ago", "2 days ago". */
export function timeAgo(instant: Date): string {
  const sec = Math.floor((Date.now() - instant.getTime()) / 1000);
  if (sec < 60) return "moments ago";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
