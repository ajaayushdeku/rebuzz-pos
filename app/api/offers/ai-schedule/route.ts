import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { FESTIVALS } from "@/components/offers/festivals";
import { festivalWindow } from "@/components/offers/festivalDates";
import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  addDaysIso,
  mergeHolidayEvents,
  type HolidayEvent,
} from "@/lib/holidayCalendar";
import { fetchHolidayFeed } from "@/lib/holidayFeed.server";
import { nepalToday } from "@/lib/nepalDate";

/**
 * Turn a plain-language schedule request into step 3's fields, dates included.
 *
 * Asked on the business's own Gemini key through the AI service, like the AI
 * Insights sections, and never cached: each fill is one question, answered
 * once, and nothing is saved.
 *
 * The model names the dates, but it is handed Nepal's holiday calendar — the
 * official notice merged with Google's public Nepal calendar, the same list
 * the festival tabs and the calendar popups use — and told to copy an entry's
 * dates whenever the event is on it. That keeps AI Fill agreeing with the rest
 * of the app. Whether the dates really came from that calendar is checked
 * here, not taken from the model's word, so the form can say which it was.
 */

// Monday first, matching the order step 3 shows and saves days in.
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVE_HOURS = ["all-day", "happy", "lunch", "evening"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** How far ahead the calendar handed to the model reaches, and dates may fall. */
const LOOKAHEAD_DAYS = 400;
/** No festival runs longer; a longer answer is a misread, not a campaign. */
const MAX_SPAN_DAYS = 45;

/** Where the filled dates came from, for the form's confirmation. */
type AiScheduleDateSource = "calendar" | "estimate" | "explicit" | "";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    festivalId: {
      type: "string",
      description:
        "The id of the matching occasion from the list, or an empty string if none is meant.",
    },
    startDate: {
      type: "string",
      description: "YYYY-MM-DD the offer starts, or empty if unknown.",
    },
    endDate: {
      type: "string",
      description: "YYYY-MM-DD the offer ends, or empty if unknown.",
    },
    repeatingDays: {
      type: "array",
      description:
        "Days the offer repeats, from Mon, Tue, Wed, Thu, Fri, Sat, Sun. Empty means every day.",
      items: { type: "string" },
    },
    startTime: { type: "string", description: "HH:MM 24-hour, or empty." },
    endTime: { type: "string", description: "HH:MM 24-hour, or empty." },
    activeHours: {
      type: "string",
      description: "One of: all-day, happy, lunch, evening.",
    },
  },
  required: [
    "festivalId",
    "startDate",
    "endDate",
    "repeatingDays",
    "startTime",
    "endTime",
    "activeHours",
  ],
} as const;

const festivalList = FESTIVALS.map((f) => `${f.id} = ${f.label}`).join("\n");

const INSTRUCTION = `You map a Nepali restaurant owner's plain-language description of when an offer should run onto a fixed set of fields.

Occasions you may choose from (use the id on the left, exactly):
${festivalList}

Dates:
- The briefing gives today's date in Nepal and a calendar reference: Nepal's holidays from Google's public Nepal holiday calendar, merged with the government's official holiday notice. It is the source of truth for dates.
- When the description names an event that is on the calendar reference, copy that entry's start and end dates exactly. Use its next occurrence that ends on or after today.
- When the event is not on the reference (for example Holi, Eid, or a year the reference does not reach), give the dates of its next occurrence from your knowledge of the Nepali calendar.
- When the description gives explicit dates, use those.
- Never return dates that end before today. If you cannot tell the dates, leave startDate and endDate empty rather than guessing.

Other fields:
- Pick festivalId only when the description clearly refers to that occasion. Otherwise return an empty string.
- repeatingDays uses exactly: Mon, Tue, Wed, Thu, Fri, Sat, Sun. "Weekdays" means Mon to Fri; "weekend" means Sat and Sun.
- Leave repeatingDays empty when the offer should run every day.
- startTime/endTime are 24-hour HH:MM, empty when the offer runs all day.
- activeHours is one of all-day, happy, lunch, evening.
- Guess nothing else. A field you cannot infer from the description must be empty.`;

/** The holidays ahead, one per line, as the model's date reference. */
function calendarReference(events: HolidayEvent[], today: string): string {
  const horizon = addDaysIso(today, LOOKAHEAD_DAYS);
  return events
    .filter((e) => e.end >= today && e.start <= horizon)
    .map(
      (e) =>
        `${e.start} to ${e.end} | ${e.label}${e.bsLabel ? ` (${e.bsLabel} BS)` : ""}`,
    )
    .join("\n");
}

const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Describe when the offer should run" },
      { status: 400 },
    );
  }

  // Capped rather than truncated silently: a paragraph pasted in by accident
  // should be refused, not quietly half-read.
  if (prompt.length > 300) {
    return NextResponse.json(
      { error: "Keep the description under 300 characters" },
      { status: 400 },
    );
  }

  const today = nepalToday();
  // The same merged list as the festival tabs and calendar popups. Without
  // Google (offline) it is the notice alone, and AI Fill still works.
  const holidays = mergeHolidayEvents(await fetchHolidayFeed());

  const briefing = `Today in Nepal: ${today}

Calendar reference (start to end | holiday):
${calendarReference(holidays, today) || "(none available)"}

Owner's description:
${prompt}`;

  // No cache key: the answer is used once to fill the form and not stored.
  const answer = await askAiService({
    token,
    briefing,
    systemInstruction: INSTRUCTION,
    responseSchema: RESPONSE_SCHEMA,
  });
  if (!answer.ok) return answer.response;

  const parsed = (answer.data?.insights ?? {}) as unknown as Record<
    string,
    unknown
  >;

  // ── Validate everything before it can touch the form ──
  const festivalId =
    typeof parsed.festivalId === "string" &&
    FESTIVALS.some((f) => f.id === parsed.festivalId)
      ? parsed.festivalId
      : "";

  const asDate = (v: unknown) =>
    typeof v === "string" && DATE_RE.test(v) && !Number.isNaN(Date.parse(v))
      ? v
      : "";

  let startDate = asDate(parsed.startDate);
  let endDate = asDate(parsed.endDate) || startDate;

  // Dates that are backwards, already over, too far off or too long are a
  // misread; the owner fills them in rather than trusting a wrong campaign.
  if (
    !startDate ||
    endDate < startDate ||
    endDate < today ||
    startDate > addDaysIso(today, LOOKAHEAD_DAYS) ||
    daysBetween(startDate, endDate) > MAX_SPAN_DAYS
  ) {
    startDate = "";
    endDate = "";
  }

  // Checked, not asked: the dates count as the calendar's only when they are
  // exactly an entry on it, or exactly what the festival's tab would set
  // (which joins Holi's hills and Terai days, for one).
  let dateSource: AiScheduleDateSource = "";
  if (startDate) {
    const tab = festivalId ? festivalWindow(festivalId, today, holidays) : null;
    const onCalendar =
      (tab?.startDate === startDate && tab?.endDate === endDate) ||
      holidays.some((e) => e.start === startDate && e.end === endDate);
    dateSource = onCalendar ? "calendar" : festivalId ? "estimate" : "explicit";
  } else if (festivalId) {
    // The model had no dates, but the calendar knows this festival.
    const window = festivalWindow(festivalId, today, holidays);
    if (window) {
      ({ startDate, endDate } = window);
      dateSource = "calendar";
    }
  }

  // Filtered against DAYS rather than trusted, so an unexpected value can
  // never reach the form. Order comes from DAYS, so "Sat, Fri" normalises to
  // week order the same way the day toggles do.
  const rawDays: unknown[] = Array.isArray(parsed.repeatingDays)
    ? parsed.repeatingDays
    : [];
  const repeatingDays = DAYS.filter((d) => rawDays.includes(d));

  const asTime = (v: unknown) =>
    typeof v === "string" && TIME_RE.test(v) ? v : "";

  let startTime = asTime(parsed.startTime);
  let endTime = asTime(parsed.endTime);
  // Half a window is not a window — the form treats both-empty as all day.
  if (!startTime || !endTime) {
    startTime = "";
    endTime = "";
  }

  const activeHours =
    typeof parsed.activeHours === "string" &&
    ACTIVE_HOURS.includes(parsed.activeHours)
      ? parsed.activeHours
      : "all-day";

  return NextResponse.json(
    {
      data: {
        festivalId,
        startDate,
        endDate,
        dateSource,
        repeatingDays,
        startTime,
        endTime,
        activeHours,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
