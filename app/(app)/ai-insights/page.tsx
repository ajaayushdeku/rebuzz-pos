"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import AiKeyRequiredNotice from "@/components/aiInsights/AiKeyRequiredNotice";
import AiQuotaMeter from "@/components/settingsComponents/apiKeys/AiQuotaMeter";
import AiInsightsHero from "@/components/aiInsights/sections/AiInsightsHero";
import MenuSuggestionsSection from "@/components/aiInsights/sections/MenuSuggestionsSection";
import SlowItemsSection from "@/components/aiInsights/sections/SlowItemsSection";
import PricingSection from "@/components/aiInsights/sections/PricingSection";
import HourPlaybookSection from "@/components/aiInsights/sections/HourPlaybookSection";
import FestivalPrepSection from "@/components/aiInsights/sections/FestivalPrepSection";
import SalesRecommendationsSection from "@/components/aiInsights/sections/SalesRecommendationsSection";
import CustomerRetentionSection from "@/components/aiInsights/sections/CustomerRetentionSection";
import StaffingSection from "@/components/aiInsights/sections/StaffingSection";
import { useAiKeyStatus } from "@/hooks/useAiKey";
import { useAiSection } from "@/hooks/useAiSection";
import type { FestivalPrep } from "@/lib/ai-insights/sections/festivalPrep";
import type { HourInsight } from "@/lib/ai-insights/sections/hourPlaybook";
import type { MenuSuggestion } from "@/lib/ai-insights/sections/menuSuggestions";
import type { PricingInsight } from "@/lib/ai-insights/sections/pricing";
import type { RetentionInsight } from "@/lib/ai-insights/sections/retention";
import type { StaffingInsight } from "@/lib/ai-insights/sections/staffing";
import type { SalesRecommendation } from "@/lib/ai-insights/sections/salesRecommendations";
import type { SlowItemInsight } from "@/lib/ai-insights/sections/slowItems";
import PageHeader from "@/components/ui/PageHeader";

/**
 * AI Insights. Every section is generated from the business's own sales,
 * menu, customers and staff.
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
/** Every section on the page, connected or not. */
const TOTAL_SECTIONS = 8;

export default function AIInsightPage() {
  /**
   * Whether there is a key at all, which decides whether this page has
   * anything to show.
   *
   * Only a definite "no" counts. While the status is loading, and if the
   * request for it fails, the sections load as usual: a settings route that is
   * briefly unreachable must not be reported to the merchant as "you have not
   * set this up", which would send them to re-enter a key that is already
   * there.
   */
  const keyStatus = useAiKeyStatus();
  const needsKey = keyStatus.data?.configured === false;

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

  // "Generate more" is offered where the AI can keep finding new ones: menu
  // ideas and sales recommendations. The other sections advise on a set the
  // app picks — flagged items, festivals, hours — so there is no "more".
  // `enabled` on every one of them: without a key each section's route would
  // still gather its facts from the POS — thirteen weekly sales reports for
  // pricing alone — before the AI service refused it.
  const enabled = !needsKey;
  const menuSuggestions = useAiSection<MenuSuggestion>("menu-suggestions", {
    describe: (idea) => idea.title,
    enabled,
  });
  const slowItems = useAiSection<SlowItemInsight>("slow-items", { enabled });
  const pricingSection = useAiSection<PricingInsight>("pricing", { enabled });
  const retentionSection = useAiSection<RetentionInsight>("retention", {
    enabled,
  });
  const staffingSection = useAiSection<StaffingInsight>("staffing", {
    enabled,
  });
  const hourPlaybook = useAiSection<HourInsight>("hour-playbook", { enabled });
  const festivalPrep = useAiSection<FestivalPrep>("festival-prep", { enabled });
  const salesRecommendations = useAiSection<SalesRecommendation>(
    "sales-recommendations",
    { describe: (rec) => rec.text, enabled },
  );

  const menu = keep(menuSuggestions.data?.items ?? []);
  const slow = keep(slowItems.data?.items ?? []);
  const pricing = keep(pricingSection.data?.items ?? []);
  const hours = keep(hourPlaybook.data?.items ?? []);
  const festivals = keep(festivalPrep.data?.items ?? []);
  const sales = keep(salesRecommendations.data?.items ?? []);
  const retention = keep(retentionSection.data?.items ?? []);
  const staffing = keep(staffingSection.data?.items ?? []);

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

  // ── The banner's "Generate insights" ──
  const liveSections = [
    menuSuggestions,
    slowItems,
    pricingSection,
    hourPlaybook,
    festivalPrep,
    salesRecommendations,
    retentionSection,
    staffingSection,
  ];
  const [generating, setGenerating] = useState(false);

  /**
   * Loads every connected section again, the way each one's "Try again" does.
   *
   * Not a refresh: the server answers from today's saved answer where there
   * is one, so pressing this costs nothing for a section already generated
   * today, and one AI call for each section that is not. A section in the
   * middle of its own Refresh is left alone, so the two cannot race.
   */
  const generateInsights = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const results = await Promise.all(
        liveSections.map((section) =>
          section.isRefreshing ? null : section.reload(),
        ),
      );
      const settled = results.filter((r) => r !== null);
      const failed = settled.filter((r) => r.isError).length;
      const ok = settled.filter((r) => !r.isError && r.data);
      const saved = ok.filter((r) => r.data?.cached).length;
      const fresh = ok.filter(
        (r) => r.data?.generatedAt && !r.data.cached,
      ).length;

      if (failed > 0) {
        toast.error(
          `${failed} of ${settled.length} sections couldn't load. Each one says why below.`,
        );
      } else {
        const parts = [
          saved > 0 && `${saved} from today's saved answers`,
          fresh > 0 && `${fresh} newly generated`,
        ].filter(Boolean);
        toast.success(
          `Insights are up to date${parts.length > 0 ? `: ${parts.join(", ")}` : ""}.`,
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const answered = liveSections
    .map((section) => section.data)
    .filter((data) => data?.generatedAt);
  const lastUpdated = answered
    .map((data) => data!.generatedAt!)
    .sort()
    .at(-1);
  const savedAnswers = answered.filter((data) => data!.cached).length;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto flex w-full  flex-col ">
        <PageHeader
          title="AI Insights"
          subtitle={
            /* inline-flex so the mark sits on the sentence's line rather than
               on the text baseline. */
            <span className="inline-flex items-center gap-1">
              Smart suggestions to grow revenue, fix slow items, and optimise
              every hour.
              <Sparkles
                size={16}
                className="shrink-0 text-violet-500 dark:text-violet-300"
                aria-hidden
              />
            </span>
          }
          actions={
            /* Every section below spends from the same hourly allowance, and
               "Generate insights" sits directly under this — so the number
               belongs here rather than only on the settings screen.

               `ml-auto`: stacked under the title the actions row spans the
               width, and without this the pill would sit against the left
               edge instead of hugging the right. */
            <AiQuotaMeter variant="inline" className="ml-auto" />
          }
        />

        {needsKey ? (
          /* One notice instead of the hero and eight sections: with no key
             every section can only be refused, and eight identical panels read
             as eight broken features rather than one unfinished setup. */
          <AiKeyRequiredNotice />
        ) : (
          <div className="flex flex-col gap-10">
            <AiInsightsHero
              activeInsights={activeInsights}
              slowItems={slow.length}
              shortlisted={shortlistedCount}
              liveSections={liveSections.length}
              totalSections={TOTAL_SECTIONS}
              lastUpdated={lastUpdated}
              savedAnswers={savedAnswers}
              isGenerating={
                generating || liveSections.some((section) => section.isFetching)
              }
              onGenerate={() => void generateInsights()}
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
                state={pricingSection}
                onDismiss={dismiss}
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
                state={retentionSection}
                onDismiss={dismiss}
              />
            </ChartErrorBoundary>
            <ChartErrorBoundary>
              <StaffingSection
                items={staffing}
                state={staffingSection}
                onDismiss={dismiss}
              />
            </ChartErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
