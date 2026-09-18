import NepaliDate from "nepali-date-converter";

import {
  HOLIDAY_EVENTS,
  addDaysIso,
  type HolidayEvent,
} from "@/lib/holidayCalendar";
import { nepalToday } from "@/lib/nepalDate";

/**
 * The dates a festival occupies, for the festival picker and the AI fill.
 *
 * Three sources, most reliable first:
 *
 * 1. The holiday calendar: the official notice (`lib/holidayCalendar`), and
 *    Google's Nepal holiday calendar for the years after it, when passed in.
 *    The same dates the Nepali calendar popup offers with "Use these dates",
 *    so picking Dashain from the list and from the calendar agree. Covers the
 *    festivals that move with the moon: Dashain, Tihar, Chhath, Holi, Teej,
 *    Losar, Maha Shivaratri, Buddha Jayanti.
 * 2. Festivals fixed in the Bikram Sambat calendar — Nepali New Year on
 *    1 Baishakh, Maghe Sankranti on 1 Magh — worked out for any year, so they
 *    still date once the notice's year has passed.
 * 3. Festivals fixed in the Gregorian calendar — Valentine, Christmas, New
 *    Year's Eve.
 *
 * Anything else (a lunar festival after the notice's year) returns null, and
 * the form asks for the dates rather than guessing them.
 */

export interface FestivalOccurrence {
  startDate: string;
  endDate: string;
  /** The holiday's own name, e.g. "Tamu Lhosar" for Losar. */
  label: string;
  /** "31 Aswin – 6 Kartik 2083", when the Nepali date is known. */
  bsLabel?: string;
}

/** Fixed in the Bikram Sambat calendar: month 1–12, day. */
const BS_FIXED: Record<string, { month: number; day: number; label: string }> =
  {
    "nepali-new-year": { month: 1, day: 1, label: "Nepali New Year" },
    "maghe-sankranti": { month: 10, day: 1, label: "Maghe Sankranti" },
  };

/** Fixed in the Gregorian calendar. */
const AD_FIXED: Record<
  string,
  { month: number; day: number; days: number; label: string }
> = {
  valentine: { month: 2, day: 14, days: 1, label: "Valentine's Day" },
  christmas: { month: 12, day: 25, days: 1, label: "Christmas" },
  "new-years-eve": { month: 12, day: 31, days: 1, label: "New Year's Eve" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * From the holiday calendar: the next time this festival is on, or on now.
 *
 * A festival listed twice close together — Holi in the hills and in the
 * Terai a day apart — becomes one window covering both, since an offer for
 * Holi should run for either. Listings months apart (the three Losars) are
 * separate occasions, and the next one is taken.
 */
function fromCalendar(
  id: string,
  today: string,
  events: HolidayEvent[],
): FestivalOccurrence | null {
  const upcoming = events
    .filter((e) => e.festivalId === id && e.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const first = upcoming[0];
  if (!first) return null;

  let end = first.end;
  for (const next of upcoming.slice(1)) {
    if (next.start > addDaysIso(end, 1)) break;
    if (next.end > end) end = next.end;
  }

  return {
    startDate: first.start,
    endDate: end,
    label:
      end === first.end ? first.label : first.label.replace(/\s*\(.*\)$/, ""),
    bsLabel: end === first.end ? first.bsLabel : undefined,
  };
}

/** From the Bikram Sambat calendar: this BS year's date, or next year's. */
function fromBsFixed(id: string, today: string): FestivalOccurrence | null {
  const fixed = BS_FIXED[id];
  if (!fixed) return null;

  try {
    const thisYear = new NepaliDate(new Date(`${today}T12:00:00`)).getBS().year;
    for (const year of [thisYear, thisYear + 1]) {
      const ad = new NepaliDate(year, fixed.month - 1, fixed.day).getAD();
      const iso = `${ad.year}-${pad(ad.month + 1)}-${pad(ad.date)}`;
      if (iso >= today) {
        const bs = new NepaliDate(year, fixed.month - 1, fixed.day);
        return {
          startDate: iso,
          endDate: iso,
          label: fixed.label,
          bsLabel: `${fixed.day} ${bs.format("MMMM")} ${year}`,
        };
      }
    }
  } catch {
    // Outside the years the converter knows: leave it to the merchant.
  }
  return null;
}

/** From the Gregorian calendar: this year's date, or next year's. */
function fromAdFixed(id: string, today: string): FestivalOccurrence | null {
  const fixed = AD_FIXED[id];
  if (!fixed) return null;

  const year = Number(today.slice(0, 4));
  let start = `${year}-${pad(fixed.month)}-${pad(fixed.day)}`;
  // "Next", not "this year's": an offer built in December for Valentine is
  // built for February, and dating it to one already gone could never run.
  if (start < today)
    start = `${year + 1}-${pad(fixed.month)}-${pad(fixed.day)}`;

  return {
    startDate: start,
    endDate: addDaysIso(start, fixed.days - 1),
    label: fixed.label,
  };
}

/**
 * The next occurrence of a festival — or the current one, while it is on.
 * Null when no source can date it.
 */
export function festivalOccurrence(
  id: string,
  today: string = nepalToday(),
  // The notice alone by default; the form passes it merged with Google's
  // calendar (useHolidayEvents), which keeps dating festivals after the
  // notice's year.
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): FestivalOccurrence | null {
  if (!id) return null;
  return (
    fromCalendar(id, today, events) ??
    fromBsFixed(id, today) ??
    fromAdFixed(id, today)
  );
}

/** Just the dates, for filling the form. */
export function festivalWindow(
  id: string,
  today: string = nepalToday(),
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): { startDate: string; endDate: string } | null {
  const occurrence = festivalOccurrence(id, today, events);
  return occurrence
    ? { startDate: occurrence.startDate, endDate: occurrence.endDate }
    : null;
}

/** Festivals the picker cannot date on its own — see the note above. */
export function festivalDatesUnknown(
  id: string,
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): boolean {
  return id !== "" && festivalOccurrence(id, undefined, events) === null;
}
