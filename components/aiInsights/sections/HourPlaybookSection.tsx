"use client";

import { Clock, Coins, Flame, Hourglass, type LucideIcon } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  HOUR_WINDOW_DAYS,
  ordersLabel,
  type HourInsight,
  type SlotKind,
} from "@/lib/ai-insights/sections/hourPlaybook";
import {
  AiSectionBody,
  CardGrid,
  InsightCard,
  Recommendation,
  SectionHeader,
  SectionRefreshButton,
  useMoney,
  type AccentName,
} from "../parts";

/**
 * How busy an hour is, as one colour used three times on the card — the time
 * pill, the percentage and the bar — so the reading is the same wherever the
 * eye lands. A quiet hour is red because it is the costly one: the rent and
 * the wages are paid either way.
 */
function busynessTone(percent: number): {
  accent: AccentName;
  pill: string;
  text: string;
} {
  if (percent < 34) {
    return {
      accent: "red",
      pill: "bg-red-50 text-red-600",
      text: "text-red-600",
    };
  }
  if (percent < 75) {
    return {
      accent: "amber",
      pill: "bg-amber-50 text-amber-600",
      text: "text-amber-600",
    };
  }
  return {
    accent: "emerald",
    pill: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-600",
  };
}

const KIND_LABEL: Record<SlotKind, string> = {
  peak: "Busiest hour",
  quiet: "Quietest hour",
  "low-spend": "Lowest spend",
};

/**
 * What kind of hour it is, at a glance: the rush, the lull, the small orders.
 * Drawn in the label's own colour, so it reads as part of the label.
 */
const KIND_ICON: Record<SlotKind, LucideIcon> = {
  peak: Flame,
  quiet: Hourglass,
  "low-spend": Coins,
};

function KindLabel({ kind }: { kind: SlotKind }) {
  return (
    <div className="flex flex-row items-center gap-0.5">
      {/* <Icon
        size={10}
        strokeWidth={2.5}
        aria-hidden
        className="shrink-0 bg-red-300"
      /> */}
      <p>{KIND_LABEL[kind]}</p>
    </div>
  );
}

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
            <SectionRefreshButton
              state={state}
              textClassName="text-gray-700 hover:bg-gray-100 border-gray-300 hover:border-gray-400"
            />
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
            const Icon = KIND_ICON[item.kind];
            return (
              <InsightCard
                key={item.id}
                accent={tone.accent}
                lead={
                  <span
                    className={`flex h-10 shrink-0 items-center gap-1 rounded-lg pr-2.5 text-[14px] font-bold ${tone.pill}`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={2.5}
                      aria-hidden
                      className="shrink-0"
                    />
                    {item.time}
                  </span>
                }
                label={<KindLabel kind={item.kind} />}
                title={item.title}
                onDismiss={() => onDismiss(item.id)}
                dismissLabel={`${item.time} ${item.title}`}
                // Busyness, not occupancy: the POS counts orders, not seats,
                // so this hour is compared with the busiest one.
                metrics={[
                  {
                    label: "Busyness",
                    value: `${item.busynessPct}%`,
                    valueClassName: tone.text,
                    note: "of busiest hour",
                  },
                  {
                    label: "Orders / day",
                    value: ordersLabel(item.ordersPerDay),
                  },
                  {
                    label: "Per order",
                    value: item.avgOrder === null ? "—" : money(item.avgOrder),
                  },
                ]}
              >
                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>
                <div className="mt-auto">
                  <Recommendation title="Play for this hour">
                    {item.tip}
                  </Recommendation>
                </div>
              </InsightCard>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
