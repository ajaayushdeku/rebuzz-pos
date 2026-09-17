"use client";

import { useState } from "react";
import { FlaskConical, Search, Sparkles, Star } from "lucide-react";

import SegmentedControl from "@/components/ui/SegmentedControl";
import type {
  Difficulty,
  MenuSuggestion,
} from "@/lib/mockData/mock-ai-insights";
import {
  Card,
  CardGrid,
  DismissButton,
  EmptySection,
  GenerateMoreButton,
  SectionHeader,
  useMoney,
} from "../parts";

type DifficultyFilter = "all" | Difficulty;

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
] as const satisfies readonly { value: DifficultyFilter; label: string }[];

export default function MenuSuggestionsSection({
  items,
  shortlisted,
  onToggleShortlist,
  onDismiss,
  onGenerate,
}: {
  items: MenuSuggestion[];
  shortlisted: ReadonlySet<string>;
  onToggleShortlist: (id: string) => void;
  onDismiss: (id: string) => void;
  onGenerate: () => void;
}) {
  const money = useMoney();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  // Search reads the whole idea, not only its title: someone looking for what
  // to do with leftover croissants types "croissant", which lives in the
  // ingredients as often as in the name.
  const needle = query.trim().toLowerCase();
  const visible = items.filter(
    (item) =>
      (difficulty === "all" || item.difficulty === difficulty) &&
      (!needle ||
        [item.title, item.description, ...item.ingredients].some((text) =>
          text.toLowerCase().includes(needle),
        )),
  );

  return (
    <section>
      <SectionHeader
        icon={Sparkles}
        iconClassName="bg-violet-50 text-violet-600"
        title="AI Menu Suggestions"
        subtitle="Smart recipes derived from best-sellers"
        actions={
          <>
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
            <SegmentedControl
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              accent="purple"
            />
            <GenerateMoreButton
              textClassName="text-violet-600"
              onClick={onGenerate}
            />
          </>
        }
      />

      {items.length === 0 ? (
        <EmptySection message="No menu ideas right now." />
      ) : visible.length === 0 ? (
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
                    <Star size={14} fill={starred ? "currentColor" : "none"} />
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
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        +{money(item.weeklyUplift)}/wk
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

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                    <span className="text-gray-400">AI confidence</span>
                    <span className="text-violet-600">{item.confidence}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${item.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    <FlaskConical size={12} className="text-violet-500" />
                    Ingredients
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.ingredients.map((ingredient) => (
                      <li
                        key={ingredient}
                        className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-700"
                      >
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </CardGrid>
      )}
    </section>
  );
}
