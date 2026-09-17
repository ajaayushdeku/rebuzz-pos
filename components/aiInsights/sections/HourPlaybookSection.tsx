"use client";

import { Clock, Coffee } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  HOUR_WINDOW_DAYS,
  type HourInsight,
  type SlotKind,
} from "@/lib/ai-insights/sections/hourPlaybook";
import {
  AiSectionBody,
  Card,
  CardGrid,
  DismissButton,
  SectionHeader,
  SectionRefreshButton,
  TipBox,
  useMoney,
} from "../parts";

/**
 * How busy an hour is, as one colour used three times on the card — the time
 * pill, the percentage and the bar — so the reading is the same wherever the
 * eye lands. A quiet hour is red because it is the costly one: the rent and
 * the wages are paid either way.
 */
function busynessTone(percent: number) {
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

const KIND_LABEL: Record<SlotKind, string> = {
  peak: "Busiest hour",
  quiet: "Quietest hour",
  "low-spend": "Lowest spend",
};

export default function HourPlaybookSection({
  items,
  state,
  onDismiss,
}: {
  /** The hours still on the page, after dismissals. */
  items: HourInsight[];
  state: AiSectionState<HourInsight>;
  onDismiss: (id: string) => void;
}) {
  const money = useMoney();

  return (
    <section>
      <SectionHeader
        icon={Clock}
        iconClassName="bg-slate-900 text-white"
        title="Hour-by-Hour Playbook"
        subtitle={`Your busiest and quietest hours over the last ${HOUR_WINDOW_DAYS / 7} weeks, and what to do in each`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <SectionRefreshButton state={state} textClassName="text-gray-700" />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`Not enough orders in the last ${HOUR_WINDOW_DAYS / 7} weeks to read an hourly pattern yet. It needs at least 20 orders over 7 days.`}
        nothingFlaggedMessage="Your hours are evenly busy. No hour stands out right now."
        emptyMessage="No hourly plays right now."
      >
        <CardGrid>
          {items.map((item) => {
            const tone = busynessTone(item.busynessPct);
            return (
              <Card key={item.id} className="gap-4">
                <DismissButton
                  label={`${item.time} ${item.title}`}
                  onClick={() => onDismiss(item.id)}
                />

                <div className="flex items-center gap-3 pr-6">
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[15px] font-bold ${tone.pill}`}
                  >
                    {item.time}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {KIND_LABEL[item.kind]}
                    </p>
                  </div>
                </div>

                <div>
                  {/* Busyness, not occupancy: the POS counts orders, not
                      seats, so the bar compares this hour with the busiest. */}
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                    <span className="text-gray-400">Busyness</span>
                    <span className={tone.text}>
                      {item.busynessPct}% of your busiest hour
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.busynessPct}
                    aria-label="Busyness compared with your busiest hour"
                  >
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${item.busynessPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    {item.ordersPerDay} orders a day
                    {item.avgOrder !== null &&
                      ` · ${money(item.avgOrder)} per order`}
                  </p>
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
      </AiSectionBody>
    </section>
  );
}
