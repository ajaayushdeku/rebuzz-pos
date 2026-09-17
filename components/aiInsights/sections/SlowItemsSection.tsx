"use client";

import {
  ArrowDownRight,
  Ban,
  Lightbulb,
  Megaphone,
  Package,
  Tags,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { SECTION_WINDOW_DAYS } from "@/lib/ai-insights/sections/shared";
import type {
  SlowItemInsight,
  SlowItemMove,
  SlowKind,
} from "@/lib/ai-insights/sections/slowItems";
import {
  ActionButton,
  AiSectionBody,
  Card,
  CardGrid,
  CardHeader,
  Chip,
  comingSoon,
  DismissButton,
  EmojiTile,
  SectionHeader,
  SectionRefreshButton,
  TipBox,
  type ActionTone,
} from "../parts";

/** Each kind of fix has its own colour and icon, so a row of cards scans. */
const MOVES = {
  rework: { tone: "amber", icon: Wrench },
  bundle: { tone: "blue", icon: Package },
  reprice: { tone: "green", icon: Tags },
  promote: { tone: "violet", icon: Megaphone },
  remove: { tone: "pink", icon: Ban },
} satisfies Record<SlowItemMove, { tone: ActionTone; icon: LucideIcon }>;

/**
 * A fall in sales is a warning in red; no sales at all is the loudest; a low
 * but steady seller is an observation in a softer rose.
 */
const SIGNAL_CLASS: Record<SlowKind, string> = {
  drop: "bg-red-50 text-red-600",
  "no-sales": "bg-red-100 text-red-700",
  low: "bg-rose-50 text-rose-600",
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
            const move = MOVES[item.move];
            return (
              <Card key={item.id}>
                <DismissButton
                  label={item.name}
                  onClick={() => onDismiss(item.id)}
                />

                <CardHeader
                  lead={<EmojiTile>{item.icon}</EmojiTile>}
                  title={item.name}
                >
                  <Chip className={SIGNAL_CLASS[item.kind]}>
                    {item.kind === "drop" && (
                      <ArrowDownRight size={11} aria-hidden />
                    )}
                    {item.signal}
                  </Chip>
                  <span className="text-[11px] text-gray-400">
                    {item.context}
                  </span>
                </CardHeader>

                <p className="text-[13px] leading-relaxed text-gray-600">
                  {item.description}
                </p>

                <TipBox icon={Lightbulb}>{item.tip}</TipBox>

                <ActionButton
                  tone={move.tone}
                  icon={move.icon}
                  onClick={() => comingSoon(item.action)}
                >
                  {item.action}
                </ActionButton>
              </Card>
            );
          })}
        </CardGrid>
      </AiSectionBody>
    </section>
  );
}
