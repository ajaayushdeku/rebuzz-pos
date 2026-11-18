"use client";

import { ChevronDown, ChevronUp, PackageSearch } from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { SECTION_WINDOW_DAYS } from "@/lib/ai-insights/sections/shared";
import { useWindowPhrase } from "@/components/aiInsights/periodLabel";
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
  TipList,
  SectionHeader,
  type AccentName,
} from "../parts";
import { useState } from "react";

/** Each kind of slow item: its label and the card's accent. */
const KIND: Record<SlowKind, { label: string; accent: AccentName }> = {
  drop: { label: "Sales falling", accent: "red" },
  "no-sales": { label: "No sales", accent: "rose" },
  low: { label: "Low seller", accent: "amber" },
};

/**
 * Where each fix is carried out.
 *
 * The menu price, the recipe and the menu itself on the products page; the two
 * moves that need an offer in the offer builder. Each card's button is a link
 * here, so a move only exists if there is a screen that performs it.
 */
const MOVE_HREF: Record<SlowItemMove, string> = {
  reprice: "/records/products",
  rework: "/records/products",
  remove: "/records/products",
  discount: "/offers",
  freebie: "/offers",
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
  // The period these cards describe, or this section's own rolling window
  // when there is none — see components/aiInsights/periodLabel.tsx.
  const windowText = useWindowPhrase(`the last ${SECTION_WINDOW_DAYS} days`);

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  return (
    <section>
      <SectionHeader
        icon={PackageSearch}
        iconClassName="bg-red-50 text-red-500 dark:text-red-300 dark:bg-red-400/10"
        title="Slow-Moving Items Insights"
        subtitle={`Items selling slowly in ${windowText}, and how to fix them`}
        info={{
          heading: "What counts as slow",
          body: `An item is flagged when its sales in ${windowText} fall well behind the rest of your menu. A new item with little history can appear here simply because it has not had time to sell.`,
        }}
        actions={
          <div className=" flex flex-row w-full md:w-fit items-end justify-end">
            {/* <SectionRefreshButton
              state={state}
              textClassName="text-red-600 hover:bg-red-100 border-red-300 hover:border-red-400 dark:hover:border-red-400/60 dark:hover:bg-red-400/20 dark:border-red-400/40 dark:text-red-300"
            /> */}

            {/* Collapse / Expand */}
            <button
              type="button"
              onClick={() => setIsBodyExpanded((prev) => !prev)}
              aria-expanded={isBodyExpanded}
              aria-label={
                isBodyExpanded ? "Collapse section" : "Expand section"
              }
              title={isBodyExpanded ? "Collapse section" : "Expand section"}
              className="
  inline-flex shrink-0 items-center justify-center
  rounded-lg border border-[#e2e6ed]
  bg-white p-2 text-[#737b89]
  transition-all duration-200
  hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600
  dark:border-[#293750] dark:bg-[#182338]
  dark:text-[#aab4c4]
  dark:hover:border-rose-400/40
  dark:hover:bg-rose-400/10 dark:hover:text-rose-300
"
            >
              {isBodyExpanded ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          </div>
        }
      />

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isBodyExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <AiSectionBody
            state={state}
            visibleCount={items.length}
            layout="cards"
            noSalesMessage={`No sales in ${windowText}, so there is nothing to compare.`}
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
                        valueClassName: "text-red-600 dark:text-red-300",
                      },
                      { label: "Pace", value: item.context },
                    ]}
                    footer={
                      <CardAction href={MOVE_HREF[item.move]}>
                        {item.action}
                      </CardAction>
                    }
                  >
                    <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                      {item.description}
                    </p>
                    <div className="mt-auto">
                      <Recommendation
                        title={
                          item.tips.length > 1
                            ? "Things to try"
                            : "Recommendation"
                        }
                      >
                        <TipList tips={item.tips} />
                      </Recommendation>
                    </div>
                  </InsightCard>
                );
              })}
            </CardGrid>
          </AiSectionBody>
        </div>
      </div>
    </section>
  );
}
