"use client";

import { useState } from "react";
import { Search, Sparkles, Star, UtensilsCrossed } from "lucide-react";

import SegmentedControl from "@/components/ui/SegmentedControl";
import type { AiSectionState } from "@/hooks/useAiSection";
import type {
  Difficulty,
  MenuIdeaKind,
  MenuSuggestion,
} from "@/lib/ai-insights/sections/menuSuggestions";
import { SECTION_WINDOW_DAYS } from "@/lib/ai-insights/sections/shared";
import {
  AiSectionBody,
  Card,
  CardGrid,
  DismissButton,
  EmptySection,
  SectionHeader,
  SectionRefreshButton,
  useMoney,
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
        iconClassName="bg-violet-50 text-violet-600"
        title="AI Menu Suggestions"
        subtitle={`Ideas built from your best sellers of the last ${SECTION_WINDOW_DAYS} days`}
        actions={
          <div className="flex flex-row w-full md:w-fit gap-2 justify-between">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu ideas..."
                aria-label="Search menu ideas"
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-52"
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
              <SectionRefreshButton
                state={state}
                textClassName="text-violet-600"
              />
            </div>
          </div>
        }
      />

      <AiSectionBody
        state={state}
        visibleCount={items.length}
        layout="cards"
        noSalesMessage={`No sales in the last ${SECTION_WINDOW_DAYS} days, so there are no best sellers to build ideas on yet.`}
        emptyMessage="No menu ideas right now."
      >
        {visible.length === 0 ? (
          <EmptySection message="No menu ideas match that search." />
        ) : (
          <CardGrid>
            {visible.map((item) => {
              const starred = shortlisted.has(item.id);
              return (
                <Card key={item.id}>
                  <div className="absolute right-3 top-3 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleShortlist(item.id)}
                      aria-pressed={starred}
                      aria-label={
                        starred
                          ? `Remove ${item.title} from shortlist`
                          : `Shortlist ${item.title}`
                      }
                      className={`rounded-md p-1 transition-colors hover:bg-gray-100 ${
                        starred
                          ? "text-amber-400"
                          : "text-gray-300 hover:text-gray-500"
                      }`}
                    >
                      <Star
                        size={14}
                        fill={starred ? "currentColor" : "none"}
                      />
                    </button>
                    <DismissButton
                      label={item.title}
                      onClick={() => onDismiss(item.id)}
                      className=""
                    />
                  </div>

                  <div className="flex items-start gap-3 pr-14">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          {KIND_LABEL[item.kind]}
                        </span>
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500">
                          {item.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[13px] leading-relaxed text-gray-600">
                    {item.description}
                  </p>

                  {/* The price to try, set against what the items cost bought
                      one by one. Both prices are only shown when they are
                      real: the menu's own, and a suggestion that covers cost. */}
                  {item.suggestedPrice !== null && (
                    <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-[13px]">
                      <span className="text-gray-500">Try at</span>
                      <span className="font-bold text-emerald-700">
                        {money(item.suggestedPrice)}
                      </span>
                      {item.separatePrice !== null &&
                        item.separatePrice > item.suggestedPrice && (
                          <span className="text-[12px] text-gray-400">
                            (
                            <span className="line-through">
                              {money(item.separatePrice)}
                            </span>{" "}
                            if bought separately)
                          </span>
                        )}
                    </p>
                  )}

                  <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <UtensilsCrossed size={12} className="text-violet-500" />
                      Built from your menu
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {item.builtFrom.map((b) => (
                        <li
                          key={b.name}
                          className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-700"
                        >
                          {b.name}
                          <span className="ml-1 text-gray-400">
                            {money(b.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </CardGrid>
        )}
      </AiSectionBody>
    </section>
  );
}
