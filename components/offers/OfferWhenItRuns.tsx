"use client";

import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Loader2,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useOfferForm, type ActiveHours } from "@/providers/OfferFormContext";
import OfferStepCard from "./OfferStepCard";
import { festivalDatesUnknown, festivalWindow } from "./festivalDates";
import { FESTIVALS } from "./festivals";
import { toBsLabel } from "@/lib/nepaliDate";
import type { HolidayEvent } from "@/lib/holidayCalendar";
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
  "h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20";

const LABEL = "mb-1.5 block text-[13px] font-medium text-gray-700";

/**
 * The Bikram Sambat reading of a picked date.
 *
 * The input can only speak Gregorian, and a Nepali business plans in BS — so
 * the date is shown in both rather than leaving the owner to convert 09/10 in
 * their head.
 */
function BsDate({ value }: { value: string }) {
  const label = toBsLabel(value);
  if (!label) return null;
  return (
    <p className="mt-1.5 text-[13px] font-medium text-emerald-600">{label}</p>
  );
}

/** Step 3 — the dates, days and hours the offer is live. */
export default function OfferWhenItRuns() {
  const { form, updateField, patchForm } = useOfferForm();
  const [aiFilling, setAiFilling] = useState(false);
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
   */
  const chooseFestival = (id: string) => {
    if (form.festival === id) {
      updateField("festival", "");
      return;
    }

    const window = festivalWindow(id);
    patchForm({ festival: id, customFestival: "", ...(window ?? {}) });
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
  const needsManualDates = festivalDatesUnknown(form.festival);

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
   * The model only classifies — which occasion, which days, which hours. Dates
   * for a festival are then taken from `festivalWindow`, the app's own
   * calendar, so a campaign can never be dated to a festival that has passed.
   */
  const aiFill = async () => {
    const prompt = customEvent;
    if (!prompt || aiFilling) return;

    setAiFilling(true);
    try {
      const res = await fetch("/api/offers/ai-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error ?? "Could not fill the schedule");
        return;
      }

      const d = json.data as {
        festivalId: string;
        startDate: string;
        endDate: string;
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
        const window = festivalWindow(d.festivalId);
        if (window) Object.assign(patch, window);
      } else if (d.startDate) {
        patch.startDate = d.startDate;
        if (d.endDate) patch.endDate = d.endDate;
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
      toast.success("Schedule filled — check the dates below");
    } catch {
      toast.error("Could not reach the AI service");
    } finally {
      setAiFilling(false);
    }
  };

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
      accent="violet"
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
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={aiFill}
            disabled={!customEvent || aiFilling}
            title={
              customEvent
                ? "Fill this step from what you typed"
                : "Name or describe the event first"
            }
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 text-[13px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiFilling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            AI fill
          </button>
        </div>

        <p className="mt-3 text-[12px] text-gray-500">Or pick a festival</p>

        {/* One scrolling row rather than a wrapping block: the list only grows
            as festivals are added, and a wrap would push the dates further
            down the step every time one was. */}
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
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
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
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

      {/* An occasion whose dates this app cannot compute still labels the
          offer, so the step says plainly that the dates are the merchant's to
          set rather than leaving them looking broken. */}
      {(needsManualDates || customEvent) && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-relaxed text-amber-800">
            {customEvent
              ? "Set the start and end dates for your event below."
              : "This occasion falls on different dates each year, so set the start and end dates below yourself."}
          </p>
        </div>
      )}

      {/* Calendars */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-gray-700">Dates</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { system: "bs", label: "Nepali calendar" },
              { system: "ad", label: "English calendar" },
            ] as const
          ).map(({ system, label }) => (
            <button
              key={system}
              type="button"
              onClick={() => setCalendar(system)}
              aria-haspopup="dialog"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <CalendarDays size={14} className="text-violet-600" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {calendar && (
        <OfferCalendarModal
          system={calendar}
          rangeStart={form.startDate}
          rangeEnd={form.endDate}
          onClose={() => setCalendar(null)}
          onUseDates={applyHolidayDates}
        />
      )}

      {/* Dates */}
      <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Start date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className={FIELD}
          />
          <BsDate value={form.startDate} />
        </div>
        <div>
          <label className={LABEL}>End date</label>
          <input
            type="date"
            value={form.endDate}
            // An end before the start would run an offer for negative days;
            // the browser's own picker enforces it once a start exists.
            min={form.startDate || undefined}
            onChange={(e) => updateField("endDate", e.target.value)}
            className={FIELD}
          />
          <BsDate value={form.endDate} />
        </div>
      </div>

      {/* Days of week */}
      <div className="mt-6">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-gray-700">
            Specific days of week (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => updateField("repeatingDays", pick.days)}
                className="h-9 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
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
                className={`h-10 w-14 cursor-pointer rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hours */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className={LABEL}>Active hours window (optional)</p>
        <div className="flex flex-row items-center gap-3">
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => updateField("startTime", e.target.value)}
            className={`${FIELD} w-auto`}
          />
          <span className="text-[13px] text-gray-500">to</span>
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
