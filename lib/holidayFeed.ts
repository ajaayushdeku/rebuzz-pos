/**
 * Google's public Nepal holiday calendar, read into the app's holiday events.
 *
 * Why it exists: the notice in lib/holidayCalendar.ts covers one Bikram Sambat
 * year and has to be replaced by hand every year. Google keeps this calendar
 * up to date itself — each year's festivals, and short-notice holidays such as
 * elections or extreme weather — so the app keeps dating festivals after the
 * notice's year without anyone editing code.
 *
 * What it is not: the government's notice. It reaches only about the end of
 * the current Gregorian year, it has no Holi or Eid, and it lists Dashain and
 * Tihar one day at a time under their own names. So it fills gaps; where the
 * notice has a year, the notice wins (see `mergeHolidayEvents`).
 *
 * Pure — no fetching here — so it can be tested against a saved copy of the
 * feed. The server fetches it (lib/holidayFeed.server.ts).
 */

import {
  addDaysIso,
  bsRangeLabel,
  type HolidayEvent,
  type HolidayScope,
} from "./holidayCalendar";

export const NEPAL_HOLIDAY_FEED_URL =
  "https://calendar.google.com/calendar/ical/en.np%23holiday%40group.v.calendar.google.com/public/basic.ics";

interface FeedEntry {
  date: string;
  summary: string;
  /** "Public holiday" or "Observance", from the entry's description. */
  isPublicHoliday: boolean;
}

/** One kind of holiday: how Google names it, and what the app calls it. */
interface Rule {
  match: RegExp;
  /** Days of one festival share a key, so they merge into one event. */
  key: string;
  label: string;
  icon: string;
  festivalId?: string;
  scope?: HolidayScope;
  note?: string;
}

/**
 * Google's names for the holidays the app knows.
 *
 * Icons and festival ids match the notice's own events, so a Dashain from
 * Google looks and behaves exactly like one from the notice. Order matters:
 * the first rule that matches wins.
 */
const RULES: Rule[] = [
  {
    match: /ghatasthapana/i,
    key: "ghatasthapana",
    label: "Ghatasthapana",
    icon: "🌾",
  },
  {
    match: /dashain|dasain/i,
    key: "dashain",
    label: "Dashain",
    icon: "🌺",
    festivalId: "dashain",
  },
  {
    match: /tihar|laxmi puja|bhai ?tika|govardhan|gobhardan/i,
    key: "tihar",
    label: "Tihar",
    icon: "🪔",
    festivalId: "tihar",
  },
  {
    match: /chhat/i,
    key: "chhath",
    label: "Chhath",
    icon: "🌅",
    festivalId: "chhath",
  },
  {
    match: /nepali new year|nepal sambat/i,
    key: "nepali-new-year",
    label: "Nepali New Year",
    icon: "🎊",
    festivalId: "nepali-new-year",
  },
  // `\bholi\b`, not /holi/: "Holiday" starts with the same four letters.
  {
    match: /\bholi\b|fagu/i,
    key: "holi",
    label: "Holi",
    icon: "🎨",
    festivalId: "holi",
  },
  {
    match: /teej/i,
    key: "teej",
    label: "Haritalika Teej",
    icon: "💃",
    festivalId: "teej",
    scope: "group",
    note: "Women",
  },
  {
    match: /maghe sankranti/i,
    key: "maghe-sankranti",
    label: "Maghe Sankranti",
    icon: "🍠",
    festivalId: "maghe-sankranti",
  },
  {
    match: /tamu l(h)?osar/i,
    key: "tamu-lhosar",
    label: "Tamu Lhosar",
    icon: "🏔️",
    festivalId: "losar",
  },
  {
    match: /sonam l(h)?osar/i,
    key: "sonam-lhosar",
    label: "Sonam Lhosar",
    icon: "🏔️",
    festivalId: "losar",
  },
  {
    match: /gyalpo l(h)?osar/i,
    key: "gyalpo-lhosar",
    label: "Gyalpo Lhosar",
    icon: "🏔️",
    festivalId: "losar",
  },
  {
    match: /buddha jayanti/i,
    key: "buddha-jayanti",
    label: "Buddha Jayanti",
    icon: "☸️",
    festivalId: "buddha-jayanti",
  },
  {
    match: /shivaratri/i,
    key: "maha-shivaratri",
    label: "Maha Shivaratri",
    icon: "🔱",
    festivalId: "maha-shivaratri",
  },
  {
    match: /christmas/i,
    key: "christmas",
    label: "Christmas",
    icon: "🎄",
    festivalId: "christmas",
  },
  {
    match: /constitution day/i,
    key: "constitution-day",
    label: "Constitution Day",
    icon: "📜",
  },
  {
    match: /janai purnima|raksha ?bandhan/i,
    key: "janai-purnima",
    label: "Janai Purnima",
    icon: "🧶",
  },
  {
    match: /indra jatra/i,
    key: "indra-jatra",
    label: "Indra Jatra",
    icon: "🎭",
    scope: "valley",
    note: "Kathmandu Valley",
  },
  {
    match: /\beid\b|edul|id-ul|bakr|ramadan/i,
    key: "eid",
    label: "Eid",
    icon: "🌙",
    scope: "group",
    note: "Muslim community",
  },
  {
    match: /election/i,
    key: "election",
    label: "Election holiday",
    icon: "🗳️",
  },
];

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The VEVENT blocks of an iCalendar file, as date, name and kind. */
export function readIcsEntries(ics: string): FeedEntry[] {
  // Long lines are folded onto the next line after a space; unfold them.
  const text = ics.replace(/\r?\n[ \t]/g, "");
  const entries: FeedEntry[] = [];
  for (const block of text.split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const date = body.match(/DTSTART(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})/);
    const summary = body.match(/\nSUMMARY:(.*)/)?.[1]?.trim();
    if (!date || !summary) continue;
    const description = body.match(/\nDESCRIPTION:(.*)/)?.[1] ?? "";
    entries.push({
      date: `${date[1]}-${date[2]}-${date[3]}`,
      summary: summary.replace(/\\,/g, ",").replace(/\\;/g, ";"),
      isPublicHoliday: /public holiday/i.test(description),
    });
  }
  return entries;
}

/** Days of one festival this far apart still count as one (Phulpati, then Astami a day later). */
const MAX_GAP_DAYS = 2;

/**
 * Google's calendar as the app's holiday events.
 *
 * Known holidays take the app's names and icons. Other public holidays keep
 * Google's name. Other observances — days nobody gets off — are left out, so
 * the calendar does not fill with days that change nothing for a shop.
 *
 * Days of the same festival close together become one event: Google lists
 * "Phulpati (Dashain)" to "Duwadashi (Dashain)" separately, which is one
 * Dashain to anyone planning an offer.
 */
export function parseHolidayFeed(ics: string): HolidayEvent[] {
  const days: {
    date: string;
    key: string;
    label: string;
    icon: string;
    festivalId?: string;
    scope: HolidayScope;
    note?: string;
  }[] = [];

  for (const entry of readIcsEntries(ics)) {
    const rule = RULES.find((r) => r.match.test(entry.summary));
    if (!rule && !entry.isPublicHoliday) continue;
    days.push(
      rule
        ? {
            date: entry.date,
            key: rule.key,
            label: rule.label,
            icon: rule.icon,
            festivalId: rule.festivalId,
            scope:
              rule.scope ?? (entry.isPublicHoliday ? "national" : "occasion"),
            note: rule.note,
          }
        : {
            date: entry.date,
            key: slug(entry.summary),
            label: entry.summary,
            icon: "📅",
            scope: "national",
          },
    );
  }

  days.sort(
    (a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key),
  );

  const events: HolidayEvent[] = [];
  const open = new Map<string, HolidayEvent>();
  for (const day of days) {
    const current = open.get(day.key);
    if (current && day.date <= addDaysIso(current.end, MAX_GAP_DAYS)) {
      if (day.date > current.end) current.end = day.date;
      // Public beats observance when a festival mixes both.
      if (day.scope === "national") current.scope = "national";
      continue;
    }
    const event: HolidayEvent = {
      id: `google-${day.key}-${day.date}`,
      label: day.label,
      icon: day.icon,
      days: 1,
      scope: day.scope,
      note: day.note,
      festivalId: day.festivalId,
      start: day.date,
      end: day.date,
      bsLabel: "",
      source: "google",
    };
    open.set(day.key, event);
    events.push(event);
  }

  for (const e of events) {
    e.days =
      Math.round(
        (Date.parse(`${e.end}T00:00:00Z`) -
          Date.parse(`${e.start}T00:00:00Z`)) /
          86_400_000,
      ) + 1;
    try {
      e.bsLabel = bsRangeLabel(e.start, e.end);
    } catch {
      e.bsLabel = "";
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}
