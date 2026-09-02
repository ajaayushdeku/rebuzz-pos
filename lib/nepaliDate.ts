import NepaliDate from "nepali-date-converter";

/**
 * Bikram Sambat dates, for the app's date fields and offer copy.
 *
 * Backed by `nepali-date-converter` rather than a table written here: the BS
 * calendar's month lengths vary year to year and are not derivable, so a
 * hand-rolled converter would be wrong in ways nobody notices until an offer
 * runs on the wrong days.
 */

/** "2026-09-10" as "25 Bhadra 2083 BS". Null when the date is unusable. */
export function toBsLabel(isoDate: string): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  try {
    return `${new NepaliDate(date).format("DD MMMM YYYY")} BS`;
  } catch {
    // The converter only covers part of the BS range; a date outside it is
    // better shown as nothing than as a wrong one.
    return null;
  }
}
