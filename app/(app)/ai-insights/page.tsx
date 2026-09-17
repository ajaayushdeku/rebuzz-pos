"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import { comingSoon } from "@/components/aiInsights/parts";
import AiInsightsHero from "@/components/aiInsights/sections/AiInsightsHero";
import MenuSuggestionsSection from "@/components/aiInsights/sections/MenuSuggestionsSection";
import SlowItemsSection from "@/components/aiInsights/sections/SlowItemsSection";
import PricingSection from "@/components/aiInsights/sections/PricingSection";
import HourPlaybookSection from "@/components/aiInsights/sections/HourPlaybookSection";
import FestivalPrepSection from "@/components/aiInsights/sections/FestivalPrepSection";
import SalesRecommendationsSection from "@/components/aiInsights/sections/SalesRecommendationsSection";
import CustomerRetentionSection from "@/components/aiInsights/sections/CustomerRetentionSection";
import StaffingSection from "@/components/aiInsights/sections/StaffingSection";
import {
  MOCK_PRICING,
  MOCK_RETENTION,
  MOCK_STAFFING,
} from "@/lib/mockData/mock-ai-insights";
import { useAiSection } from "@/hooks/useAiSection";
import type { FestivalPrep } from "@/lib/ai-insights/sections/festivalPrep";
import type { HourInsight } from "@/lib/ai-insights/sections/hourPlaybook";
import type { MenuSuggestion } from "@/lib/ai-insights/sections/menuSuggestions";
import type { SalesRecommendation } from "@/lib/ai-insights/sections/salesRecommendations";
import type { SlowItemInsight } from "@/lib/ai-insights/sections/slowItems";

/**
 * AI Insights. Menu Suggestions, Slow Items, the Hour-by-Hour Playbook,
 * Festival Prep and Sales Recommendations are generated from the business's
 * own sales and menu; the other sections are still sample data, connected one
 * at a time.
 *
 * Dismissals and the shortlist are held here rather than inside each section,
 * because the banner at the top summarises all of them. Each section only
 * receives the items still on the page, so its count, its empty state and the
 * banner's totals are all read from the same list.
 *
 * Nothing is saved yet: a reload brings every card back. That is deliberate
 * while the data is sample data — persisting a dismissal of an invented card
 * would have nothing real to attach to.
 */
export default function AIInsightPage() {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const [shortlisted, setShortlisted] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const dismiss = (id: string) => setDismissed((prev) => new Set(prev).add(id));

  const toggleShortlist = (id: string) =>
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const keep = <T extends { id: string }>(items: T[]) =>
    items.filter((item) => !dismissed.has(item.id));

  const menuSuggestions = useAiSection<MenuSuggestion>("menu-suggestions");
  const slowItems = useAiSection<SlowItemInsight>("slow-items");
  const hourPlaybook = useAiSection<HourInsight>("hour-playbook");
  const festivalPrep = useAiSection<FestivalPrep>("festival-prep");
  const salesRecommendations = useAiSection<SalesRecommendation>(
    "sales-recommendations",
  );

  const menu = keep(menuSuggestions.data?.items ?? []);
  const slow = keep(slowItems.data?.items ?? []);
  const pricing = keep(MOCK_PRICING);
  const hours = keep(hourPlaybook.data?.items ?? []);
  const festivals = keep(festivalPrep.data?.items ?? []);
  const sales = keep(salesRecommendations.data?.items ?? []);
  const retention = keep(MOCK_RETENTION);
  const staffing = keep(MOCK_STAFFING);

  const activeInsights =
    menu.length +
    slow.length +
    pricing.length +
    hours.length +
    festivals.length +
    sales.length +
    retention.length +
    staffing.length;

  // A dismissed idea is no longer on the shortlist, even though its id stays
  // in the set — un-dismissing is not possible, so there is no need to prune.
  const shortlistedCount = menu.filter((item) =>
    shortlisted.has(item.id),
  ).length;

  const generate = () => comingSoon("Generating more insights");

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full  flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap- pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              AI Insights
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex flex-row items-center gap-1">
              Smart suggestions to grow revenue, fix slow items, and optimise
              every hour.
              <Sparkles
                size={16}
                className="shrink-0 text-violet-500"
                aria-hidden
              />
            </p>
          </div>
        </div>

        <AiInsightsHero
          activeInsights={activeInsights}
          slowItems={slow.length}
          shortlisted={shortlistedCount}
          onGenerate={generate}
        />

        {/* One boundary per section, so a failure in one cannot blank the
            rest of the page. */}
        <ChartErrorBoundary>
          <MenuSuggestionsSection
            items={menu}
            state={menuSuggestions}
            shortlisted={shortlisted}
            onToggleShortlist={toggleShortlist}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <SlowItemsSection
            items={slow}
            state={slowItems}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <PricingSection
            items={pricing}
            onDismiss={dismiss}
            onGenerate={generate}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <HourPlaybookSection
            items={hours}
            state={hourPlaybook}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <FestivalPrepSection
            items={festivals}
            state={festivalPrep}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <SalesRecommendationsSection
            items={sales}
            state={salesRecommendations}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <CustomerRetentionSection
            items={retention}
            onDismiss={dismiss}
            onGenerate={generate}
          />
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <StaffingSection
            items={staffing}
            onDismiss={dismiss}
            onGenerate={generate}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
