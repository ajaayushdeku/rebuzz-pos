"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays, Gift, PackagePlus } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  FESTIVAL_LOOKAHEAD_DAYS,
  type FestivalPrep,
} from "@/lib/ai-insights/sections/festivalPrep";
import { COVERED_BS_YEAR } from "@/lib/holidayCalendar";
import { daysFromNepalToday } from "@/lib/nepalDate";
import {
  ActionButton,
  AiSectionBody,
  Card,
  CardGrid,
  CardHeader,
  CardLabel,
  Chip,
  DismissButton,
  EmojiTile,
  Fact,
  Facts,
  GenerateMoreButton,
  SectionHeader,
  SectionRefreshButton,
  TipBox,
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
        subtitle={`Festivals and public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days, from the official ${COVERED_BS_YEAR} BS calendar`}
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
        nothingFlaggedMessage={`No festivals or public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days in the ${COVERED_BS_YEAR} BS calendar.`}
        emptyMessage="No festivals coming up."
      >
        <CardGrid>
          {shown.map((item) => {
            const when = countdown(item.startDate, item.endDate);
            const range = dateRange(item.startDate, item.endDate);

            return (
              <Card key={item.id}>
                <DismissButton
                  label={item.label}
                  onClick={() => onDismiss(item.id)}
                />

                <CardHeader
                  lead={
                    <EmojiTile className="bg-amber-50">{item.icon}</EmojiTile>
                  }
                  title={item.label}
                >
                  {when && (
                    <Chip className="bg-amber-50 text-amber-700">
                      <CalendarClock size={11} aria-hidden />
                      {when}
                    </Chip>
                  )}
                  <Chip>{observedBy(item)}</Chip>
                </CardHeader>

                {/* Both calendars, each with its own label, rather than three
                    loose lines of dates under the title. */}
                <Facts>
                  <Fact label="Dates">{range}</Fact>
                  <Fact label="Nepali date" valueClassName="text-emerald-700">
                    {item.bsLabel}
                  </Fact>
                </Facts>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                {item.stockUp.length > 0 && (
                  <div>
                    <CardLabel
                      icon={PackagePlus}
                      iconClassName="text-amber-600"
                    >
                      Stock up on
                    </CardLabel>
                    <ul className="flex flex-wrap gap-1.5">
                      {item.stockUp.map((name) => (
                        <li
                          key={name}
                          className="rounded-md border border-amber-100 bg-amber-50/60 px-2 py-1 text-[11px] text-amber-900"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.offerIdea && (
                  <TipBox icon={Gift}>{item.offerIdea}</TipBox>
                )}

                <ActionButton tone="amber" href="/offers">
                  Plan a {item.label} offer
                </ActionButton>
              </Card>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
