// "use client";

// import { useRouter } from "next/navigation";
// import {
//   createSuggestedPromoCode,
//   saveOfferCreationDraft,
// } from "@/lib/offers/offerCreationDraft";
// import { useState } from "react";
// import {
//   CalendarClock,
//   CalendarDays,
//   ChevronDown,
//   ChevronUp,
//   Pencil,
// } from "lucide-react";

// import type { AiSectionState } from "@/hooks/useAiSection";
// import {
//   FESTIVAL_LOOKAHEAD_DAYS,
//   type FestivalPrep,
// } from "@/lib/ai-insights/sections/festivalPrep";
// import { daysFromNepalToday } from "@/lib/nepalDate";
// import {
//   AiSectionBody,
//   BodyLabel,
//   CardGrid,
//   GenerateMoreButton,
//   InsightCard,
//   LabelNote,
//   LeadTile,
//   Recommendation,
//   SectionHeader,
//   TagList,
// } from "../parts";
// import type { Product } from "@/lib/types/product";
// import FestivalStockUpDialog from "../FestivalStockUpDialog";

// const INITIAL_CARDS = 3;

// function countdown(startDate: string, endDate: string): string | null {
//   const days = daysFromNepalToday(startDate);
//   if (days === null) return null;
//   if (days < 0) {
//     const toEnd = daysFromNepalToday(endDate);
//     return toEnd !== null && toEnd >= 0 ? "Under way" : null;
//   }
//   if (days === 0) return "Today";
//   if (days === 1) return "Tomorrow";
//   return `in ${days} days`;
// }

// function dateRange(start: string, end: string): string {
//   const parts = (iso: string) => {
//     const date = new Date(`${iso}T12:00:00Z`);
//     return {
//       month: date.toLocaleDateString("en-US", {
//         month: "short",
//         timeZone: "UTC",
//       }),
//       day: date.getUTCDate(),
//     };
//   };

//   const a = parts(start);
//   if (start === end) return `${a.month} ${a.day}`;

//   const b = parts(end);

//   return a.month === b.month
//     ? `${a.month} ${a.day} – ${b.day}`
//     : `${a.month} ${a.day} – ${b.month} ${b.day}`;
// }

// function dayCount(start: string, end: string): number {
//   const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
//   return Math.round((ms(end) - ms(start)) / 86_400_000) + 1;
// }

// function observedBy(item: FestivalPrep): string {
//   if (item.scope === "national") return "Public holiday";
//   if (item.scope === "occasion") return "Occasion";
//   return item.note ? `Holiday for ${item.note}` : "Holiday for some";
// }

// export default function FestivalPrepSection({
//   items,
//   state,
//   onDismiss,
//   products,
//   productsLoading,
// }: {
//   items: FestivalPrep[];
//   state: AiSectionState<FestivalPrep>;
//   onDismiss: (id: string) => void;
//   products: Product[];
//   productsLoading: boolean;
// }) {
//   const router = useRouter();

//   const [showAll, setShowAll] = useState(false);
//   const [isBodyExpanded, setIsBodyExpanded] = useState(true);
//   const [selectedFestival, setSelectedFestival] = useState<FestivalPrep | null>(
//     null,
//   );

//   const shown = showAll ? items : items.slice(0, INITIAL_CARDS);
//   const hidden = items.length - INITIAL_CARDS;

//   const createFestivalOffer = (item: FestivalPrep, offerIdea: string) => {
//     saveOfferCreationDraft({
//       source: "festival",
//       festivalId: item.festivalId,
//       label: item.label,
//       startDate: item.startDate,
//       endDate: item.endDate,
//       suggestedCode: createSuggestedPromoCode(
//         item.label,
//         item.startDate.slice(0, 4),
//       ),
//       offerIdea,
//     });

//     router.push("/offers");
//   };

//   return (
//     <section>
//       <SectionHeader
//         icon={CalendarDays}
//         iconClassName="bg-amber-50 text-amber-600 dark:text-amber-300 dark:bg-amber-400/10"
//         title="Upcoming Festival Prep"
//         subtitle={`Festivals and public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days, from Nepal's holiday calendar`}
//         info={{
//           heading: "Where the dates come from",
//           body: `The dates are Nepal's public holiday calendar for the next ${FESTIVAL_LOOKAHEAD_DAYS} days — not your own sales. What to prepare for each one is the AI reading those dates against what you sold around them before.`,
//         }}
//         actions={
//           <div className="flex w-full flex-row items-end justify-end gap-2 md:w-fit">
//             {hidden > 0 && (
//               <GenerateMoreButton
//                 label={showAll ? "Show fewer" : `Show all ${items.length}`}
//                 icon={CalendarDays}
//                 textClassName="text-amber-700 border-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-400/40 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/10"
//                 onClick={() => setShowAll((v) => !v)}
//               />
//             )}

//             <button
//               type="button"
//               onClick={() => setIsBodyExpanded((prev) => !prev)}
//               aria-expanded={isBodyExpanded}
//               aria-label={
//                 isBodyExpanded ? "Collapse section" : "Expand section"
//               }
//               title={isBodyExpanded ? "Collapse section" : "Expand section"}
//               className="
//                 inline-flex shrink-0 items-center justify-center
//                 rounded-lg border border-[#e2e6ed]
//                 bg-white p-2 text-[#737b89]
//                 transition-all duration-200
//                 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600
//                 dark:border-[#293750] dark:bg-[#182338]
//                 dark:text-[#aab4c4]
//                 dark:hover:border-amber-400/40
//                 dark:hover:bg-amber-400/10 dark:hover:text-amber-300
//               "
//             >
//               {isBodyExpanded ? (
//                 <ChevronUp size={15} />
//               ) : (
//                 <ChevronDown size={15} />
//               )}
//             </button>
//           </div>
//         }
//       />

//       <div
//         className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
//           isBodyExpanded
//             ? "grid-rows-[1fr] opacity-100"
//             : "grid-rows-[0fr] opacity-0"
//         }`}
//       >
//         <div className="min-h-0 overflow-hidden">
//           <AiSectionBody
//             state={state}
//             visibleCount={items.length}
//             layout="cards"
//             noSalesMessage="No recent sales to base festival advice on yet."
//             nothingFlaggedMessage={`No festivals or public holidays in the next ${FESTIVAL_LOOKAHEAD_DAYS} days.`}
//             emptyMessage="No festivals coming up."
//           >
//             <CardGrid>
//               {shown.map((item) => {
//                 const when = countdown(item.startDate, item.endDate);
//                 const range = dateRange(item.startDate, item.endDate);
//                 const days = dayCount(item.startDate, item.endDate);

//                 return (
//                   <InsightCard
//                     key={item.id}
//                     accent="amber"
//                     lead={<LeadTile accent="amber">{item.icon}</LeadTile>}
//                     label={
//                       <>
//                         <CalendarClock size={11} aria-hidden />
//                         {when ?? observedBy(item)}
//                         {when && <LabelNote>{observedBy(item)}</LabelNote>}
//                       </>
//                     }
//                     title={item.label}
//                     onDismiss={() => onDismiss(item.id)}
//                     dismissLabel={item.label}
//                     metrics={[
//                       {
//                         label: "Dates",
//                         value: range,
//                         note: `${days} day${days === 1 ? "" : "s"}`,
//                       },
//                       {
//                         label: "Nepali date",
//                         value: item.bsLabel,
//                         valueClassName:
//                           "text-emerald-700 dark:text-emerald-300",
//                       },
//                     ]}
//                   >
//                     <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
//                       {item.description}
//                     </p>

//                     {item.stockUp.length > 0 && (
//                       <div>
//                         <div className="mb-2 flex items-center justify-between gap-2">
//                           <BodyLabel>Stock up on</BodyLabel>

//                           <button
//                             type="button"
//                             onClick={() => setSelectedFestival(item)}
//                             className="
//                               inline-flex shrink-0 items-center gap-1.5
//                               rounded-md border border-amber-200
//                               bg-amber-50 px-2.5 py-1.5
//                               text-[11px] font-semibold text-amber-700
//                               transition-colors
//                               hover:border-amber-300 hover:bg-amber-100
//                               focus-visible:outline-none focus-visible:ring-2
//                               focus-visible:ring-amber-400
//                               dark:border-amber-400/20
//                               dark:bg-amber-400/10 dark:text-amber-300
//                               dark:hover:border-amber-400/40
//                               dark:hover:bg-amber-400/15
//                             "
//                           >
//                             <Pencil size={11} />
//                             Edit stock-up
//                           </button>
//                         </div>

//                         <TagList
//                           tags={item.stockUp.map((name) => ({
//                             key: name,
//                             content: name,
//                           }))}
//                         />
//                       </div>
//                     )}

//                     {item.offerIdeas.length > 0 && (
//                       <div className="mt-auto">
//                         <Recommendation
//                           title={
//                             item.offerIdeas.length > 1
//                               ? "Offer ideas"
//                               : "Offer idea"
//                           }
//                         >
//                           <div className="divide-y divide-[#eee9df] dark:divide-[#344057]">
//                             {item.offerIdeas.map((idea, index) => (
//                               <div
//                                 key={`${item.id}-offer-${index}`}
//                                 className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
//                               >
//                                 <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
//                                   {idea}
//                                 </p>

//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     createFestivalOffer(item, idea)
//                                   }
//                                   className="
//                                     inline-flex shrink-0 items-center gap-1
//                                     rounded-md px-2 py-1.5
//                                     text-[11px] font-semibold
//                                     text-amber-700 transition-colors
//                                     hover:bg-amber-50 hover:text-amber-800
//                                     focus-visible:outline-none
//                                     focus-visible:ring-2
//                                     focus-visible:ring-amber-400
//                                     dark:text-amber-300
//                                     dark:hover:bg-amber-400/10
//                                     dark:hover:text-amber-200
//                                   "
//                                 >
//                                   Create offer
//                                   <span aria-hidden="true">→</span>
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         </Recommendation>
//                       </div>
//                     )}
//                   </InsightCard>
//                 );
//               })}
//             </CardGrid>
//           </AiSectionBody>
//         </div>
//       </div>

//       {selectedFestival && (
//         <FestivalStockUpDialog
//           festival={selectedFestival}
//           products={products}
//           productsLoading={productsLoading}
//           open={Boolean(selectedFestival)}
//           onOpenChange={(open) => {
//             if (!open) setSelectedFestival(null);
//           }}
//         />
//       )}
//     </section>
//   );
// }
"use client";

import { useRouter } from "next/navigation";
import {
  createSuggestedPromoCode,
  saveOfferCreationDraft,
} from "@/lib/offers/offerCreationDraft";
import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";

import type { AiSectionState } from "@/hooks/useAiSection";
import {
  FESTIVAL_LOOKAHEAD_DAYS,
  type FestivalPrep,
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

export default function FestivalPrepSection({
  items,
  state,
  onDismiss,
  products,
  productsLoading,
}: {
  items: FestivalPrep[];
  state: AiSectionState<FestivalPrep>;
  onDismiss: (id: string) => void;
  products: Product[];
  productsLoading: boolean;
}) {
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(true);
  const [selectedFestival, setSelectedFestival] = useState<FestivalPrep | null>(
    null,
  );

  const shown = showAll ? items : items.slice(0, INITIAL_CARDS);
  const hidden = items.length - INITIAL_CARDS;

  const createFestivalOffer = (item: FestivalPrep, offerIdea: string) => {
    saveOfferCreationDraft({
      source: "festival",
      festivalId: item.festivalId,
      label: item.label,
      startDate: item.startDate,
      endDate: item.endDate,
      suggestedCode: createSuggestedPromoCode(
        item.label,
        item.startDate.slice(0, 4),
      ),
      offerIdea,
    });

    router.push("/offers");
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
                      item.offerIdeas.length > 0 ? (
                        <CardAction
                          onClick={() =>
                            createFestivalOffer(
                              item,
                              getPreferredOfferIdea(item.offerIdeas),
                            )
                          }
                        >
                          Plan a {item.label} offer
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
    </section>
  );
}
