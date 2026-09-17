"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import {
  COVERED_BS_YEAR,
  HOLIDAY_EVENTS,
  UNDATED_HOLIDAYS,
  adMonthGrid,
  bsMonthGrid,
  bsMonthOf,
  eventsBetween,
  type HolidayEvent,
  type HolidayScope,
  type MonthGrid,
} from "@/lib/holidayCalendar";
import { nepalToday } from "@/lib/nepalDate";

export type CalendarSystem = "bs" | "ad";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Saturday is Nepal's weekly public holiday, so it reads like one. */
const SATURDAY = 6;

/**
 * One colour per kind of day. A national holiday closes everyone and is the
 * one that changes trade, so it is the loudest; a community or valley holiday
 * and a commercial occasion are quieter and told apart from each other.
 */
const SCOPE_STYLE: Record<HolidayScope, { dot: string; label: string }> = {
  national: { dot: "bg-red-500", label: "Public holiday" },
  valley: { dot: "bg-amber-500", label: "Kathmandu Valley" },
  group: { dot: "bg-amber-500", label: "For some groups" },
  occasion: { dot: "bg-pink-500", label: "Offer occasion" },
};

interface Cursor {
  year: number;
  monthIndex: number;
}

function initialCursor(system: CalendarSystem, anchorIso: string): Cursor {
  if (system === "bs") return bsMonthOf(anchorIso);
  return {
    year: Number(anchorIso.slice(0, 4)),
    monthIndex: Number(anchorIso.slice(5, 7)) - 1,
  };
}

function step({ year, monthIndex }: Cursor, by: 1 | -1): Cursor {
  const next = monthIndex + by;
  if (next < 0) return { year: year - 1, monthIndex: 11 };
  if (next > 11) return { year: year + 1, monthIndex: 0 };
  return { year, monthIndex: next };
}

/**
 * A holiday's Gregorian dates, saying each part once: "8 – 12 Nov 2026",
 * "17 Oct – 2 Nov 2026", and the full form only across a new year.
 */
function adRangeLabel(event: HolidayEvent): string {
  const at = (iso: string) => new Date(`${iso}T12:00:00`);
  const day = (iso: string) => at(iso).getDate();
  const month = (iso: string) =>
    at(iso).toLocaleDateString("en-GB", { month: "short" });
  const year = (iso: string) => iso.slice(0, 4);

  const { start, end } = event;
  if (start === end) return `${day(start)} ${month(start)} ${year(start)}`;
  if (year(start) !== year(end)) {
    return `${day(start)} ${month(start)} ${year(start)} – ${day(end)} ${month(end)} ${year(end)}`;
  }
  if (start.slice(5, 7) !== end.slice(5, 7)) {
    return `${day(start)} ${month(start)} – ${day(end)} ${month(end)} ${year(end)}`;
  }
  return `${day(start)} – ${day(end)} ${month(end)} ${year(end)}`;
}

/**
 * A month calendar of Nepal's holidays and offer occasions, in either the
 * Bikram Sambat or the Gregorian calendar.
 *
 * The two are the same days read two ways. Each shows its own date large and
 * the other's small, because a merchant plans in BS while customers, payment
 * apps and delivery platforms all quote AD — and an offer has to line up with
 * both.
 *
 * The offer's current start and end dates are shaded, so the calendar answers
 * "does my offer cover Tihar?" at a glance. Each holiday can be applied to the
 * offer from the list below the grid.
 *
 * Mounted only while open, like the other modals built on ModalShell: the
 * month it opens on is read once from the offer's dates, and there is no
 * earlier state to reset.
 */
export default function OfferCalendarModal({
  system,
  rangeStart,
  rangeEnd,
  onClose,
  onUseDates,
}: {
  system: CalendarSystem;
  /** The offer's start date, YYYY-MM-DD, or "". */
  rangeStart: string;
  /** The offer's end date, YYYY-MM-DD, or "". */
  rangeEnd: string;
  onClose: () => void;
  onUseDates: (event: HolidayEvent) => void;
}) {
  const today = nepalToday();
  // Opens on the offer's own month when it has dates, so the shaded range is
  // on screen straight away rather than a few clicks of "next" away.
  const [cursor, setCursor] = useState<Cursor>(() =>
    initialCursor(system, rangeStart || today),
  );

  const grid: MonthGrid =
    system === "bs"
      ? bsMonthGrid(cursor.year, cursor.monthIndex)
      : adMonthGrid(cursor.year, cursor.monthIndex);

  const first = grid.days[0].iso;
  const last = grid.days[grid.days.length - 1].iso;
  const monthEvents = eventsBetween(first, last);

  // Holidays are only loaded for one BS year. Outside it an empty month would
  // otherwise read as a month with no holidays.
  const coveredStart = HOLIDAY_EVENTS[0]?.start ?? "";
  const coveredEnd = bsMonthGrid(COVERED_BS_YEAR, 11).days.at(-1)?.iso ?? "";
  const outsideCoverage = last < coveredStart || first > coveredEnd;

  const inRange = (iso: string) =>
    !!rangeStart && !!rangeEnd && iso >= rangeStart && iso <= rangeEnd;

  const title = system === "bs" ? "Nepali calendar" : "English calendar";

  return (
    <ModalShell
      open
      onClose={onClose}
      title={title}
      subtitle="Public holidays and festivals for planning an offer"
      icon={CalendarDays}
      iconColor="text-violet-600"
      iconBgColor="bg-violet-50"
      maxWidth="max-w-2xl"
      bodyMaxHeight="max-h-[75vh]"
    >
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCursor((c) => step(c, -1))}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center" aria-live="polite">
          <p className="text-[15px] font-bold text-gray-900">{grid.title}</p>
          <p className="text-[11px] text-gray-400">{grid.subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCursor(initialCursor(system, today))}
            className="h-9 rounded-lg border border-gray-200 px-3 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => step(c, 1))}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`pb-1 text-[11px] font-semibold uppercase ${
              i === SATURDAY ? "text-red-500" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}

        {Array.from({ length: grid.leading }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}

        {grid.days.map((day) => {
          const events = monthEvents.filter(
            (e) => e.start <= day.iso && e.end >= day.iso,
          );
          const national = events.some((e) => e.scope === "national");
          const isToday = day.iso === today;
          const shaded = inRange(day.iso);
          const red = national || day.weekday === SATURDAY;

          return (
            <div
              key={day.iso}
              title={events.map((e) => e.label).join(", ") || undefined}
              aria-label={[
                `${day.primary}`,
                events.map((e) => e.label).join(", "),
                shaded ? "within the offer's dates" : "",
              ]
                .filter(Boolean)
                .join(", ")}
              className={`relative flex h-14 flex-col items-center justify-center rounded-lg border text-center ${
                shaded
                  ? "border-violet-200 bg-violet-50"
                  : "border-transparent bg-gray-50/60"
              } ${isToday ? "ring-2 ring-blue-500" : ""}`}
            >
              <span
                className={`text-[15px] font-semibold leading-none ${
                  red ? "text-red-600" : "text-gray-800"
                }`}
              >
                {day.primary}
              </span>
              <span className="mt-1 text-[10px] leading-none text-gray-400">
                {day.secondary}
              </span>
              {events.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5" aria-hidden>
                  {events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${SCOPE_STYLE[e.scope].dot}`}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Public holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Some groups or
          the Valley
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-pink-500" /> Offer occasion
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-violet-200 bg-violet-50" />
          Your offer&apos;s dates
        </span>
      </div>

      {/* This month's holidays */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          This month
        </p>

        {outsideCoverage ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800">
            Holidays are loaded for {COVERED_BS_YEAR} BS only (14 Apr 2026 – 13
            Apr 2027). Dates for other years are added when the government
            publishes their holiday list.
          </p>
        ) : monthEvents.length === 0 ? (
          <p className="text-[12px] text-gray-400">
            No public holidays or occasions this month.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {monthEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {event.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCOPE_STYLE[event.scope].dot}`}
                      aria-hidden
                    />
                    {event.label}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {system === "bs"
                      ? `${event.bsLabel} · ${adRangeLabel(event)}`
                      : `${adRangeLabel(event)} · ${event.bsLabel}`}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {event.note ?? SCOPE_STYLE[event.scope].label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUseDates(event)}
                  className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  Use these dates
                </button>
              </li>
            ))}
          </ul>
        )}

        {!outsideCoverage && (
          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            Not shown, because their dates are set when observed:{" "}
            {UNDATED_HOLIDAYS.join(", ")}.
          </p>
        )}
      </div>
    </ModalShell>
  );
}
