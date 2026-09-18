"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  FESTIVAL_LOOKAHEAD_DAYS,
  type FestivalPrep,
} from "@/lib/ai-insights/sections/festivalPrep";
import { daysFromNepalToday } from "@/lib/nepalDate";
import {
  AiSectionBody,
  BodyLabel,
  CardAction,
  CardGrid,
  GenerateMoreButton,
  InsightCard,
  LabelNote,
  LeadTile,
  Recommendation,
  SectionHeader,
  SectionRefreshButton,
  TagList,
} from "../parts";

/** Cards shown before "Show all". */
const INITIAL_CARDS = 3;

/** "in 26 days", counted in Nepal time so the day turns over at midnight there. */
function countdown(startDate: string, endDate: string): string | null {
  const days = daysFromNepalToday(startDate);
  if (days === null) return null;
  if (days < 0) {
    const toEnd = daysFromNepalToday(endDate);
    return toEnd !== null && toEnd >= 0 ? "Under way" : null;
  }
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

/** "Sep 19", "Oct 17 – 23", "Nov 30 – Dec 2": short, and read in Nepal's calendar day. */
function dateRange(start: string, end: string): string {
  const parts = (iso: string) => {
    const date = new Date(`${iso}T12:00:00Z`);
    return {
      month: date.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      day: date.getUTCDate(),
    };
  };
  const a = parts(start);
  if (start === end) return `${a.month} ${a.day}`;
  const b = parts(end);
  return a.month === b.month
    ? `${a.month} ${a.day} – ${b.day}`
    : `${a.month} ${a.day} – ${b.month} ${b.day}`;
}

/** Days from start to end, both included. */
function dayCount(start: string, end: string): number {
  const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return Math.round((ms(end) - ms(start)) / 86_400_000) + 1;
}

/** Who has the day off, in the words the holiday notice uses. */
function observedBy(item: FestivalPrep): string {
  if (item.scope === "national") return "Public holiday";
  if (item.scope === "occasion") return "Occasion";
  return item.note ? `Holiday for ${item.note}` : "Holiday for some";
}

export default function FestivalPrepSection({
  items,
  state,
  onDismiss,
}: {
  /** The festivals still on the page, after dismissals. */
  items: FestivalPrep[];
  state: AiSectionState<FestivalPrep>;
  onDismiss: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, INITIAL_CARDS);
  const hidden = items.length - INITIAL_CARDS;

  return (
    <section>
      <SectionHeader
        icon={CalendarDays}
        iconClassName="bg-amber-50 text-amber-600"
        title="Upcoming Festival Prep"
        subtitle={`Festivals and public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days, from Nepal's holiday calendar`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            {/* Everything is already loaded, so this only reveals cards —
                it costs nothing, unlike Refresh beside it. */}
            {hidden > 0 && (
              <GenerateMoreButton
                label={showAll ? "Show fewer" : `Show all ${items.length}`}
                icon={CalendarDays}
                textClassName="text-amber-700"
                onClick={() => setShowAll((v) => !v)}
              />
            )}
            <SectionRefreshButton
              state={state}
              textClassName="text-amber-700 hover:bg-amber-100 border-amber-300 hover:border-amber-400"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage="No recent sales to base festival advice on yet."
        nothingFlaggedMessage={`No festivals or public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days.`}
        emptyMessage="No festivals coming up."
      >
        <CardGrid>
          {shown.map((item) => {
            const when = countdown(item.startDate, item.endDate);
            const range = dateRange(item.startDate, item.endDate);
            const days = dayCount(item.startDate, item.endDate);

            return (
              <InsightCard
                key={item.id}
                accent="amber"
                lead={<LeadTile accent="amber">{item.icon}</LeadTile>}
                label={
                  <>
                    <CalendarClock size={11} aria-hidden />
                    {when ?? observedBy(item)}
                    {when && <LabelNote>{observedBy(item)}</LabelNote>}
                  </>
                }
                title={item.label}
                onDismiss={() => onDismiss(item.id)}
                dismissLabel={item.label}
                // Both calendars, each with its own label.
                metrics={[
                  {
                    label: "Dates",
                    value: range,
                    note: `${days} day${days === 1 ? "" : "s"}`,
                  },
                  {
                    label: "Nepali date",
                    value: item.bsLabel,
                    valueClassName: "text-emerald-700",
                  },
                ]}
                footer={
                  <CardAction href="/offers">
                    Plan a {item.label} offer
                  </CardAction>
                }
              >
                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                {item.stockUp.length > 0 && (
                  <div>
                    <BodyLabel>Stock up on</BodyLabel>
                    <TagList
                      tags={item.stockUp.map((name) => ({
                        key: name,
                        content: name,
                      }))}
                    />
                  </div>
                )}

                {item.offerIdea && (
                  <div className="mt-auto">
                    <Recommendation title="Offer idea">
                      {item.offerIdea}
                    </Recommendation>
                  </div>
                )}
              </InsightCard>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
