"use client";

import { Clock, Coffee } from "lucide-react";

import type { HourInsight } from "@/lib/mockData/mock-ai-insights";
import {
  Card,
  CardGrid,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
  TipBox,
} from "../parts";

/**
 * How busy an hour is, as one colour used three times on the card — the time
 * pill, the percentage and the bar — so the reading is the same wherever the
 * eye lands. A quiet hour is red because it is the costly one: the rent and
 * the wages are paid either way.
 */
function occupancyTone(percent: number) {
  if (percent < 34) {
    return {
      pill: "bg-red-50 text-red-600",
      text: "text-red-600",
      bar: "bg-red-400",
    };
  }
  if (percent < 75) {
    return {
      pill: "bg-amber-50 text-amber-600",
      text: "text-amber-600",
      bar: "bg-amber-400",
    };
  }
  return {
    pill: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
  };
}

export default function HourPlaybookSection({
  items,
  onDismiss,
  onGenerate,
}: {
  items: HourInsight[];
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={Clock}
        iconClassName="bg-slate-900 text-white"
        title="Hour-by-Hour Playbook"
        subtitle="Optimising peak and off-peak hours"
        actions={
          <GenerateMoreButton
            textClassName="text-gray-700"
            onClick={onGenerate}
          />
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No hourly plays right now." />
      ) : (
        <CardGrid>
          {items.map((item) => {
            const tone = occupancyTone(item.occupancy);
            return (
              <Card key={item.id} className="gap-4">
                <DismissButton
                  label={`${item.time} ${item.title}`}
                  onClick={() => onDismiss(item.id)}
                />

                <div className="flex items-center gap-3 pr-6">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[15px] font-bold ${tone.pill}`}
                  >
                    {item.time}
                  </span>
                  <h3 className="text-[14px] font-semibold text-gray-900">
                    {item.title}
                  </h3>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                    <span className="text-gray-400">Floor occupancy</span>
                    <span className={tone.text}>{item.occupancy}% full</span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.occupancy}
                    aria-label="Floor occupancy"
                  >
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${item.occupancy}%` }}
                    />
                  </div>
                </div>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <TipBox icon={Coffee} iconClassName="text-gray-500">
                  {item.tip}
                </TipBox>
              </Card>
            );
          })}
        </CardGrid>
      )}
    </section>
  );
}
