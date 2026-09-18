import NepaliDate from "nepali-date-converter";

/**
 * Nepal's public holidays and the offer occasions around them, for the offer
 * calendars.
 *
 * Source: the Government of Nepal's public holiday notice for 2083 BS
 * (14 Apr 2026 – 13 Apr 2027), cross-checked against two independent copies
 * of the list. Stored in Bikram Sambat because that is the calendar the
 * notice is written in; the Gregorian dates are computed from it, and a test
 * checks every computed date against the one the notice publishes.
 *
 * Festivals on the lunar calendar — Dashain, Tihar, Holi, Teej — move every
 * year and cannot be derived, so this list has to be replaced each year when
 * the next notice is published. `COVERED_BS_YEAR` names the year it holds, and
 * the calendars say so when someone browses outside it rather than showing a
 * month with no holidays as if it had none.
 *
 * The dates are the holiday days the notice declares, which is not always the
 * whole festival: Dashain's holiday is Fulpati to Dwadashi, while Ghatasthapana
 * a week earlier is listed on its own.
 */

export const COVERED_BS_YEAR = 2083;

/** Who a holiday applies to. Only "national" closes everyone. */
export type HolidayScope = "national" | "group" | "valley" | "occasion";

interface HolidaySource {
  id: string;
  label: string;
  icon: string;
  /** Bikram Sambat start: month 1–12, as the notice writes it. */
  bs: { year: number; month: number; day: number };
  /** Inclusive length in days. */
  days: number;
  scope: HolidayScope;
  /** Who observes it, when it is not everyone. */
  note?: string;
  /** The offer builder's festival id, when there is one to pick. */
  festivalId?: string;
}

const Y = COVERED_BS_YEAR;

const SOURCE: HolidaySource[] = [
  {
    id: "new-year-2083",
    label: "Nepali New Year",
    icon: "🎊",
    bs: { year: Y, month: 1, day: 1 },
    days: 1,
    scope: "national",
    festivalId: "nepali-new-year",
  },
  {
    id: "buddha-jayanti",
    label: "Buddha Jayanti",
    icon: "☸️",
    bs: { year: Y, month: 1, day: 18 },
    days: 1,
    scope: "national",
    festivalId: "buddha-jayanti",
  },
  {
    id: "labour-day",
    label: "International Workers' Day",
    icon: "🛠️",
    bs: { year: Y, month: 1, day: 18 },
    days: 1,
    scope: "national",
  },
  {
    id: "republic-day",
    label: "Republic Day",
    icon: "🇳🇵",
    bs: { year: Y, month: 2, day: 15 },
    days: 1,
    scope: "national",
  },
  {
    id: "janai-purnima",
    label: "Janai Purnima / Rakshabandhan",
    icon: "🧶",
    bs: { year: Y, month: 5, day: 12 },
    days: 1,
    scope: "national",
  },
  {
    id: "gai-jatra",
    label: "Gai Jatra",
    icon: "🐄",
    bs: { year: Y, month: 5, day: 13 },
    days: 1,
    scope: "valley",
    note: "Newar community and Kathmandu Valley",
  },
  {
    id: "janmashtami",
    label: "Krishna Janmashtami",
    icon: "🪈",
    bs: { year: Y, month: 5, day: 19 },
    days: 1,
    scope: "national",
  },
  {
    id: "gaura-parva",
    label: "Gaura Parva",
    icon: "🌼",
    bs: { year: Y, month: 5, day: 19 },
    days: 1,
    scope: "group",
    note: "Sudurpashchim communities",
  },
  {
    id: "teej",
    label: "Haritalika Teej",
    icon: "💃",
    bs: { year: Y, month: 5, day: 29 },
    days: 1,
    scope: "group",
    note: "Women employees",
    festivalId: "teej",
  },
  {
    id: "constitution-day",
    label: "Constitution Day",
    icon: "📜",
    bs: { year: Y, month: 6, day: 3 },
    days: 1,
    scope: "national",
  },
  {
    id: "indra-jatra",
    label: "Indra Jatra",
    icon: "🎭",
    bs: { year: Y, month: 6, day: 9 },
    days: 1,
    scope: "valley",
    note: "Kathmandu Valley",
  },
  {
    id: "jitiya",
    label: "Jitiya",
    icon: "🪔",
    bs: { year: Y, month: 6, day: 18 },
    days: 1,
    scope: "group",
    note: "Women employees who observe it",
  },
  {
    id: "ghatasthapana",
    label: "Ghatasthapana",
    icon: "🌾",
    bs: { year: Y, month: 6, day: 25 },
    days: 1,
    scope: "national",
  },
  {
    id: "dashain",
    label: "Dashain",
    icon: "🌺",
    bs: { year: Y, month: 6, day: 31 },
    days: 7,
    scope: "national",
    festivalId: "dashain",
  },
  {
    id: "tihar",
    label: "Tihar",
    icon: "🪔",
    bs: { year: Y, month: 7, day: 22 },
    days: 5,
    scope: "national",
    festivalId: "tihar",
  },
  {
    id: "falgunanda-jayanti",
    label: "Falgunanda Jayanti",
    icon: "🙏",
    bs: { year: Y, month: 7, day: 25 },
    days: 1,
    scope: "group",
    note: "Kirat followers",
  },
  {
    id: "chhath",
    label: "Chhath",
    icon: "🌅",
    bs: { year: Y, month: 7, day: 29 },
    days: 1,
    scope: "national",
    festivalId: "chhath",
  },
  {
    id: "disability-day",
    label: "Intl. Day of Persons with Disabilities",
    icon: "♿",
    bs: { year: Y, month: 8, day: 17 },
    days: 1,
    scope: "group",
    note: "Employees with a disability",
  },
  {
    id: "yomari-punhi",
    label: "Yomari Punhi / Udhauli",
    icon: "🥟",
    bs: { year: Y, month: 9, day: 9 },
    days: 1,
    scope: "national",
  },
  {
    id: "christmas",
    label: "Christmas",
    icon: "🎄",
    bs: { year: Y, month: 9, day: 10 },
    days: 1,
    scope: "national",
    festivalId: "christmas",
  },
  {
    id: "tamu-lhosar",
    label: "Tamu Lhosar",
    icon: "🏔️",
    bs: { year: Y, month: 9, day: 15 },
    days: 1,
    scope: "national",
    festivalId: "losar",
  },
  {
    id: "prithvi-jayanti",
    label: "Prithvi Jayanti",
    icon: "🏛️",
    bs: { year: Y, month: 9, day: 27 },
    days: 1,
    scope: "national",
  },
  {
    id: "maghe-sankranti",
    label: "Maghe Sankranti",
    icon: "🍠",
    bs: { year: Y, month: 10, day: 1 },
    days: 1,
    scope: "national",
    festivalId: "maghe-sankranti",
  },
  {
    id: "martyrs-day",
    label: "Martyrs' Day",
    icon: "🕯️",
    bs: { year: Y, month: 10, day: 16 },
    days: 1,
    scope: "national",
  },
  {
    id: "sonam-lhosar",
    label: "Sonam Lhosar",
    icon: "🏔️",
    bs: { year: Y, month: 10, day: 24 },
    days: 1,
    scope: "national",
    festivalId: "losar",
  },
  {
    id: "basanta-panchami",
    label: "Basanta Panchami",
    icon: "📚",
    bs: { year: Y, month: 10, day: 28 },
    days: 1,
    scope: "group",
    note: "Educational institutions",
  },
  {
    id: "democracy-day",
    label: "National Democracy Day",
    icon: "🗳️",
    bs: { year: Y, month: 11, day: 7 },
    days: 1,
    scope: "national",
  },
  {
    id: "shivaratri",
    label: "Maha Shivaratri",
    icon: "🔱",
    bs: { year: Y, month: 11, day: 22 },
    days: 1,
    scope: "national",
    festivalId: "maha-shivaratri",
  },
  {
    id: "womens-day",
    label: "International Women's Day",
    icon: "👩",
    bs: { year: Y, month: 11, day: 24 },
    days: 1,
    scope: "national",
  },
  {
    id: "gyalpo-lhosar",
    label: "Gyalpo Lhosar",
    icon: "🏔️",
    bs: { year: Y, month: 11, day: 25 },
    days: 1,
    scope: "national",
    festivalId: "losar",
  },
  {
    id: "holi-hills",
    label: "Holi (hills)",
    icon: "🎨",
    bs: { year: Y, month: 12, day: 7 },
    days: 1,
    scope: "national",
    festivalId: "holi",
  },
  {
    id: "holi-terai",
    label: "Holi (Terai)",
    icon: "🎨",
    bs: { year: Y, month: 12, day: 8 },
    days: 1,
    scope: "national",
    festivalId: "holi",
  },
  {
    id: "ghode-jatra",
    label: "Ghode Jatra",
    icon: "🐎",
    bs: { year: Y, month: 12, day: 23 },
    days: 1,
    scope: "valley",
    note: "Kathmandu Valley",
  },

  // Not public holidays, but occasions the offer builder lists and a merchant
  // plans promotions around. Their Gregorian dates are fixed, and these BS
  // dates are those days in 2083.
  {
    id: "new-years-eve",
    label: "New Year's Eve",
    icon: "🥂",
    bs: { year: Y, month: 9, day: 16 },
    days: 1,
    scope: "occasion",
    festivalId: "new-years-eve",
  },
  {
    id: "valentine",
    label: "Valentine's Day",
    icon: "❤️",
    bs: { year: Y, month: 11, day: 2 },
    days: 1,
    scope: "occasion",
    festivalId: "valentine",
  },
];

/**
 * Holidays the notice names without a date: they follow the moon's sighting
 * or a community's own reckoning, and are fixed only when observed.
 */
export const UNDATED_HOLIDAYS = [
  "Eid ul-Fitr",
  "Bakar Eid",
  "Mohammad Jayanti",
  "Guru Nanak Jayanti",
  "Bhoto Jatra",
  "Siruwa Pawani",
];

export interface HolidayEvent extends Omit<HolidaySource, "bs"> {
  /**
   * Where the dates came from: the government notice written into this file,
   * or Google's public Nepal holiday calendar (see lib/holidayFeed.ts), used
   * for the years and short-notice holidays the notice here does not cover.
   */
  source?: "official" | "google";
  /** Gregorian, YYYY-MM-DD. */
  start: string;
  /** Gregorian, YYYY-MM-DD, inclusive. Equal to `start` for one day. */
  end: string;
  /** "31 Aswin – 6 Kartik 2083", as the notice would write it. */
  bsLabel: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A converter date parts object as YYYY-MM-DD. Its months count from 0. */
const isoFrom = (parts: { year: number; month: number; date: number }) =>
  `${parts.year}-${pad(parts.month + 1)}-${pad(parts.date)}`;

/** Whole days added to a YYYY-MM-DD, in UTC so no clock change can shift it. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function toEvent(source: HolidaySource): HolidayEvent {
  const { bs, ...rest } = source;
  const first = new NepaliDate(bs.year, bs.month - 1, bs.day);
  const start = isoFrom(first.getAD());
  const end = addDaysIso(start, source.days - 1);

  // The end is converted back rather than counted forward in BS, so a range
  // that crosses a month — Dashain runs from Aswin into Kartik — is labelled
  // with the month it actually ends in.
  const last = new NepaliDate(new Date(`${end}T12:00:00`));
  const startMonth = first.format("MMMM");
  const endMonth = last.format("MMMM");
  const endYear = last.getBS().year;

  // Each part said once: "29 Kartik 2083", "22 – 26 Kartik 2083",
  // "31 Aswin – 6 Kartik 2083", and both years only across a new year.
  const bsLabel =
    source.days === 1
      ? `${bs.day} ${startMonth} ${bs.year}`
      : endYear !== bs.year
        ? `${bs.day} ${startMonth} ${bs.year} – ${last.getBS().date} ${endMonth} ${endYear}`
        : endMonth !== startMonth
          ? `${bs.day} ${startMonth} – ${last.getBS().date} ${endMonth} ${endYear}`
          : `${bs.day} – ${last.getBS().date} ${endMonth} ${endYear}`;

  return { ...rest, start, end, bsLabel, source: "official" };
}

/**
 * "29 Kartik 2083", "22 – 26 Kartik 2083", "31 Aswin – 6 Kartik 2083" for a
 * Gregorian range — the same wording the notice's own events get, for dates
 * that arrive in Gregorian (Google's calendar).
 */
export function bsRangeLabel(start: string, end: string): string {
  const first = new NepaliDate(new Date(`${start}T12:00:00`));
  const last = new NepaliDate(new Date(`${end}T12:00:00`));
  const a = first.getBS();
  const b = last.getBS();
  const startMonth = first.format("MMMM");
  const endMonth = last.format("MMMM");
  if (start === end) return `${a.date} ${startMonth} ${a.year}`;
  if (a.year !== b.year) {
    return `${a.date} ${startMonth} ${a.year} – ${b.date} ${endMonth} ${b.year}`;
  }
  if (startMonth !== endMonth) {
    return `${a.date} ${startMonth} – ${b.date} ${endMonth} ${b.year}`;
  }
  return `${a.date} – ${b.date} ${endMonth} ${b.year}`;
}

export const HOLIDAY_EVENTS: HolidayEvent[] = SOURCE.map(toEvent).sort((a, b) =>
  a.start.localeCompare(b.start),
);

/**
 * The span the notice in this file covers: 1 Baishakh to the last day of
 * Chaitra of COVERED_BS_YEAR.
 */
export const OFFICIAL_COVERAGE = (() => {
  const first = new NepaliDate(COVERED_BS_YEAR, 0, 1).getAD();
  const next = new NepaliDate(COVERED_BS_YEAR + 1, 0, 1).getAD();
  const start = isoFrom(first);
  return { start, end: addDaysIso(isoFrom(next), -1) };
})();

/**
 * The notice's holidays, with Google's calendar filling what it cannot.
 *
 * Inside the notice's year the notice wins: it is the government's own list,
 * checked date by date. From Google, inside that year, only a holiday on a
 * day the notice has nothing for is added — the short-notice ones
 * (elections, extreme weather) the notice could not have known. Outside the
 * notice's year, Google's calendar is all there is, so it is used whole.
 *
 * With nothing from Google — offline, or before it loads — this is the notice
 * alone, exactly as before.
 */
export function mergeHolidayEvents(feed: HolidayEvent[]): HolidayEvent[] {
  if (feed.length === 0) return HOLIDAY_EVENTS;
  const { start, end } = OFFICIAL_COVERAGE;
  const coveredDays = new Set<string>();
  for (const e of HOLIDAY_EVENTS) {
    for (let d = e.start; d <= e.end; d = addDaysIso(d, 1)) coveredDays.add(d);
  }

  const extra = feed.filter((e) => {
    const outside = e.end < start || e.start > end;
    if (outside) return true;
    // A real day off (not an observance), that the notice has no festival or
    // holiday for on that day.
    return e.scope !== "occasion" && !coveredDays.has(e.start) && !e.festivalId;
  });

  return [...HOLIDAY_EVENTS, ...extra].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
}

/** The first and last day a list of holidays covers. */
export function coverageOf(events: HolidayEvent[]): {
  start: string;
  end: string;
} {
  let { start, end } = OFFICIAL_COVERAGE;
  for (const e of events) {
    if (e.source !== "google") continue;
    if (e.start < start) start = e.start;
    if (e.end > end) end = e.end;
  }
  return { start, end };
}

/** Events touching any day from `from` to `to`, both YYYY-MM-DD inclusive. */
export function eventsBetween(
  from: string,
  to: string,
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): HolidayEvent[] {
  return events.filter((e) => e.start <= to && e.end >= from);
}

/** Events on one day. */
export function eventsOn(
  iso: string,
  events: HolidayEvent[] = HOLIDAY_EVENTS,
): HolidayEvent[] {
  return eventsBetween(iso, iso, events);
}

// ── Month grids ─────────────────────────────────────────────────────────────

export interface CalendarDay {
  /** Gregorian, YYYY-MM-DD. */
  iso: string;
  /** The number printed large: the BS day on the Nepali calendar, AD on the English. */
  primary: number;
  /** The other calendar's day, printed small. */
  secondary: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

export interface MonthGrid {
  /** "Aswin 2083" or "October 2026". */
  title: string;
  /** The other calendar's months this one spans: "Sep/Oct 2026". */
  subtitle: string;
  /** Blank cells before day 1, for a week that starts on Sunday. */
  leading: number;
  days: CalendarDay[];
}

/** Local noon on a YYYY-MM-DD: far from midnight, so no offset can change the day. */
const noon = (iso: string) => new Date(`${iso}T12:00:00`);

const AD_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** A Bikram Sambat month, `monthIndex` counting from 0 (Baisakh). */
export function bsMonthGrid(year: number, monthIndex: number): MonthGrid {
  const first = new NepaliDate(year, monthIndex, 1);
  const next =
    monthIndex === 11
      ? new NepaliDate(year + 1, 0, 1)
      : new NepaliDate(year, monthIndex + 1, 1);

  const startIso = isoFrom(first.getAD());
  const nextIso = isoFrom(next.getAD());
  // BS months run 29 to 32 days and vary by year, so the length is the gap to
  // the next month's first day rather than anything written down here.
  const length = Math.round(
    (Date.parse(`${nextIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`)) /
      86_400_000,
  );

  const days: CalendarDay[] = Array.from({ length }, (_, i) => {
    const iso = addDaysIso(startIso, i);
    return {
      iso,
      primary: i + 1,
      secondary: Number(iso.slice(8, 10)),
      weekday: noon(iso).getDay(),
    };
  });

  const lastIso = days[days.length - 1].iso;
  const firstAd = `${AD_MONTHS[Number(startIso.slice(5, 7)) - 1]}`;
  const lastAd = `${AD_MONTHS[Number(lastIso.slice(5, 7)) - 1]}`;
  const adYears =
    startIso.slice(0, 4) === lastIso.slice(0, 4)
      ? startIso.slice(0, 4)
      : `${startIso.slice(0, 4)}/${lastIso.slice(0, 4)}`;

  return {
    title: `${first.format("MMMM")} ${year}`,
    subtitle: `${firstAd === lastAd ? firstAd : `${firstAd}/${lastAd}`} ${adYears}`,
    leading: days[0].weekday,
    days,
  };
}

/** A Gregorian month, `monthIndex` counting from 0 (January). */
export function adMonthGrid(year: number, monthIndex: number): MonthGrid {
  const length = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const days: CalendarDay[] = Array.from({ length }, (_, i) => {
    const iso = `${year}-${pad(monthIndex + 1)}-${pad(i + 1)}`;
    return {
      iso,
      primary: i + 1,
      secondary: new NepaliDate(noon(iso)).getBS().date,
      weekday: noon(iso).getDay(),
    };
  });

  const firstBs = new NepaliDate(noon(days[0].iso));
  const lastBs = new NepaliDate(noon(days[days.length - 1].iso));
  const bsMonths =
    firstBs.format("MMMM") === lastBs.format("MMMM")
      ? firstBs.format("MMMM")
      : `${firstBs.format("MMMM")}/${lastBs.format("MMMM")}`;
  const bsYears =
    firstBs.getBS().year === lastBs.getBS().year
      ? `${firstBs.getBS().year}`
      : `${firstBs.getBS().year}/${lastBs.getBS().year}`;

  return {
    title: new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    subtitle: `${bsMonths} ${bsYears}`,
    leading: days[0].weekday,
    days,
  };
}

/** The BS year and month (from 0) a Gregorian date falls in. */
export function bsMonthOf(iso: string): { year: number; monthIndex: number } {
  const bs = new NepaliDate(noon(iso)).getBS();
  return { year: bs.year, monthIndex: bs.month };
}
