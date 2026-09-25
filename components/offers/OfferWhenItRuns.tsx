"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Loader2,
  Lock,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useOfferForm, type ActiveHours } from "@/providers/OfferFormContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OfferStepCard from "./OfferStepCard";
import { lockFor, unlockLabel, useAiFillLock } from "./useAiFillLock";
import { festivalDatesUnknown, festivalOccurrence } from "./festivalDates";
import { FESTIVALS } from "./festivals";
import { toBsLabel } from "@/lib/nepaliDate";
import type { HolidayEvent } from "@/lib/holidayCalendar";
import { useHolidayEvents } from "@/hooks/useHolidayEvents";
import OfferCalendarModal, { type CalendarSystem } from "./OfferCalendarModal";

/**
 * Monday first, so the week reads as working days then the weekend.
 *
 * Starting on Sunday split the weekend across both ends of the row — Sun at
 * the start, Sat at the end — and a picked weekend then read "Sun, Sat" in the
 * preview. The order is display only: days are saved by name, so it changes
 * nothing that is stored.
 */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Weekdays are Monday to Friday and the weekend is Saturday and Sunday.
 *
 * These were Sunday–Thursday and Friday–Saturday, on the note that Nepal's
 * weekend is Friday and Saturday. It is not — that is the Gulf's week — so
 * both buttons selected days nobody asked for. The AI fill instructions in
 * app/api/offers/ai-schedule/route.ts define the same two words and must
 * agree with these, or "weekdays" typed into the box would pick different
 * days from the button.
 */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKEND = ["Sat", "Sun"];

const FIELD =
  "h-10 w-full rounded-xl border border-[#dadce0] bg-white px-3.5 text-sm text-[#3c4043] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const LABEL = "mb-1.5 block text-[13px] font-medium text-[#3c4043]";

/**
 * The AI service's error codes, in words. AI Fill runs on the business's own
 * provider key, so its setup problems read the same as on the AI Insights page.
 */
const AI_FILL_ERRORS: Record<string, string> = {
  NOT_CONFIGURED: "Add an AI provider key in Settings to use AI fill",
  AI_DISABLED: "AI features are turned off in Settings",
  AI_KEY_INVALID: "Your AI key was rejected — check it in Settings",
  KEY_UNREADABLE: "Your AI key could not be read — add it again in Settings",
  AI_MODEL_UNAVAILABLE:
    "That AI model isn't available — pick another in Settings",
  AI_UNAVAILABLE: "Your AI provider is busy — try again in a moment",
  AUTH_REQUIRED: "Your session has ended — sign in again",
};

/**
 * The Bikram Sambat reading of a picked date.
 *
 * The input can only speak Gregorian, and a Nepali business plans in BS — so
 * the date is shown in both rather than leaving the owner to convert 09/10 in
 * their head.
 */
function BsDate({ value }: { value: string }) {
  // "6 Kartik", not "06 Kartik": the calendar popups write days this way.
  const label = toBsLabel(value)?.replace(/^0/, "");
  if (!label) return null;
  return (
    <p className="mt-1.5 text-[13px] font-medium text-emerald-600">{label}</p>
  );
}

/** Step 3 — the dates, days and hours the offer is live. */
export default function OfferWhenItRuns() {
  const { form, updateField, patchForm } = useOfferForm();
  const [aiFilling, setAiFilling] = useState(false);
  // Set while the AI quota is used up; the button dims and says until when.
  const { lock: aiLock, setLock: setAiLock } = useAiFillLock();
  // The notice plus Google's calendar, so festivals keep dating themselves
  // after the notice's year. The same list goes to the calendar popups.
  const holidays = useHolidayEvents();
  // Which calendar is open, if any. One piece of state rather than two
  // booleans, so both can never be open at once.
  const [calendar, setCalendar] = useState<CalendarSystem | null>(null);

  /**
   * Take a holiday's dates from the calendar.
   *
   * A holiday the festival list knows selects that festival, so the promo code
   * and the preview name it exactly as picking it would. One the list does not
   * know — Constitution Day, Indra Jatra — becomes the event's typed name
   * instead, so the offer is still labelled with what it runs for.
   */
  const applyHolidayDates = (event: HolidayEvent) => {
    patchForm({
      startDate: event.start,
      endDate: event.end,
      ...(event.festivalId
        ? { festival: event.festivalId, customFestival: "" }
        : { festival: "", customFestival: event.label }),
    });
    setCalendar(null);
    toast.success(`Dates set to ${event.label}`);
  };

  /**
   * Picking an occasion dates the offer, because that is what picking it
   * means — nobody chooses "Christmas" and then wants to look up 25 December.
   * Both dates move together so the window is never half-updated.
   *
   * It also clears a typed event name: the offer now runs for the festival,
   * and leaving the name in the box would say it runs for both.
   *
   * The dates come from the same official calendar the Nepali calendar popup
   * uses, so picking Dashain here and "Use these dates" there give the same
   * window. A festival the calendar cannot date keeps the current dates and
   * asks for them (see `needsManualDates`).
   */
  const chooseFestival = (id: string) => {
    if (form.festival === id) {
      updateField("festival", "");
      return;
    }

    const occurrence = festivalOccurrence(id, undefined, holidays);
    patchForm({
      festival: id,
      customFestival: "",
      ...(occurrence
        ? { startDate: occurrence.startDate, endDate: occurrence.endDate }
        : {}),
    });
    if (occurrence) {
      toast.success(
        `Dates set to ${occurrence.label}${occurrence.bsLabel ? ` · ${occurrence.bsLabel}` : ""}`,
      );
    }
  };

  /**
   * Naming an occasion of your own replaces a picked festival, for the same
   * reason picking one clears the name. The dates are left alone: a typed
   * event has no calendar here to date it from.
   */
  const nameOwnEvent = (name: string) => {
    patchForm(
      form.festival
        ? { customFestival: name, festival: "" }
        : { customFestival: name },
    );
  };

  const customEvent = form.customFestival.trim();

  // Selected, but its dates move each year and this app cannot work them out.
  const needsManualDates = festivalDatesUnknown(form.festival, holidays);

  const toggleDay = (day: string) => {
    const next = form.repeatingDays.includes(day)
      ? form.repeatingDays.filter((d) => d !== day)
      : [...form.repeatingDays, day];
    // Kept in week order rather than click order, so "Fri, Sat" never reads
    // as "Sat, Fri" in the preview's terms.
    updateField(
      "repeatingDays",
      DAYS.filter((d) => next.includes(d)),
    );
  };

  /**
   * Read the event box as a sentence and set this step from it.
   *
   * Gemini, on the business's own key, answers with the occasion, the days,
   * the hours and the dates. It is given Nepal's holiday calendar (the notice
   * plus Google's) to take festival dates from, so its dates match the tabs
   * and the calendar popups; the server checks which dates really came from
   * that calendar and which the model worked out itself.
   */
  const aiFill = async () => {
    const prompt = customEvent;
    if (!prompt || aiFilling || aiLock) return;

    setAiFilling(true);
    try {
      const res = await fetch("/api/offers/ai-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = typeof json?.error === "string" ? json.error : "";
        const retryAfter =
          Number(json?.retryAfter ?? res.headers.get("retry-after")) ||
          undefined;
        const lock = lockFor(code, retryAfter);
        if (lock) {
          setAiLock(lock);
          toast.error(
            `${lock.reason} AI fill unlocks ${unlockLabel(lock.until)}.`,
          );
          return;
        }
        toast.error(
          AI_FILL_ERRORS[code.replace(/^GEMINI_/, "AI_")] ||
            code ||
            "Could not fill the schedule",
        );
        return;
      }

      const d = json.data as {
        festivalId: string;
        startDate: string;
        endDate: string;
        dateSource: "calendar" | "estimate" | "explicit" | "";
        repeatingDays: string[];
        startTime: string;
        endTime: string;
        activeHours: ActiveHours;
      };

      // Only the fields that came back are written, so a partial answer tops
      // up the form rather than wiping what was already set by hand.
      const patch: Partial<typeof form> = {};

      if (d.festivalId) {
        // What was typed named a festival the list knows, so that festival
        // takes over and the typed text goes — it was a description of the
        // occasion, not a second one.
        patch.festival = d.festivalId;
        patch.customFestival = "";
      }
      // Gemini's dates, checked on the server; for a festival with none, the
      // server already fell back to the calendar's.
      if (d.startDate && d.endDate) {
        patch.startDate = d.startDate;
        patch.endDate = d.endDate;
      }

      if (d.repeatingDays.length > 0) patch.repeatingDays = d.repeatingDays;
      if (d.startTime && d.endTime) {
        patch.startTime = d.startTime;
        patch.endTime = d.endTime;
      }
      if (d.activeHours) patch.activeHours = d.activeHours;

      if (Object.keys(patch).length === 0) {
        toast("Nothing to fill from that — try naming a festival or days");
        return;
      }

      // The box is no longer cleared on success. It holds the event's name
      // now, not a throwaway search, and wiping it would unname the offer.
      patchForm(patch);
      toast.success(
        d.dateSource === "calendar"
          ? "Schedule filled — dates from Nepal's holiday calendar"
          : d.dateSource === "estimate"
            ? "Schedule filled — dates worked out by AI, please double-check them"
            : d.startDate
              ? "Schedule filled — check the dates below"
              : "Schedule filled — dates not known yet, please set them below",
      );
    } catch {
      toast.error("Could not reach the AI service");
    } finally {
      setAiFilling(false);
    }
  };

  // "7 days", shown beside the heading once both dates are set.
  const runDays =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? Math.round(
          (Date.parse(`${form.endDate}T00:00:00Z`) -
            Date.parse(`${form.startDate}T00:00:00Z`)) /
            86_400_000,
        ) + 1
      : null;

  const quickPicks: { label: string; days: string[] }[] = [
    { label: "Every day", days: DAYS },
    { label: "Weekdays", days: WEEKDAYS },
    { label: "Weekend (Sat–Sun)", days: WEEKEND },
    { label: "Clear", days: [] },
  ];

  return (
    <OfferStepCard
      step={3}
      title="When It Runs"
      subtitle="Pick a festival occasion or choose custom start and end dates."
      icon={CalendarClock}
      accent="rose"
    >
      {/* Occasions */}
      <div>
        <label htmlFor="offer-custom-event" className={LABEL}>
          Occasion / Festival
        </label>

        <div className="flex items-center gap-2">
          {/* min-w-0: an <input> carries an intrinsic width from its default
              `size`, and a flex item will not shrink below that on its own —
              so this row would hold the card open rather than let the field
              narrow. */}
          <div className="relative min-w-0 flex-1">
            <PartyPopper
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0a6]"
            />
            <input
              id="offer-custom-event"
              type="text"
              value={form.customFestival}
              onChange={(e) => nameOwnEvent(e.target.value)}
              placeholder="Name your own event, e.g. Store anniversary"
              maxLength={60}
              className={`${FIELD} pl-9 ${form.customFestival ? "pr-9" : ""}`}
            />
            {form.customFestival && (
              <button
                type="button"
                onClick={() => updateField("customFestival", "")}
                aria-label="Clear event name"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-[#9aa0a6] transition hover:bg-[#f1f3f4] hover:text-[#5f6368]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* The tooltip sits on a wrapper: a disabled button gets no hover
              events, and the locked state is exactly when it must explain. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0" tabIndex={aiLock ? 0 : -1}>
                <button
                  type="button"
                  onClick={aiFill}
                  disabled={!customEvent || aiFilling || !!aiLock}
                  aria-label={aiLock ? "AI fill is locked" : "AI fill"}
                  className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-semibold transition disabled:cursor-not-allowed ${
                    aiLock
                      ? "border-[#dadce0] bg-[#f1f3f4] text-[#9aa0a6] disabled:pointer-events-none"
                      : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:pointer-events-none disabled:opacity-50"
                  }`}
                >
                  {aiFilling ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : aiLock ? (
                    <Lock size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  AI fill
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 text-center">
              {aiLock
                ? `${aiLock.reason} AI fill unlocks ${unlockLabel(aiLock.until)}. Festival tabs and the calendars still work.`
                : customEvent
                  ? "Fill this step, dates included, from what you typed"
                  : "Name or describe the event first"}
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="mt-3 text-[12px] text-[#5f6368]">Or pick a festival</p>

        {/* One scrolling row rather than a wrapping block: the list only grows
            as festivals are added, and a wrap would push the dates further
            down the step every time one was. */}
        <div className="mt-1.5 rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FESTIVALS.map((f) => {
              const active = form.festival === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  // Clicking the chosen one again clears it — an occasion is
                  // a label, and there has to be a way to take it back off.
                  onClick={() => chooseFestival(f.id)}
                  aria-pressed={active}
                  className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]"
                  }`}
                >
                  <span className="text-base leading-none">{f.icon}</span>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dates: one card for everything about when the offer starts and
          ends — the fields, the calendars to pick them from, and the note
          when they are the merchant's to set. */}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#dadce0]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaed] bg-[#f8f9fa] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[#5f6368]" />
            <p className="text-[13px] font-semibold text-[#3c4043]">Dates</p>
            {runDays !== null && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#5f6368] ring-1 ring-[#dadce0]">
                {runDays} {runDays === 1 ? "day" : "days"}
              </span>
            )}
          </div>

          {/* The calendars in their own colours, matching the popups. */}
          <div className="flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-[#dadce0]">
            <span className="px-2 text-[11px] text-[#9aa0a6] max-sm:hidden">
              Browse holidays
            </span>
            <button
              type="button"
              onClick={() => setCalendar("bs")}
              aria-haspopup="dialog"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[#3c4043] transition-colors hover:bg-rose-50 hover:text-rose-700"
            >
              <CalendarDays size={14} className="text-rose-500" />
              Nepali calendar
            </button>
            <button
              type="button"
              onClick={() => setCalendar("ad")}
              aria-haspopup="dialog"
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[#3c4043] transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              <CalendarDays size={14} className="text-teal-500" />
              English calendar
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* An occasion whose dates this app cannot compute still labels the
              offer, so the card says plainly that the dates are the
              merchant's to set rather than leaving them looking broken. */}
          {(needsManualDates || customEvent) && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[12px] leading-relaxed text-amber-800">
                {customEvent
                  ? "Set the start and end dates for your event, or pick them from a calendar."
                  : "This year's dates for this occasion aren't in the holiday calendar yet, so set the start and end dates yourself."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
            <div>
              <label htmlFor="offer-start-date" className={LABEL}>
                Start date
              </label>
              <input
                id="offer-start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className={FIELD}
              />
              <BsDate value={form.startDate} />
            </div>

            <ArrowRight
              size={16}
              className="mt-10 hidden text-[#dadce0] sm:block"
              aria-hidden
            />

            <div>
              <label htmlFor="offer-end-date" className={LABEL}>
                End date
              </label>
              <input
                id="offer-end-date"
                type="date"
                value={form.endDate}
                // An end before the start would run an offer for negative
                // days; the browser's own picker enforces it once a start
                // exists.
                min={form.startDate || undefined}
                onChange={(e) => updateField("endDate", e.target.value)}
                className={FIELD}
              />
              <BsDate value={form.endDate} />
            </div>
          </div>
        </div>
      </div>

      {calendar && (
        <OfferCalendarModal
          system={calendar}
          rangeStart={form.startDate}
          rangeEnd={form.endDate}
          events={holidays}
          onClose={() => setCalendar(null)}
          onUseDates={applyHolidayDates}
        />
      )}

      {/* Days of week */}
      <div className="mt-6">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-[#3c4043]">
            Specific days of week (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => updateField("repeatingDays", pick.days)}
                className="cursor-pointer rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
              >
                {pick.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const active = form.repeatingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={active}
                className={`h-10 w-16 cursor-pointer rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-gray-800 text-white"
                    : "border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hours */}
      <div className="mt-6 border-t border-[#e8eaed] pt-5">
        <p className={LABEL}>Active hours window (optional)</p>
        <div className="flex flex-row items-center gap-3">
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => updateField("startTime", e.target.value)}
            className={`${FIELD} w-auto`}
          />
          <span className="text-[13px] text-[#5f6368]">to</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => updateField("endTime", e.target.value)}
            className={`${FIELD} w-auto`}
          />
        </div>
      </div>
    </OfferStepCard>
  );
}
