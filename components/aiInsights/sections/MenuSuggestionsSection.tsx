"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PackagePlus,
  Search,
  Star,
  UtensilsCrossed,
} from "lucide-react";

import SegmentedControl from "@/components/ui/SegmentedControl";
import type { AiSectionState } from "@/hooks/useAiSection";
import type {
  Difficulty,
  MenuIdeaKind,
  MenuSuggestion,
} from "@/lib/ai-insights/sections/menuSuggestions";
import { SECTION_WINDOW_DAYS } from "@/lib/ai-insights/sections/shared";
import { useWindowPhrase } from "@/components/aiInsights/periodLabel";
import {
  AiSectionBody,
  BodyLabel,
  // CardAction,
  CardGrid,
  EmptySection,
  InsightCard,
  LeadTile,
  SectionHeader,
  SectionMoreButton,
  SectionRefreshButton,
  TagList,
  useMoney,
  type AccentName,
  type Metric,
} from "../parts";

type DifficultyFilter = "all" | Difficulty;

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
] as const satisfies readonly { value: DifficultyFilter; label: string }[];

const KIND_LABEL: Record<MenuIdeaKind, string> = {
  combo: "Combo",
  "new-item": "New item",
  "add-on": "Add-on",
};

/** Each kind of idea has its own accent, so a row of cards scans by colour. */
const KIND_ACCENT: Record<MenuIdeaKind, AccentName> = {
  combo: "blue",
  "new-item": "emerald",
  "add-on": "amber",
};

/** The price to try, what it replaces, and the effort — all from the app. */
function menuMetrics(
  item: MenuSuggestion,
  money: (value: number) => string,
): Metric[] {
  const metrics: Metric[] = [];
  if (item.suggestedPrice !== null) {
    metrics.push({
      label: "Try at",
      value: money(item.suggestedPrice),
      valueClassName: "text-emerald-700 dark:text-emerald-300",
    });
  }
  if (
    item.suggestedPrice !== null &&
    item.separatePrice !== null &&
    item.separatePrice > item.suggestedPrice
  ) {
    metrics.push({
      label: "Separately",
      value: money(item.separatePrice),
      valueClassName: "text-[#9aa0a6] line-through dark:text-[#9aa6bd]",
      note: `saves ${money(item.separatePrice - item.suggestedPrice)}`,
    });
  } else {
    metrics.push({
      label: "Uses",
      value: `${item.builtFrom.length} item${item.builtFrom.length === 1 ? "" : "s"}`,
      note: "from your menu",
    });
  }
  metrics.push({ label: "Effort", value: item.difficulty });
  return metrics;
}

export default function MenuSuggestionsSection({
  items,
  state,
  shortlisted,
  onToggleShortlist,
  onDismiss,
  onAddToMenu,
  productLimitLoading,
  onViewProduct,
}: {
  /** The ideas still on the page, after dismissals. */
  items: MenuSuggestion[];
  state: AiSectionState<MenuSuggestion>;
  shortlisted: ReadonlySet<string>;
  onToggleShortlist: (id: string) => void;
  onDismiss: (id: string) => void;
  onAddToMenu: (item: MenuSuggestion) => void;
  productLimitLoading: boolean;
  onViewProduct: (productId: string) => void;
}) {
  const windowText = useWindowPhrase(`the last ${SECTION_WINDOW_DAYS} days`);

  const money = useMoney();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  const [isBodyExpanded, setIsBodyExpanded] = useState(true);

  const needle = query.trim().toLowerCase();
  const visible = items.filter(
    (item) =>
      (difficulty === "all" || item.difficulty === difficulty) &&
      (!needle ||
        [
          item.title,
          item.description,
          ...item.builtFrom.map((b) => b.name),
        ].some((text) => text.toLowerCase().includes(needle))),
  );

  return (
    <section>
      <SectionHeader
        icon={UtensilsCrossed}
        iconClassName="border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-300"
        title="AI Menu Suggestions"
        subtitle={`Ideas built from your best sellers in ${windowText}`}
        info={{
          heading: "Where these come from",
          body: `The AI is given your best-selling items from ${windowText} and asked what else would sell beside them. Nothing here is on your menu yet — each card is a proposal, with the items it was built from listed on it.`,
        }}
        align="flex-wrap"
        // actionWidth="w-full"
        actions={
          <div className="flex flex-row w-full md:w-fit items-end justify-end gap-2 ">
            {/* <SegmentedControl
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              accent="blue"
              showText={true}
            /> */}

            <SectionRefreshButton
              state={state}
              textClassName="text-pink-600 hover:bg-pink-100 border-pink-300 hover:border-pink-400 dark:hover:border-pink-400/60 dark:hover:bg-pink-400/20 dark:border-pink-400/40 dark:text-pink-300"
            />

            <SectionMoreButton
              state={state}
              textClassName="text-pink-600 hover:bg-pink-100 border-pink-300 hover:border-pink-400 dark:hover:border-pink-400/60 dark:hover:bg-pink-400/20 dark:border-pink-400/40 dark:text-pink-300"
            />

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
  hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600
  dark:border-[#293750] dark:bg-[#182338]
  dark:text-[#aab4c4]
  dark:hover:border-pink-400/40
  dark:hover:bg-pink-400/10 dark:hover:text-pink-300
"
            >
              {isBodyExpanded ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>

            {/* <SectionRefreshButton
                state={state}
                textClassName="text-violet-600 hover:bg-violet-100 border-violet-300 hover:border-violet-400 dark:hover:border-violet-400/60 dark:hover:bg-violet-400/20 dark:border-violet-400/40 dark:text-violet-300"
              /> */}
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
            noSalesMessage={`No sales in ${windowText}, so there are no best sellers to build ideas on.`}
            emptyMessage="No menu ideas right now."
          >
            {/* <div className="relative w-full mb-4">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu ideas..."
                aria-label="Search menu ideas"
                className="h-9 w-full  rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 pl-9 pr-3 text-[13px] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100  dark:focus:border-violet-400/60 dark:focus:ring-violet-400/25 dark:border-white/15"
              />
            </div> */}
            {visible.length === 0 ? (
              <EmptySection message="No menu ideas match that search." />
            ) : (
              <CardGrid>
                {visible.map((item) => {
                  const starred = shortlisted.has(item.id);
                  const added = item.status === "added";
                  const dismissed = item.status === "dismissed";
                  return (
                    <InsightCard
                      key={item.id}
                      accent={KIND_ACCENT[item.kind]}
                      lead={
                        <LeadTile accent={KIND_ACCENT[item.kind]}>
                          {item.icon}
                        </LeadTile>
                      }
                      label={KIND_LABEL[item.kind]}
                      title={item.title}
                      onDismiss={() => onDismiss(item.id)}
                      dismissLabel={item.title}
                      dismissible={!added}
                      // corner={
                      //   <button
                      //     type="button"
                      //     onClick={() => onToggleShortlist(item.id)}
                      //     aria-pressed={starred}
                      //     aria-label={
                      //       starred
                      //         ? `Remove ${item.title} from shortlist`
                      //         : `Shortlist ${item.title}`
                      //     }
                      //     className={`rounded-md p-1 transition-colors hover:bg-[#f1f3f4] ${
                      //       starred
                      //         ? "text-amber-400"
                      //         : "text-[#9aa0a6] hover:text-[#5f6368] dark:hover:text-[#e8ecf4] dark:text-[#9aa6bd]"
                      //     } dark:hover:bg-white/10`}
                      //   >
                      //     <Star
                      //       size={14}
                      //       fill={starred ? "currentColor" : "none"}
                      //     />
                      //   </button>
                      // }
                      metrics={menuMetrics(item, money)}
                      // A new item is added on the products page.
                      // footer={
                      //   <CardAction href="/records/products" primary={true}>
                      //     Add to menu
                      //   </CardAction>
                      // }
                      footer={
                        <div className="flex w-full flex-col gap-2.5 pt-2">
                          {added ? (
                            <>
                              <div
                                className="
            flex w-full items-center justify-center gap-2
            rounded-lg border border-emerald-200
            bg-emerald-50 px-3 py-2.5
            text-[13px] font-semibold text-emerald-700
            dark:border-emerald-400/25
            dark:bg-emerald-400/10
            dark:text-emerald-300
          "
                              >
                                <Check className="h-4 w-4 shrink-0" />
                                Added to Menu
                              </div>

                              {item.addedProductId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewProduct(item.addedProductId!)
                                  }
                                  className="
              flex w-full items-center justify-center gap-2
              rounded-lg border border-[#244074]/20
              bg-[#244074]/5  px-3 py-2.5 text-[13px]  font-semibold text-[#244074]
              transition-all duration-200
              hover:border-[#244074]/40
              hover:bg-[#244074]/10
              active:scale-[0.99]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#244074]/40
              dark:border-blue-400/20
              dark:bg-blue-400/10
              dark:text-blue-300
              dark:hover:bg-blue-400/15 cursor-pointer
            "
                                >
                                  View Product
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : dismissed ? (
                            <div
                              className="
          flex w-full items-center justify-center gap-2
          rounded-lg border border-gray-200
          bg-gray-50 px-3 py-2.5
          text-[13px] font-semibold text-gray-500
          dark:border-white/10
          dark:bg-white/5 dark:text-gray-400
        "
                            >
                              Dismissed
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAddToMenu(item)}
                              disabled={
                                (productLimitLoading &&
                                  item.kind !== "add-on") ||
                                added ||
                                dismissed
                              }
                              title={
                                productLimitLoading
                                  ? "Checking product limit..."
                                  : "Create a product from this suggestion"
                              }
                              className="
          flex w-full items-center justify-center gap-2
          rounded-lg border border-[#244074]
          bg-[#244074] px-3 py-2.5 text-[13px]  font-semibold text-white
          shadow-sm transition-all duration-200
          hover:border-[#1b3158]
          hover:bg-[#1b3158]
          hover:shadow-md
          active:scale-[0.99]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#244074]/40
          focus-visible:ring-offset-2
          disabled:pointer-events-none
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:shadow-none
          dark:border-[#42649e]
          dark:bg-[#244074]
          dark:hover:bg-[#2e5087]
          cursor-pointer
        "
                            >
                              <PackagePlus className="h-4 w-4" />
                              Add to Menu
                            </button>
                          )}
                        </div>
                      }
                    >
                      <p className="text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
                        {item.description}
                      </p>

                      <div className="mt-auto">
                        <BodyLabel>Built from your menu</BodyLabel>
                        <TagList
                          tags={item.builtFrom.map((b) => ({
                            key: b.name,
                            content: (
                              <>
                                {b.name}
                                <span className="ml-1.5 text-[#9aa0a6] dark:text-[#9aa6bd]">
                                  {money(b.price)}
                                </span>
                              </>
                            ),
                          }))}
                        />
                      </div>
                    </InsightCard>
                  );
                })}
              </CardGrid>
            )}
          </AiSectionBody>
        </div>
      </div>
    </section>
  );
}
