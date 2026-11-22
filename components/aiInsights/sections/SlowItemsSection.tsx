"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, PackageSearch } from "lucide-react";

import {
  createSuggestedPromoCode,
  saveOfferCreationDraft,
} from "@/lib/offers/offerCreationDraft";

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
import ApplySlowItemDiscountDialog from "../ApplySlowItemDiscountDialog";
import { useDiscounts } from "@/hooks/useDiscounts";

/** Each kind of slow item: its label and the card's accent. */
const KIND: Record<SlowKind, { label: string; accent: AccentName }> = {
  drop: { label: "Sales falling", accent: "red" },
  "no-sales": { label: "No sales", accent: "rose" },
  low: { label: "Low seller", accent: "amber" },
};

/** Where each recommended action is carried out. */
const MOVE_HREF: Record<SlowItemMove, string> = {
  reprice: "/records/products",
  rework: "/records/products",
  remove: "/records/products",
  discount: "/offers",
  freebie: "/offers",
};

type DiscountItem = {
  productId: string;
  productName: string;
  discountRate: number | null;
};

export default function SlowItemsSection({
  items,
  state,
  onDismiss,
}: {
  items: SlowItemInsight[];
  state: AiSectionState<SlowItemInsight>;
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();
  const windowText = useWindowPhrase(`the last ${SECTION_WINDOW_DAYS} days`);

  const { refetch: refetchDiscounts } = useDiscounts();

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  const [selectedDiscountItem, setSelectedDiscountItem] = useState<{
    productId: string;
    productName: string;
    discountId: string;
  } | null>(null);

  const [itemForDiscount, setItemForDiscount] = useState<DiscountItem | null>(
    null,
  );

  const handleOfferSuggestion = (
    item: SlowItemInsight,
    move: Extract<SlowItemMove, "discount" | "freebie">,
  ): void => {
    saveOfferCreationDraft({
      source: "slow-item",
      move,
      productId: item.productId,
      productName: item.name,
      suggestedCode: createSuggestedPromoCode(
        item.name,
        move === "freebie" ? "FREE" : "DEAL",
      ),
    });

    router.push("/offers");
  };

  /** Extracts a valid percentage from text such as "Offer 15% off". */
  const extractDiscountRate = (action: string): number | null => {
    const match = action.match(/(\d+(?:\.\d+)?)\s*%\s*off/i);

    if (!match) return null;

    const rate = Number(match[1]);

    return rate > 0 && rate <= 100 ? rate : null;
  };

  const handleDiscountSuggestion = async (item: SlowItemInsight) => {
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
        discountId: existingDiscount._id,
      });

      return;
    }

    // No existing discount: open the creation dialog.
    setSelectedDiscountItem(null);

    setItemForDiscount({
      productId: item.productId,
      productName: item.name,
      discountRate: extractDiscountRate(item.action),
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
                      move === "freebie" ? (
                        <CardAction
                          onClick={() => handleOfferSuggestion(item, "freebie")}
                        >
                          {item.action}
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

      {selectedDiscountItem && (
        <ApplySlowItemDiscountDialog
          open={true}
          onClose={() => setSelectedDiscountItem(null)}
          productId={selectedDiscountItem.productId}
          productName={selectedDiscountItem.productName}
          discountId={selectedDiscountItem.discountId}
        />
      )}

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
              productId: itemForDiscount.productId,
              productName: itemForDiscount.productName,
              discountId,
            });
          }}
        />
      )}
    </section>
  );
}
