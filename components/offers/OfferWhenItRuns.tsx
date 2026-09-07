"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Search, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";

import { useOfferForm, type ActiveHours } from "@/providers/OfferFormContext";
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
  const [festivalQuery, setFestivalQuery] = useState("");
  const [aiFilling, setAiFilling] = useState(false);

  /**
   * The occasions matching what has been typed.
   *
   * Three things are searched, each for a different way of arriving here:
   * the label for someone who knows the name, the promo code for someone who
   * has run the offer before and remembers DASHAIN, and the tags for someone
   * browsing — "festival", "winter", "hindu" all return a set rather than one
   * result.
   *
   * Tags match on a prefix rather than anywhere in the word: "fest" should
   * find every festival, but a substring match would let "in" pull in
   * "international" and "winter" from halfway through, which reads as noise.
   */
  const visibleFestivals = useMemo(() => {
    const q = festivalQuery.trim().toLowerCase();
    if (!q) return FESTIVALS;
    return FESTIVALS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.tags.some((tag) => tag.startsWith(q)),
    );
  }, [festivalQuery]);

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

  /**
   * Read the search box as a sentence and set this step from it.
   *
   * The model only classifies — which occasion, which days, which hours. Dates
   * for a festival are then taken from `festivalWindow`, the app's own
   * calendar, so a campaign can never be dated to a festival that has passed.
   */
  const aiFill = async () => {
    const prompt = festivalQuery.trim();
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
        patch.festival = d.festivalId;
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

      patchForm(patch);
      setFestivalQuery("");
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
    { label: "Weekend (Fri–Sat)", days: WEEKEND },
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
        <p className={LABEL}>Occasion / Festival shortcut</p>

        <div className="flex items-center gap-2">
          {/* min-w-0: an <input> carries an intrinsic width from its default
              `size`, and a flex item will not shrink below that on its own —
              so this row would hold the card open rather than let the field
              narrow. */}
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={festivalQuery}
              onChange={(e) => setFestivalQuery(e.target.value)}
              placeholder="Search by name or tag, or describe when it runs…"
              className={`${FIELD} pl-9 ${festivalQuery ? "pr-9" : ""}`}
            />
            {festivalQuery && (
              <button
                type="button"
                onClick={() => setFestivalQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={aiFill}
            disabled={!festivalQuery.trim() || aiFilling}
            title={
              festivalQuery.trim()
                ? "Fill this step from what you typed"
                : "Describe when the offer should run first"
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

        {/* One scrolling row rather than a wrapping block: the list only grows
            as festivals are added, and a wrap would push the dates further
            down the step every time one was. */}
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          {visibleFestivals.length === 0 ? (
            <p className="py-1 text-center text-[12px] text-gray-400">
              No occasion matches &ldquo;{festivalQuery.trim()}&rdquo;
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleFestivals.map((f) => {
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
          )}
        </div>

        {/* A chosen occasion filtered out by the search would otherwise look
            deselected, and the merchant would pick a second one. */}
        {form.festival &&
          !visibleFestivals.some((f) => f.id === form.festival) && (
            <p className="mt-2 text-[11px] text-gray-500">
              {FESTIVALS.find((f) => f.id === form.festival)?.label} is still
              selected — clear the search to see it.
            </p>
          )}
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
