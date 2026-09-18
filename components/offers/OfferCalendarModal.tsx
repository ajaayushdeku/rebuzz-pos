"use client";

import { useState, type CSSProperties } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  X,
} from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import {
  HOLIDAY_EVENTS,
  UNDATED_HOLIDAYS,
  adMonthGrid,
  bsMonthGrid,
  bsMonthOf,
  coverageOf,
  eventsBetween,
  type HolidayEvent,
  type HolidayScope,
  type MonthGrid,
} from "@/lib/holidayCalendar";
import { nepalToday } from "@/lib/nepalDate";
import { toBsLabel } from "@/lib/nepaliDate";

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
  occasion: { dot: "bg-indigo-500", label: "Offer occasion" },
};

/**
 * Each calendar's accent: rose for the Nepali calendar, teal for the English
 * one, so the two are told apart at a glance. Set as CSS variables on the
 * popup's body and read by its classes (`bg-(color:--cal-50)`), rather than
 * every class written out twice. Tailwind's own rose and teal, in hex.
 */
const ACCENT: Record<CalendarSystem, CSSProperties> = {
  bs: {
    "--cal-50": "#fff1f2",
    "--cal-100": "#ffe4e6",
    "--cal-200": "#fecdd3",
    "--cal-400": "#fb7185",
    "--cal-500": "#f43f5e",
    "--cal-600": "#e11d48",
    "--cal-700": "#be123c",
  } as CSSProperties,
  ad: {
    "--cal-50": "#f0fdfa",
    "--cal-100": "#ccfbf1",
    "--cal-200": "#99f6e4",
    "--cal-400": "#2dd4bf",
    "--cal-500": "#14b8a6",
    "--cal-600": "#0d9488",
    "--cal-700": "#0f766e",
  } as CSSProperties,
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

/** "13 Apr 2027". */
function adDayLabel(iso: string): string {
  return adRangeLabel({ start: iso, end: iso });
}

/** "2 Aswin 2083 BS" — without the converter's leading zero, like the list. */
function bsDayLabel(iso: string): string {
  return toBsLabel(iso)?.replace(/^0/, "") ?? "";
}

/**
 * A holiday's Gregorian dates, saying each part once: "8 – 12 Nov 2026",
 * "17 Oct – 2 Nov 2026", and the full form only across a new year.
 */
function adRangeLabel(event: Pick<HolidayEvent, "start" | "end">): string {
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

/** A date as a calendar-leaf badge: the day large, the month short under it. */
function dateBadge(
  iso: string,
  system: CalendarSystem,
): { day: string; month: string } {
  if (system === "bs") {
    const [day = "", month = ""] = bsDayLabel(iso).split(" ");
    return { day, month: month.slice(0, 3) };
  }
  const at = new Date(`${iso}T12:00:00`);
  return {
    day: String(at.getDate()),
    month: at.toLocaleDateString("en-GB", { month: "short" }),
  };
}

/** One holiday, with its dates in both calendars and a button to use them. */
function EventRow({
  event,
  system,
  onUseDates,
}: {
  event: HolidayEvent;
  system: CalendarSystem;
  onUseDates: (event: HolidayEvent) => void;
}) {
  const badge = dateBadge(event.start, system);
  const primary = system === "bs" ? event.bsLabel : adRangeLabel(event);
  const secondary = system === "bs" ? adRangeLabel(event) : event.bsLabel;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 transition hover:border-(color:--cal-200) hover:shadow-sm sm:flex-nowrap">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-(color:--cal-50) text-(color:--cal-700)">
        <span className="text-[16px] font-bold leading-none">{badge.day}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-wide">
          {badge.month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
          <span className="text-[15px] leading-none" aria-hidden>
            {event.icon}
          </span>
          <span className="truncate">{event.label}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-gray-600">{primary}</p>
        <p className="flex items-start gap-1.5 text-[11px] text-gray-400">
          <span
            className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${SCOPE_STYLE[event.scope].dot}`}
            aria-hidden
          />
          <span className="min-w-0">
            {secondary} · {event.note ?? SCOPE_STYLE[event.scope].label}
            {event.source === "google" && " · Google calendar"}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onUseDates(event)}
        className="w-full shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 sm:w-auto text-[11px] font-semibold text-(color:--cal-600) ring-1 ring-(color:--cal-200) transition hover:bg-(color:--cal-600) hover:text-white hover:ring-(color:--cal-600)"
      >
        Use these dates
      </button>
    </li>
  );
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
 * Laid out as the month on the left and a side panel on the right: the day
 * clicked in the grid at the top of the panel, the month's holidays under it.
 * On a phone the panel drops below the month. The offer's current start and
 * end dates are shaded, so the calendar answers "does my offer cover Tihar?"
 * at a glance, and any holiday can be applied to the offer from either list.
 *
 * Mounted only while open, like the other modals built on ModalShell, so it
 * opens on the current month every time and there is no earlier state to
 * reset.
 */
export default function OfferCalendarModal({
  system,
  rangeStart,
  rangeEnd,
  events = HOLIDAY_EVENTS,
  onClose,
  onUseDates,
}: {
  system: CalendarSystem;
  /** The offer's start date, YYYY-MM-DD, or "". */
  rangeStart: string;
  /** The offer's end date, YYYY-MM-DD, or "". */
  rangeEnd: string;
  /** The holidays to show: the notice merged with Google's calendar. */
  events?: HolidayEvent[];
  onClose: () => void;
  onUseDates: (event: HolidayEvent) => void;
}) {
  const today = nepalToday();
  // Always opens on the current month. Opening on the offer's start date
  // jumped to next year whenever the offer was set for a later festival,
  // which read as the calendar showing the wrong month.
  const [cursor, setCursor] = useState<Cursor>(() =>
    initialCursor(system, today),
  );
  // The day clicked in the grid, whose holidays are shown on their own above
  // the month's list. Cleared on leaving the month it is in.
  const [selected, setSelected] = useState<string | null>(null);

  const goTo = (next: Cursor) => {
    setCursor(next);
    setSelected(null);
  };

  const grid: MonthGrid =
    system === "bs"
      ? bsMonthGrid(cursor.year, cursor.monthIndex)
      : adMonthGrid(cursor.year, cursor.monthIndex);

  const first = grid.days[0].iso;
  const last = grid.days[grid.days.length - 1].iso;
  const monthEvents = eventsBetween(first, last, events);

  // Holidays reach as far as the notice's year, or Google's calendar when it
  // goes further. Beyond that an empty month would otherwise read as a month
  // with no holidays.
  const coverage = coverageOf(events);
  const outsideCoverage = last < coverage.start || first > coverage.end;

  const selectedEvents = selected
    ? monthEvents.filter((e) => e.start <= selected && e.end >= selected)
    : [];

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
      iconColor={system === "bs" ? "text-rose-600" : "text-teal-600"}
      iconBgColor={system === "bs" ? "bg-rose-50" : "bg-teal-50"}
      maxWidth="max-w-5xl"
      bodyMaxHeight="max-h-[80vh]"
    >
      {/* Both columns stick to the top of the popup's scroll area, as the
          API Keys page's form and guide do: scrolling a long holiday list
          keeps the month in view beside it. */}
      <div
        style={ACCENT[system]}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        {/* ── The month ─────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl lg:sticky lg:top-0 border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 bg-linear-to-br from-(color:--cal-500) to-(color:--cal-600) px-4 py-3.5 text-white">
            <div aria-live="polite" className="min-w-0">
              <p className="text-[18px] font-bold leading-tight">
                {grid.title}
              </p>
              <p className="text-[12px] text-(color:--cal-100)">
                {grid.subtitle}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => goTo(step(cursor, -1))}
                aria-label="Previous month"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  goTo(initialCursor(system, today));
                  setSelected(today);
                }}
                className="h-8 cursor-pointer rounded-lg bg-white px-3 text-[12px] font-semibold text-(color:--cal-600) shadow-sm transition hover:bg-(color:--cal-50)"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => goTo(step(cursor, 1))}
                aria-label="Next month"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 p-3 text-center sm:p-4">
            {WEEKDAY_HEADERS.map((d, i) => (
              <div
                key={d}
                className={`pb-1.5 text-[11px] font-semibold uppercase tracking-wide ${
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
              const dayEvents = monthEvents.filter(
                (e) => e.start <= day.iso && e.end >= day.iso,
              );
              const national = dayEvents.some((e) => e.scope === "national");
              const isToday = day.iso === today;
              const isSelected = day.iso === selected;
              const shaded = inRange(day.iso);
              const red = national || day.weekday === SATURDAY;

              return (
                <button
                  type="button"
                  key={day.iso}
                  onClick={() => setSelected(isSelected ? null : day.iso)}
                  aria-pressed={isSelected}
                  title={dayEvents.map((e) => e.label).join(", ") || undefined}
                  aria-label={[
                    `${day.primary}`,
                    dayEvents.map((e) => e.label).join(", "),
                    shaded ? "within the offer's dates" : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  className={`relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-xl text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(color:--cal-400) sm:h-16 ${
                    isSelected
                      ? "bg-(color:--cal-600) shadow-md shadow-(color:--cal-600)/25"
                      : shaded
                        ? "bg-(color:--cal-50) hover:bg-(color:--cal-100)"
                        : "hover:bg-gray-50"
                  } ${isToday && !isSelected ? "ring-2 ring-inset ring-(color:--cal-400)" : ""}`}
                >
                  <span
                    className={`text-[15px] font-semibold leading-none ${
                      isSelected
                        ? "text-white"
                        : red
                          ? "text-red-600"
                          : "text-gray-800"
                    }`}
                  >
                    {day.primary}
                  </span>
                  <span
                    className={`mt-1 text-[10px] leading-none ${
                      isSelected ? "text-(color:--cal-100)" : "text-gray-400"
                    }`}
                  >
                    {day.secondary}
                  </span>
                  {dayEvents.length > 0 && (
                    <span
                      className="absolute bottom-1.5 flex gap-0.5"
                      aria-hidden
                    >
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-white" : SCOPE_STYLE[e.scope].dot
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Public
              holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Some groups
              or the Valley
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Offer
              occasion
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-(color:--cal-50) ring-1 ring-(color:--cal-200)" />
              Your offer&apos;s dates
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-inset ring-(color:--cal-400)" />
              Today
            </span>
          </div>
        </section>

        {/* ── Side panel ────────────────────────────────────────────── */}
        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-0">
          {/* The clicked day's holidays, on their own above the month's */}
          {selected ? (
            <div
              data-testid="selected-day"
              className="rounded-2xl border border-(color:--cal-200) bg-linear-to-b from-(color:--cal-50) to-white p-3.5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(color:--cal-600)">
                    Selected day
                    {selected === today && (
                      <span className="ml-2 rounded-full bg-(color:--cal-600) px-1.5 py-0.5 text-[9px] tracking-wide text-white">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-gray-900">
                    {system === "bs"
                      ? bsDayLabel(selected)
                      : adDayLabel(selected)}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {system === "bs"
                      ? adDayLabel(selected)
                      : bsDayLabel(selected)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Clear selected day"
                  className="cursor-pointer rounded-lg p-1.5 text-(color:--cal-400) transition hover:bg-(color:--cal-100) hover:text-(color:--cal-700)"
                >
                  <X size={15} />
                </button>
              </div>

              {selectedEvents.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {selectedEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      system={system}
                      onUseDates={onUseDates}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-white px-3 py-3 text-center text-[12px] text-gray-500 ring-1 ring-gray-100">
                  {outsideCoverage
                    ? "Holidays aren't listed this far ahead yet."
                    : "No public holidays or occasions on this day."}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(color:--cal-50) text-(color:--cal-500)">
                <MousePointerClick size={16} />
              </span>
              <p className="text-[12px] leading-relaxed text-gray-500">
                Pick a day on the calendar to see its holidays here.
              </p>
            </div>
          )}

          {/* This month's holidays */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                This month
              </p>
              {!outsideCoverage && monthEvents.length > 0 && (
                <span className="rounded-full bg-(color:--cal-50) px-2 py-0.5 text-[11px] font-semibold text-(color:--cal-600)">
                  {monthEvents.length}{" "}
                  {monthEvents.length === 1 ? "holiday" : "holidays"}
                </span>
              )}
            </div>

            {outsideCoverage ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800">
                Holidays are listed up to {adDayLabel(coverage.end)}. Later
                dates appear here automatically once Google&apos;s Nepal holiday
                calendar publishes them, usually late in the year before.
              </p>
            ) : monthEvents.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-3 text-center text-[12px] text-gray-400">
                No public holidays or occasions this month.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {monthEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    system={system}
                    onUseDates={onUseDates}
                  />
                ))}
              </ul>
            )}

            {!outsideCoverage && (
              <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
                Not shown, because their dates are set when observed:{" "}
                {UNDATED_HOLIDAYS.join(", ")}.
              </p>
            )}
          </section>
        </aside>
      </div>
    </ModalShell>
  );
}
