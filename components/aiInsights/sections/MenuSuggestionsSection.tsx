"use client";

import { useState } from "react";
import { Search, Sparkles, Star } from "lucide-react";

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
  CardAction,
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
}: {
  /** The ideas still on the page, after dismissals. */
  items: MenuSuggestion[];
  state: AiSectionState<MenuSuggestion>;
  shortlisted: ReadonlySet<string>;
  onToggleShortlist: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  // The period these cards describe, or this section's own rolling window
  // when there is none — see components/aiInsights/periodLabel.tsx.
  const windowText = useWindowPhrase(`the last ${SECTION_WINDOW_DAYS} days`);

  const money = useMoney();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  // Search reads the whole idea, not only its title: someone looking for what
  // to do with their momos types "momo", which is as likely to be in the items
  // it is built from as in its name.
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
        icon={Sparkles}
        iconClassName="bg-violet-50 text-violet-600 dark:text-violet-300 dark:bg-violet-400/10"
        title="AI Menu Suggestions"
        subtitle={`Ideas built from your best sellers in ${windowText}`}
        info={{
          heading: "Where these come from",
          body: `The AI is given your best-selling items from ${windowText} and asked what else would sell beside them. Nothing here is on your menu yet — each card is a proposal, with the items it was built from listed on it.`,
        }}
        actions={
          <div className="flex flex-row w-full md:w-fit gap-2 justify-between">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu ideas..."
                aria-label="Search menu ideas"
                className="h-9 w-full rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 pl-9 pr-3 text-[13px] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-52 dark:focus:border-violet-400/60 dark:focus:ring-violet-400/25 dark:border-white/15"
              />
            </div>
            <div className="flex items-center gap-2">
              {" "}
              <SegmentedControl
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={setDifficulty}
                accent="blue"
              />
              <SectionMoreButton
                state={state}
                textClassName="text-violet-600 hover:bg-violet-100 border-violet-300 hover:border-violet-400 dark:hover:border-violet-400/60 dark:hover:bg-violet-400/20 dark:border-violet-400/40 dark:text-violet-300"
              />
              {/* <SectionRefreshButton
                state={state}
                textClassName="text-violet-600 hover:bg-violet-100 border-violet-300 hover:border-violet-400 dark:hover:border-violet-400/60 dark:hover:bg-violet-400/20 dark:border-violet-400/40 dark:text-violet-300"
              /> */}
            </div>
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`No sales in ${windowText}, so there are no best sellers to build ideas on.`}
        emptyMessage="No menu ideas right now."
      >
        {visible.length === 0 ? (
          <EmptySection message="No menu ideas match that search." />
        ) : (
          <CardGrid>
            {visible.map((item) => {
              const starred = shortlisted.has(item.id);
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
                  corner={
                    <button
                      type="button"
                      onClick={() => onToggleShortlist(item.id)}
                      aria-pressed={starred}
                      aria-label={
                        starred
                          ? `Remove ${item.title} from shortlist`
                          : `Shortlist ${item.title}`
                      }
                      className={`rounded-md p-1 transition-colors hover:bg-[#f1f3f4] ${
                        starred
                          ? "text-amber-400"
                          : "text-[#9aa0a6] hover:text-[#5f6368] dark:hover:text-[#e8ecf4] dark:text-[#9aa6bd]"
                      } dark:hover:bg-white/10`}
                    >
                      <Star
                        size={14}
                        fill={starred ? "currentColor" : "none"}
                      />
                    </button>
                  }
                  metrics={menuMetrics(item, money)}
                  // A new item is added on the products page.
                  footer={
                    <CardAction href="/records/products/add" primary={true}>
                      Add to menu
                    </CardAction>
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
    </section>
  );
}
