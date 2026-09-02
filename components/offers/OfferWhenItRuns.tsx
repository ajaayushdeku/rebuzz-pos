"use client";

import { CalendarClock } from "lucide-react";

import { useOfferForm } from "@/providers/OfferFormContext";
import OfferStepCard from "./OfferStepCard";
import { festivalDatesUnknown, festivalWindow } from "./festivalDates";
import { FESTIVALS } from "./festivals";
import { toBsLabel } from "@/lib/nepaliDate";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Nepal's week: Friday and Saturday are the weekend, so "weekdays" is Sunday
 * through Thursday rather than the Mon–Fri a Western default would assume.
 */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"];
const WEEKEND = ["Fri", "Sat"];

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

  /**
   * Picking an occasion dates the offer, because that is what picking it
   * means — nobody chooses "Christmas" and then wants to look up 25 December.
   * Both dates move together so the window is never half-updated.
   */
  const chooseFestival = (id: string) => {
    if (form.festival === id) {
      updateField("festival", "");
      return;
    }

    const window = festivalWindow(id);
    patchForm(window ? { festival: id, ...window } : { festival: id });
  };

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

  const quickPicks: { label: string; days: string[] }[] = [
    { label: "Every day", days: DAYS },
    { label: "Weekdays", days: WEEKDAYS },
    { label: "Weekend (Fri–Sat)", days: WEEKEND },
    { label: "Clear", days: [] },
  ];

  return (
    <OfferStepCard
      step={3}
      title="When It Runs"
      subtitle="Pick a festival occasion or choose custom start and end dates."
      icon={CalendarClock}
      iconBg="bg-violet-100"
      iconColor="text-violet-600"
    >
      {/* Occasions */}
      <div>
        <p className={LABEL}>Occasion / Festival shortcut</p>
        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          {FESTIVALS.map((f) => {
            const active = form.festival === f.id;
            return (
              <button
                key={f.id}
                type="button"
                // Clicking the chosen one again clears it — an occasion is a
                // label, and there has to be a way to take it back off.
                onClick={() => chooseFestival(f.id)}
                aria-pressed={active}
                className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
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

      {/* An occasion whose dates this app cannot compute still labels the
          offer, so the step says plainly that the dates are the merchant's to
          set rather than leaving them looking broken. */}
      {needsManualDates && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-relaxed text-amber-800">
            This occasion falls on different dates each year, so set the start
            and end dates below yourself.
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
