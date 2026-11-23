"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  PackageSearch,
  CheckCircle2,
} from "lucide-react";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

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

import { CreateDiscountDialog } from "@/components/invoice/CreateDiscount";
import CreateSlowItemOfferDialog from "../CreateSlowItemOfferDialog";
import ApplySlowItemDiscountDialog from "../ApplySlowItemDiscountDialog";
import { useDiscounts } from "@/hooks/useDiscounts";

/** Each kind of slow item: its label and the card's accent. */
const KIND: Record<SlowKind, { label: string; accent: AccentName }> = {
  drop: { label: "Sales falling", accent: "red" },
  "no-sales": { label: "No sales", accent: "rose" },
  low: { label: "Low seller", accent: "amber" },
};

/** Where each recommended action is carried out. */
const MOVE_HREF: Record<
  Exclude<SlowItemMove, "discount" | "freebie">,
  string
> = {
  reprice: "/records/products",
  rework: "/records/products",
  remove: "/records/products",
};

type DiscountItem = {
  productId: string;
  productName: string;
  discountRate: number | null;
  kind: PeriodKind;
  periodId: string;
  promptVersion: string;
  suggestionId: string;
};

export default function SlowItemsSection({
  items,
  state,
  onDismiss,
  kind,
  periodId,
  promptVersion,
}: {
  items: SlowItemInsight[];
  state: AiSectionState<SlowItemInsight>;
  onDismiss: (id: string) => void;
  kind: PeriodKind;
  periodId: string;
  promptVersion: string;
}) {
  const windowText = useWindowPhrase(`the last ${SECTION_WINDOW_DAYS} days`);

  const { refetch: refetchDiscounts } = useDiscounts();

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  // Existing discount flow.
  const [selectedDiscountItem, setSelectedDiscountItem] = useState<
    (DiscountItem & { discountId: string }) | null
  >(null);

  const [itemForDiscount, setItemForDiscount] = useState<DiscountItem | null>(
    null,
  );

  // Freebie offer modal.
  const [freebieItem, setFreebieItem] = useState<SlowItemInsight | null>(null);

  const [isFreebieDialogOpen, setIsFreebieDialogOpen] = useState(false);

  // Retain created offer IDs so completion can be retried without
  // creating another offer.
  const [pendingFreebieOffers, setPendingFreebieOffers] = useState<
    Record<string, string>
  >({});

  // Track successful completions immediately in the UI.
  const [completedFreebieIds, setCompletedFreebieIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleFreebieSuggestion = (item: SlowItemInsight) => {
    setFreebieItem(item);
    setIsFreebieDialogOpen(true);
  };

  /** Extracts a valid percentage from text such as "Offer 15% off". */
  const extractDiscountRate = (action: string): number | null => {
    const match = action.match(/(\d+(?:\.\d+)?)\s*%\s*off/i);

    if (!match) return null;

    const rate = Number(match[1]);

    return rate > 0 && rate <= 100 ? rate : null;
  };

  const handleDiscountSuggestion = async (item: SlowItemInsight) => {
    if (!periodId || !promptVersion) {
      return;
    }

    const discountName = `${item.name} - Slow Item Discount`;

    // Fetch the latest discounts before checking for duplicates.
    const { data: discounts, error } = await refetchDiscounts();

    // Don't create a duplicate if we couldn't verify existing discounts.
    if (error || !discounts) {
      return;
    }

    const existingDiscount = discounts.find(
      (discount) =>
        discount.name.trim().toLowerCase() ===
        discountName.trim().toLowerCase(),
    );

    if (existingDiscount) {
      // Reuse the existing discount directly.
      setItemForDiscount(null);

      setSelectedDiscountItem({
        productId: item.productId,
        productName: item.name,
        discountRate: extractDiscountRate(item.action),
        discountId: existingDiscount._id,
        kind,
        periodId,
        promptVersion,
        suggestionId: item.id,
      });

      return;
    }

    // No existing discount: open the creation dialog.
    setSelectedDiscountItem(null);

    setItemForDiscount({
      productId: item.productId,
      productName: item.name,
      discountRate: extractDiscountRate(item.action),
      kind,
      periodId,
      promptVersion,
      suggestionId: item.id,
    });
  };

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
          <div className="flex w-full flex-row items-end justify-end md:w-fit">
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
                const move = item.move;
                const isDismissed = item.status === "dismissed";

                const isApplied =
                  item.status === "applied" || completedFreebieIds.has(item.id);

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
                      isApplied ? (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                          <CheckCircle2 size={14} aria-hidden />
                          {item.actionType === "discount-applied"
                            ? "Discount applied"
                            : item.actionType === "freebie-created" ||
                                completedFreebieIds.has(item.id)
                              ? "Free-item offer created"
                              : "Action completed"}
                        </div>
                      ) : isDismissed ? (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2.5 text-xs font-medium text-[#6b7280] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#a9b4c7]">
                          <CheckCircle2 size={14} aria-hidden />
                          Dismissed
                        </div>
                      ) : move === "freebie" ? (
                        <CardAction
                          onClick={() => handleFreebieSuggestion(item)}
                        >
                          {pendingFreebieOffers[item.id]
                            ? "Finish offer setup"
                            : item.action}
                        </CardAction>
                      ) : move === "discount" ? (
                        <CardAction
                          onClick={() => handleDiscountSuggestion(item)}
                        >
                          {item.action}
                        </CardAction>
                      ) : (
                        <CardAction href={MOVE_HREF[move]}>
                          {item.action}
                        </CardAction>
                      )
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

      {/* Inline free-item offer creation. */}
      {freebieItem && (
        <CreateSlowItemOfferDialog
          key={freebieItem.id}
          open={isFreebieDialogOpen}
          onClose={() => setIsFreebieDialogOpen(false)}
          item={freebieItem}
          kind={kind}
          periodId={periodId}
          promptVersion={promptVersion}
          pendingOfferId={pendingFreebieOffers[freebieItem.id] ?? null}
          onOfferCreated={(offerId) => {
            setPendingFreebieOffers((previous) => ({
              ...previous,
              [freebieItem.id]: offerId,
            }));
          }}
          onCompleted={() => {
            setCompletedFreebieIds((previous) => {
              const next = new Set(previous);
              next.add(freebieItem.id);
              return next;
            });

            setPendingFreebieOffers((previous) => {
              const next = { ...previous };
              delete next[freebieItem.id];
              return next;
            });

            setIsFreebieDialogOpen(false);
            setFreebieItem(null);
          }}
        />
      )}

      {/* Existing discount application dialog. */}
      {selectedDiscountItem && (
        <ApplySlowItemDiscountDialog
          open={true}
          onClose={() => setSelectedDiscountItem(null)}
          productId={selectedDiscountItem.productId}
          productName={selectedDiscountItem.productName}
          discountId={selectedDiscountItem.discountId}
          kind={selectedDiscountItem.kind}
          periodId={selectedDiscountItem.periodId}
          promptVersion={selectedDiscountItem.promptVersion}
          suggestionId={selectedDiscountItem.suggestionId}
        />
      )}

      {/* Existing discount creation dialog. */}
      {itemForDiscount && (
        <CreateDiscountDialog
          open={true}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setItemForDiscount(null);
          }}
          initialName={`${itemForDiscount.productName} - Slow Item Discount`}
          initialRate={itemForDiscount.discountRate ?? 0}
          initialType="percentage"
          onCreated={(discountId) => {
            setSelectedDiscountItem({
              ...itemForDiscount,
              discountId,
            });
          }}
        />
      )}
    </section>
  );
}
