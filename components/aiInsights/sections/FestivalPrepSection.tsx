"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  FESTIVAL_LOOKAHEAD_DAYS,
  type FestivalPrep,
  type FestivalPrepResult,
} from "@/lib/ai-insights/sections/festivalPrep";
import { daysFromNepalToday } from "@/lib/nepalDate";
import {
  AiSectionBody,
  BodyLabel,
  CardAction,
  CardGrid,
  GenerateMoreButton,
  InsightCard,
  LabelNote,
  LeadTile,
  Recommendation,
  SectionHeader,
  TagList,
  TipList,
} from "../parts";

import type { Product } from "@/lib/types/product";
import FestivalStockUpDialog from "../FestivalStockUpDialog";
import CreateFestivalOfferDialog from "../CreateFestivalOfferDialog";

import {
  getFestivalPrepAction,
  type FestivalPrepAction,
} from "@/services/apiAiInsights.client";

const INITIAL_CARDS = 3;

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

function dayCount(start: string, end: string): number {
  const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

  return Math.round((ms(end) - ms(start)) / 86_400_000) + 1;
}

function observedBy(item: FestivalPrep): string {
  if (item.scope === "national") return "Public holiday";
  if (item.scope === "occasion") return "Occasion";

  return item.note ? `Holiday for ${item.note}` : "Holiday for some";
}

function getPreferredOfferIdea(ideas: string[]): string {
  const freeItemIdea = ideas.find((idea) => {
    const text = idea.toLowerCase();

    const mentionsFreeItem =
      /\b(free|complimentary)\b/.test(text) &&
      !/\bfree\s+(delivery|shipping)\b/.test(text);

    const isBogo =
      /\bbogo\b/.test(text) ||
      /\bbuy\s+(one|1)\s+(get|and)\s+(one|1)\b/.test(text);

    return mentionsFreeItem && !isBogo;
  });

  return freeItemIdea ?? ideas[0];
}

type ActionLookupStatus = "loading" | "loaded" | "error";

export default function FestivalPrepSection({
  items,
  state,
  onDismiss,
  products,
  productsLoading,
  date,
  promptVersion,
}: {
  items: FestivalPrep[];
  state: AiSectionState<FestivalPrep, FestivalPrepResult>;
  onDismiss: (id: string) => void;
  products: Product[];
  productsLoading: boolean;
  date: string;
  promptVersion: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  // Stock-up dialog selection. Keep this independent from offer creation.
  const [selectedFestival, setSelectedFestival] = useState<FestivalPrep | null>(
    null,
  );

  // Offer creation selection.
  const [selectedOffer, setSelectedOffer] = useState<{
    item: FestivalPrep;
    offerIdea: string;
  } | null>(null);

  // Keeps an already-created offer available if completion recording fails.
  const [pendingOfferIds, setPendingOfferIds] = useState<
    Record<string, string>
  >({});

  // Completion records restored from the backend.
  const [savedActions, setSavedActions] = useState<
    Record<string, FestivalPrepAction>
  >({});

  // Tracks whether each recommendation's saved status was retrieved.
  const [actionLookupStatus, setActionLookupStatus] = useState<
    Record<string, ActionLookupStatus>
  >({});

  const recommendationIdsKey = JSON.stringify(items.map((item) => item.id));

  useEffect(() => {
    if (!date || !promptVersion || !recommendationIdsKey) return;

    let cancelled = false;

    const recommendationIds: string[] = JSON.parse(recommendationIdsKey);

    setActionLookupStatus(
      Object.fromEntries(recommendationIds.map((id) => [id, "loading"])),
    );

    setSavedActions({});

    const loadActions = async () => {
      const results = await Promise.all(
        recommendationIds.map(async (recommendationId) => {
          try {
            const result = await getFestivalPrepAction({
              date,
              promptVersion,
              recommendationId,
            });

            return {
              recommendationId,
              action: result.completed ? result.action : null,
              status: "loaded" as const,
            };
          } catch {
            return {
              recommendationId,
              action: null,
              status: "error" as const,
            };
          }
        }),
      );

      if (cancelled) return;

      const actions: Record<string, FestivalPrepAction> = {};
      const statuses: Record<string, ActionLookupStatus> = {};

      for (const result of results) {
        statuses[result.recommendationId] = result.status;

        if (result.action) {
          actions[result.recommendationId] = result.action;
        }
      }

      setSavedActions(actions);
      setActionLookupStatus(statuses);
    };

    void loadActions();

    return () => {
      cancelled = true;
    };
  }, [date, promptVersion, recommendationIdsKey]);

  const shown = showAll ? items : items.slice(0, INITIAL_CARDS);
  const hidden = items.length - INITIAL_CARDS;

  /**
   * Open the offer dialog.
   *
   * If an offer was already created but its completion record failed,
   * reopen the dialog with its existing ID so only the completion
   * request is retried.
   */
  const createFestivalOffer = (item: FestivalPrep, offerIdea: string) => {
    if (!date || !promptVersion) return;

    // An existing pending offer must be retried, never recreated.
    if (pendingOfferIds[item.id]) {
      setSelectedOffer({ item, offerIdea });
      return;
    }

    // Do not create an offer while the saved status is unknown.
    if (actionLookupStatus[item.id] !== "loaded") return;

    // The backend already has a completed offer.
    if (savedActions[item.id]) return;

    setSelectedOffer({ item, offerIdea });
  };

  const handleOfferCreated = (recommendationId: string, offerId: string) => {
    setPendingOfferIds((previous) => ({
      ...previous,
      [recommendationId]: offerId,
    }));
  };

  /**
   * Update the UI after the completion PATCH succeeds.
   */
  const handleOfferCompleted = (recommendationId: string) => {
    const offerId =
      pendingOfferIds[recommendationId] ??
      savedActions[recommendationId]?.offerId;

    if (offerId) {
      setSavedActions((previous) => ({
        ...previous,
        [recommendationId]: {
          date,
          promptVersion,
          recommendationId,
          actionType: "offer-created",
          offerId,
          completedAt: new Date().toISOString(),
        },
      }));
    }

    setActionLookupStatus((previous) => ({
      ...previous,
      [recommendationId]: "loaded",
    }));

    setPendingOfferIds((previous) => {
      const next = { ...previous };
      delete next[recommendationId];
      return next;
    });

    setSelectedOffer(null);
  };

  /**
   * Retry retrieving the saved completion status.
   */
  const retryActionLookup = async (recommendationId: string) => {
    setActionLookupStatus((previous) => ({
      ...previous,
      [recommendationId]: "loading",
    }));

    try {
      const result = await getFestivalPrepAction({
        date,
        promptVersion,
        recommendationId,
      });

      setSavedActions((previous) => {
        const next = { ...previous };

        if (result.completed && result.action) {
          next[recommendationId] = result.action;
        } else {
          delete next[recommendationId];
        }

        return next;
      });

      setActionLookupStatus((previous) => ({
        ...previous,
        [recommendationId]: "loaded",
      }));
    } catch {
      setActionLookupStatus((previous) => ({
        ...previous,
        [recommendationId]: "error",
      }));
    }
  };

  return (
    <section>
      <SectionHeader
        icon={CalendarDays}
        iconClassName="bg-amber-50 text-amber-600 dark:text-amber-300 dark:bg-amber-400/10"
        title="Upcoming Festival Prep"
        subtitle={`Festivals and public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days, from Nepal's holiday calendar`}
        info={{
          heading: "Where the dates come from",
          body: `The dates are Nepal's public holiday calendar for the next ${FESTIVAL_LOOKAHEAD_DAYS} days — not your own sales. What to prepare for each one is the AI reading those dates against what you sold around them before.`,
        }}
        actions={
          <div className="flex w-full flex-row items-end justify-end gap-2 md:w-fit">
            {hidden > 0 && (
              <GenerateMoreButton
                label={showAll ? "Show fewer" : `Show all ${items.length}`}
                icon={CalendarDays}
                textClassName="text-amber-700 border-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-400/40 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/10"
                onClick={() => setShowAll((v) => !v)}
              />
            )}

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
                hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600
                dark:border-[#293750] dark:bg-[#182338]
                dark:text-[#aab4c4]
                dark:hover:border-amber-400/40
                dark:hover:bg-amber-400/10 dark:hover:text-amber-300
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
            noSalesMessage="No recent sales to base festival advice on yet."
            nothingFlaggedMessage={`No festivals or public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days.`}
            emptyMessage="No festivals coming up."
          >
            <CardGrid>
              {shown.map((item) => {
                const when = countdown(item.startDate, item.endDate);
                const range = dateRange(item.startDate, item.endDate);
                const days = dayCount(item.startDate, item.endDate);

                const isCompleted = Boolean(savedActions[item.id]);
                const hasPendingOffer = Boolean(pendingOfferIds[item.id]);
                const lookupStatus = actionLookupStatus[item.id];

                const offerIdea =
                  item.offerIdeas.length > 0
                    ? getPreferredOfferIdea(item.offerIdeas)
                    : "";

                return (
                  <InsightCard
                    key={item.id}
                    accent="amber"
                    lead={<LeadTile accent="amber">{item.icon}</LeadTile>}
                    label={
                      <>
                        <CalendarClock size={11} aria-hidden />
                        {when ?? observedBy(item)}
                        {when && <LabelNote>{observedBy(item)}</LabelNote>}
                      </>
                    }
                    title={item.label}
                    onDismiss={() => onDismiss(item.id)}
                    dismissLabel={item.label}
                    metrics={[
                      {
                        label: "Dates",
                        value: range,
                        note: `${days} day${days === 1 ? "" : "s"}`,
                      },
                      {
                        label: "Nepali date",
                        value: item.bsLabel,
                        valueClassName:
                          "text-emerald-700 dark:text-emerald-300",
                      },
                    ]}
                    footer={
                      isCompleted ? (
                        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                          <CheckCircle2 size={14} />
                          Offer created
                        </div>
                      ) : hasPendingOffer ? (
                        <CardAction
                          onClick={() => createFestivalOffer(item, offerIdea)}
                        >
                          Finish saving offer
                        </CardAction>
                      ) : lookupStatus === "loading" || !lookupStatus ? (
                        <div className="text-[11px] text-[#89909c] dark:text-[#9ca9bc]">
                          Checking offer status...
                        </div>
                      ) : lookupStatus === "error" ? (
                        <button
                          type="button"
                          onClick={() => retryActionLookup(item.id)}
                          className="text-[12px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300"
                        >
                          Couldn&lsquo;t verify offer status · Retry
                        </button>
                      ) : item.offerIdeas.length > 0 ? (
                        <CardAction
                          onClick={() => createFestivalOffer(item, offerIdea)}
                        >
                          Create a {item.label} offer
                        </CardAction>
                      ) : undefined
                    }
                  >
                    <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                      {item.description}
                    </p>

                    {item.stockUp.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <BodyLabel>Stock up on</BodyLabel>

                          <button
                            type="button"
                            onClick={() => setSelectedFestival(item)}
                            disabled={productsLoading}
                            aria-label={`Edit stock-up for ${item.label}`}
                            className="
                              group inline-flex shrink-0 items-center gap-1.5
                              rounded-full border border-teal-200
                              bg-teal-50/80 px-3 py-0.5
                              text-[11px] font-semibold text-teal-700
                              transition-all duration-200
                              hover:border-teal-300 hover:bg-teal-100
                              hover:shadow-sm hover:shadow-teal-900/5
                              active:scale-[0.97]
                              focus-visible:outline-none
                              focus-visible:ring-2 focus-visible:ring-teal-400
                              focus-visible:ring-offset-2
                              disabled:cursor-not-allowed disabled:opacity-50
                              dark:border-teal-400/20
                              dark:bg-teal-400/[0.08] dark:text-teal-300
                              dark:hover:border-teal-400/40
                              dark:hover:bg-teal-400/[0.14]
                              dark:focus-visible:ring-offset-[#182338]
                            "
                          >
                            <Pencil
                              size={11}
                              strokeWidth={2.2}
                              className="transition-transform duration-200 group-hover:-rotate-12"
                            />
                            Edit stock
                          </button>
                        </div>

                        <TagList
                          tags={item.stockUp.map((name) => ({
                            key: name,
                            content: name,
                          }))}
                        />
                      </div>
                    )}

                    {item.offerIdeas.length > 0 && (
                      <div className="mt-auto">
                        <Recommendation
                          title={
                            item.offerIdeas.length > 1
                              ? "Offer ideas"
                              : "Offer idea"
                          }
                        >
                          <TipList tips={item.offerIdeas} />
                        </Recommendation>
                      </div>
                    )}
                  </InsightCard>
                );
              })}
            </CardGrid>
          </AiSectionBody>
        </div>
      </div>

      {selectedFestival && (
        <FestivalStockUpDialog
          festival={selectedFestival}
          products={products}
          productsLoading={productsLoading}
          open={Boolean(selectedFestival)}
          onOpenChange={(open) => {
            if (!open) setSelectedFestival(null);
          }}
        />
      )}

      {selectedOffer && (
        <CreateFestivalOfferDialog
          key={selectedOffer.item.id}
          open={Boolean(selectedOffer)}
          onClose={() => setSelectedOffer(null)}
          item={selectedOffer.item}
          offerIdea={selectedOffer.offerIdea}
          date={date}
          promptVersion={promptVersion}
          products={products}
          productsLoading={productsLoading}
          pendingOfferId={
            pendingOfferIds[selectedOffer.item.id] ??
            savedActions[selectedOffer.item.id]?.offerId ??
            null
          }
          onOfferCreated={(offerId) =>
            handleOfferCreated(selectedOffer.item.id, offerId)
          }
          onCompleted={() => handleOfferCompleted(selectedOffer.item.id)}
        />
      )}
    </section>
  );
}
