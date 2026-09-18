"use client";

import { TriangleAlert } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { SECTION_WINDOW_DAYS } from "@/lib/ai-insights/sections/shared";
import type {
  SlowItemInsight,
  SlowItemMove,
  SlowKind,
} from "@/lib/ai-insights/sections/slowItems";
import {
  AiSectionBody,
  CardAction,
  CardGrid,
  InsightCard,
  LeadTile,
  Recommendation,
  SectionHeader,
  SectionRefreshButton,
  type AccentName,
} from "../parts";

/** Each kind of slow item: its label and the card's accent. */
const KIND: Record<SlowKind, { label: string; accent: AccentName }> = {
  drop: { label: "Sales falling", accent: "red" },
  "no-sales": { label: "No sales", accent: "rose" },
  low: { label: "Low seller", accent: "amber" },
};

/**
 * Where each fix is carried out: prices, recipes and the menu itself on the
 * products page; a bundle or a push as an offer.
 */
const MOVE_HREF: Record<SlowItemMove, string> = {
  rework: "/records/products",
  reprice: "/records/products",
  remove: "/records/products",
  bundle: "/offers",
  promote: "/offers",
};

export default function SlowItemsSection({
  items,
  state,
  onDismiss,
}: {
  /** The cards still on the page, after dismissals. */
  items: SlowItemInsight[];
  state: AiSectionState<SlowItemInsight>;
  onDismiss: (id: string) => void;
}) {
  return (
    <section>
      <SectionHeader
        icon={TriangleAlert}
        iconClassName="bg-red-50 text-red-500"
        title="Slow Item Insights"
        subtitle={`Items selling slowly over the last ${SECTION_WINDOW_DAYS} days, and how to fix them`}
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end absolute md:relative top-2">
            <SectionRefreshButton
              state={state}
              textClassName="text-red-600 hover:bg-red-100 border-red-300 hover:border-red-400"
            />
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`No sales in the last ${SECTION_WINDOW_DAYS * 2} days, so there is nothing to compare yet.`}
        nothingFlaggedMessage="Every item on your menu is selling steadily. Nothing to fix right now."
        emptyMessage="No slow items flagged right now."
      >
        <CardGrid>
          {items.map((item) => {
            return (
              <InsightCard
                key={item.id}
                accent={KIND[item.kind].accent}
                lead={
                  <LeadTile accent={KIND[item.kind].accent}>
                    {item.icon}
                  </LeadTile>
                }
                label={KIND[item.kind].label}
                title={item.name}
                onDismiss={() => onDismiss(item.id)}
                dismissLabel={item.name}
                metrics={[
                  {
                    label: item.kind === "drop" ? "Sales change" : "Status",
                    value: item.signal,
                    valueClassName: "text-red-600",
                  },
                  { label: "Pace", value: item.context },
                ]}
                footer={
                  <CardAction href={MOVE_HREF[item.move]}>
                    {item.action}
                  </CardAction>
                }
              >
                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>
                <div className="mt-auto">
                  <Recommendation>{item.tip}</Recommendation>
                </div>
              </InsightCard>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
