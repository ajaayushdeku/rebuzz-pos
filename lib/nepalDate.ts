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
