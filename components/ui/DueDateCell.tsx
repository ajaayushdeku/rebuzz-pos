"use client";

import {
  daysFromNepalToday,
  dueDateRelativeLabel,
  nepalDateString,
} from "@/lib/nepalDate";

/**
 * Colour alone, no pill.
 *
 * The status column beside this one is already a bordered chip, and two of
 * them per row turned the table into a wall of boxes. Colour carries the state
 * without competing with the column whose job is the badge.
 *
 * The five live tones read as one ramp — blue, green, amber, orange, red —
 * from "plenty of time" to "badly overdue". Scanning a column of dates, the
 * distance from the deadline is the thing worth seeing, and a single red for
 * everything late hides the difference between a day and a month.
 */
const TONES = {
  /** More than a day away. */
  upcoming: "text-blue-700",
  /** Tomorrow. */
  imminent: "text-green-700",
  /** Today. */
  today: "text-amber-700",
  /** Yesterday — slipped, but only just. */
  slipped: "text-orange-700",
  /** More than a day past. */
  overdue: "text-red-700",
  settled: "text-gray-500",
} as const;

/**
 * A due date as a table cell: how long is left, with the date beneath it.
 *
 * Shared by the invoice and credit tables so the same debt reads the same from
 * either list. The relative line is the one people scan; the date under it is
 * there for when the answer is "which day exactly", and matches the smaller
 * grey date the Date column already shows.
 */
export default function DueDateCell({
  dueDate,
  settled = false,
}: {
  /** Raw value from the API — a UTC instant or a plain date. */
  dueDate: string | null | undefined;
  /**
   * True once nothing is owed. A passed date on a paid document is history,
   * not a warning, so it drops to grey rather than shouting in red.
   */
  settled?: boolean;
}) {
  const date = nepalDateString(dueDate);
  const days = daysFromNepalToday(date);

  if (!date || days === null) {
    return <span className="text-gray-400">—</span>;
  }

  const tone = settled
    ? TONES.settled
    : days < -1
      ? TONES.overdue
      : days === -1
        ? TONES.slipped
        : days === 0
          ? TONES.today
          : days === 1
            ? TONES.imminent
            : TONES.upcoming;

  // Built from the parts, never `new Date(iso)`, which reads a bare date as
  // UTC midnight and renders the day before in any negative offset.
  const [y, m, d] = date.split("-").map(Number);
  const readable = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <span className={`block text-xs font-semibold ${tone}`}>
        {dueDateRelativeLabel(days)}
      </span>
      <span className="text-[11px] text-gray-400">{readable}</span>
    </div>
  );
}
