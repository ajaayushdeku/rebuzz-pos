"use client";

import { CalendarDays } from "lucide-react";

import { FESTIVALS } from "@/components/offers/festivals";
import type { FestivalPrep } from "@/lib/mockData/mock-ai-insights";
import { daysFromNepalToday } from "@/lib/nepalDate";
import { toBsLabel } from "@/lib/nepaliDate";
import {
  ActionButton,
  Card,
  CardGrid,
  comingSoon,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
} from "../parts";

/** "in 26 days", counted in Nepal time so the day turns over at midnight there. */
function countdown(startDate: string): string | null {
  const days = daysFromNepalToday(startDate);
  if (days === null) return null;
  if (days < 0) return "Under way";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

export default function FestivalPrepSection({
  items,
  onDismiss,
}: {
  items: FestivalPrep[];
  onDismiss: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={CalendarDays}
        iconClassName="bg-amber-50 text-amber-600"
        title="Upcoming Festival Prep"
        subtitle="Next occasions from the BS calendar, with prep guidance"
        actions={
          <GenerateMoreButton
            label="Show More Festivals"
            icon={CalendarDays}
            textClassName="text-amber-700"
            onClick={() => comingSoon("More festivals")}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No festivals coming up." />
      ) : (
        <CardGrid>
          {items.map((item) => {
            // Icon and name come from the offers list, so a festival reads the
            // same here as in the offer builder the button leads to.
            const festival = FESTIVALS.find((f) => f.id === item.festivalId);
            const label = festival?.label ?? item.festivalId;
            const when = countdown(item.startDate);
            const bs = toBsLabel(item.startDate);
            const range =
              item.endDate === item.startDate
                ? item.startDate
                : `${item.startDate} → ${item.endDate}`;

            return (
              <Card key={item.id} className="gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {festival?.icon ?? "🎉"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-gray-900">
                      {label}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">{range}</p>
                    {bs && (
                      <p className="text-xs font-medium text-emerald-700">
                        {bs}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {when && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {when}
                      </span>
                    )}
                    <DismissButton
                      label={label}
                      onClick={() => onDismiss(item.id)}
                      className=""
                    />
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <ActionButton tone="amber" href="/offers">
                  Plan a {label} offer
                </ActionButton>
              </Card>
            );
          })}
        </CardGrid>
      )}
    </section>
  );
}
