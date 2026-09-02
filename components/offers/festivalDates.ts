/**
 * The dates a festival occupies.
 *
 * Only the festivals that fall on the same Gregorian date every year are
 * dated here — Valentine, Christmas and New Year's Eve. Everything else moves
 * against this calendar, whether by the panchang (Dashain, Tihar, Chhath,
 * Holi, Teej, Losar, Buddha Jayanti, Maha Shivaratri) or by the Bikram Sambat
 * year (Nepali New Year, Maghe Sankranti). Those select as a label and leave
 * the dates to the merchant, who knows when their own festival falls.
 *
 * Add a festival here and the picker dates it automatically.
 */

interface FixedFestival {
  /** 1-12. */
  month: number;
  day: number;
  /** How many days the offer should span, starting from that date. */
  days: number;
}

const FIXED: Record<string, FixedFestival> = {
  valentine: { month: 2, day: 14, days: 1 },
  christmas: { month: 12, day: 25, days: 1 },
  "new-years-eve": { month: 12, day: 31, days: 1 },
};

/** Festivals the picker cannot date on its own — see the note above. */
export function festivalDatesUnknown(id: string): boolean {
  return id !== "" && !(id in FIXED);
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/**
 * The next occurrence of a festival, as `{ startDate, endDate }`.
 *
 * "Next" rather than "this year's": an offer built in December for Valentine
 * is being built for February, and dating it to a Valentine that has already
 * gone would create a campaign that can never run.
 *
 * Returns null when the date is not known — the caller leaves the dates alone
 * and asks for them.
 */
export function festivalWindow(
  id: string,
  today: Date = new Date(),
): { startDate: string; endDate: string } | null {
  const festival = FIXED[id];
  if (!festival) return null;

  const midnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  let start = new Date(today.getFullYear(), festival.month - 1, festival.day);
  if (start < midnight) {
    start = new Date(today.getFullYear() + 1, festival.month - 1, festival.day);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + festival.days - 1);

  return { startDate: iso(start), endDate: iso(end) };
}
