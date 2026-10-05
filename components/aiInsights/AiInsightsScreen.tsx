"use client";

import { useState } from "react";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";

import AiKeyRequiredNotice from "@/components/aiInsights/AiKeyRequiredNotice";
import CustomerRetentionSection from "@/components/aiInsights/sections/CustomerRetentionSection";
import FestivalPrepSection from "@/components/aiInsights/sections/FestivalPrepSection";
import HourPlaybookSection from "@/components/aiInsights/sections/HourPlaybookSection";
import MenuSuggestionsSection from "@/components/aiInsights/sections/MenuSuggestionsSection";
import PeriodSelector from "@/components/aiInsights/PeriodSelector";
import { PeriodLabelProvider } from "@/components/aiInsights/periodLabel";
import PeriodPricesNote from "@/components/aiInsights/PeriodPricesNote";
import PricingSection from "@/components/aiInsights/sections/PricingSection";
import SalesRecommendationsSection from "@/components/aiInsights/sections/SalesRecommendationsSection";
import SlowItemsSection from "@/components/aiInsights/sections/SlowItemsSection";
import StaffingSection from "@/components/aiInsights/sections/StaffingSection";
import ChartErrorBoundary from "@/components/ui/charterrorboundary";
import { useAiKeyStatus } from "@/hooks/useAiKey";
import { useAiSection } from "@/hooks/useAiSection";
import {
  usePeriodInsights,
  usePeriodList,
  useGeneratePeriod,
} from "@/hooks/usePeriodInsights";
import { usePeriodSection } from "@/hooks/usePeriodSection";
import type { FestivalPrep } from "@/lib/ai-insights/sections/festivalPrep";
import type { HourInsight } from "@/lib/ai-insights/sections/hourPlaybook";
import type { MenuSuggestion } from "@/lib/ai-insights/sections/menuSuggestions";
import type { PricingInsight } from "@/lib/ai-insights/sections/pricing";
import type { RetentionInsight } from "@/lib/ai-insights/sections/retention";
import type { SalesRecommendation } from "@/lib/ai-insights/sections/salesRecommendations";
import type { SlowItemInsight } from "@/lib/ai-insights/sections/slowItems";
import type { StaffingInsight } from "@/lib/ai-insights/sections/staffing";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

/**
 * AI Insights for a completed analytics period.
 *
 * What changed from the day-scoped page: opening it costs nothing. It reads what
 * has already been generated for the chosen period and shows it. Generating is a
 * button, pressed by an admin, and a closed period only ever needs it once — its
 * figures are final, so the answer is too.
 *
 * `festival-prep` is the exception and stays as it was: it advises on *coming*
 * festivals, so there is no period for it to describe. It sits below the period
 * sections, outside the selector's reach.
 */
export default function AiInsightsScreen({ isAdmin }: { isAdmin: boolean }) {
  /**
   * Whether there is a key at all.
   *
   * Only a definite "no" counts: while it loads, and if the request fails, the
   * page carries on. Telling someone with a saved key that they have not set one
   * up would send them to re-enter something that is already there.
   */
  const keyStatus = useAiKeyStatus();
  const needsKey = keyStatus.data?.configured === false;

  // ── Which period ────────────────────────────────────────────────────────
  const [kind, setKind] = useState<PeriodKind>("month");
  const [chosenId, setChosenId] = useState<string | null>(null);

  const periodList = usePeriodList(kind);
  // The service names its own default — the most recent completed period. Waited
  // for rather than guessed, so every cache key is a real period id.
  const periodId = chosenId ?? periodList.data?.default ?? null;

  const insights = usePeriodInsights(kind, periodId);
  const stored = insights.data?.sections ?? {};
  const period = insights.data?.period;
  const missing = insights.data?.missing ?? [];
  const totalSections = insights.data?.totalSections ?? 0;

  const generation = useGeneratePeriod(kind, periodId ?? "");

  // ── Dismissals and the shortlist ────────────────────────────────────────
  // Per period, because a card dismissed from September has nothing to do with
  // the same section in August.
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

  // ── The sections ────────────────────────────────────────────────────────
  const shared = {
    kind,
    periodId: periodId ?? "",
    isPeriodLoading: insights.isLoading,
  };

  const pricingSection = usePeriodSection<PricingInsight>({
    ...shared,
    section: "pricing",
    stored: stored.pricing,
  });
  const slowItems = usePeriodSection<SlowItemInsight>({
    ...shared,
    section: "slow-items",
    stored: stored["slow-items"],
  });
  const menuSuggestions = usePeriodSection<MenuSuggestion>({
    ...shared,
    section: "menu-suggestions",
    stored: stored["menu-suggestions"],
    supportsMore: true,
    describe: (idea) => idea.title,
  });
  const salesRecommendations = usePeriodSection<SalesRecommendation>({
    ...shared,
    section: "sales-recommendations",
    stored: stored["sales-recommendations"],
    supportsMore: true,
    describe: (rec) => rec.text,
  });
  const retentionSection = usePeriodSection<RetentionInsight>({
    ...shared,
    section: "retention",
    stored: stored.retention,
  });
  const hourPlaybook = usePeriodSection<HourInsight>({
    ...shared,
    section: "hour-playbook",
    stored: stored["hour-playbook"],
  });
  const staffingSection = usePeriodSection<StaffingInsight>({
    ...shared,
    section: "staffing",
    stored: stored.staffing,
  });

  /**
   * The festival section, still on the day-scoped path.
   *
   * Held back until a key is known to exist, so a page without one does not fire
   * a request whose route gathers POS data before it can be refused.
   */
  const festivalPrep = useAiSection<FestivalPrep>("festival-prep", {
    enabled: !needsKey,
  });

  const menu = keep(menuSuggestions.data?.items ?? []);
  const slow = keep(slowItems.data?.items ?? []);
  const pricing = keep(pricingSection.data?.items ?? []);
  const hours = keep(hourPlaybook.data?.items ?? []);
  const sales = keep(salesRecommendations.data?.items ?? []);
  const retention = keep(retentionSection.data?.items ?? []);
  const staffing = keep(staffingSection.data?.items ?? []);
  const festivals = keep(festivalPrep.data?.items ?? []);

  /**
   * Generate whatever this period is missing.
   *
   * Two at a time, failures recorded rather than fatal — see `useGeneratePeriod`.
   * The refusal for a non-admin is said here rather than left to the server's
   * 403, so nobody waits through seven requests to be told.
   */
  const generateMissing = async () => {
    if (!isAdmin) {
      toast.error("Only the business admin can generate insights.");
      return;
    }
    if (!periodId || missing.length === 0) return;

    const result = await generation.run(missing);
    if (!result) return;

    const made = result.total - result.failed.length;
    if (result.failed.length === 0) {
      toast.success(`${made} section${made === 1 ? "" : "s"} generated.`);
    } else {
      toast.error(
        `${made} of ${result.total} generated. ${result.failed.length} failed — each card says why.`,
      );
    }
  };

  if (needsKey) {
    // One notice instead of the whole page: with no key nothing here can be
    // generated, and seven identical panels read as seven broken features.
    return <AiKeyRequiredNotice />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PeriodSelector
        kind={kind}
        periodId={periodId}
        onChange={(next) => {
          if (next.kind !== kind) {
            setKind(next.kind);
            // The new kind's own default, rather than an id from the old one.
            setChosenId(null);
          } else {
            setChosenId(next.periodId);
          }
          // Dismissals belong to the period they were made in.
          setDismissed(new Set());
          setShortlisted(new Set());
        }}
      />

      {/* Said once, above the cards: the sales are historical, the prices are
          not. Per-section tooltips were the wrong place — they open on hover and
          not at all on a touch screen. */}
      <PeriodPricesNote period={period} />

      {/* While a run is going: what is done, and what failed. A spinner alone
          would say nothing for the minute or so this takes. */}
      {generation.progress && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-[#3c4043] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-[#e8ecf4]"
        >
          {generation.isRunning ? (
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-300"
              aria-hidden
            />
          ) : null}
          <span>
            {generation.progress.done} of {generation.progress.total} sections
            {period ? ` for ${period.label}` : ""}
            {generation.isRunning ? " — generating…" : " generated."}
          </span>
          {generation.progress.failed.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
              {generation.progress.failed.length} failed
            </span>
          )}
        </div>
      )}

      {/*
        The hero banner is gone, and with it the summary figures it existed to
        display. What it also held was the only way to generate anything, so that
        moved here — next to the period it acts on, rather than inside a banner
        about the page as a whole.

        Nothing is offered once a period is complete: each section keeps its own
        Refresh for the one case that remains, which is wanting a different answer
        to the same question.
      */}
      {missing.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e3e3e3] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#161d2e]">
          <p className="text-[12px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
            {missing.length} of {totalSections} sections have not been generated
            for {period?.label ?? "this period"} yet.
          </p>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => void generateMissing()}
              disabled={generation.isRunning || !periodId}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generation.isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Generate{" "}
                  {missing.length === totalSections ? "insights" : "the rest"}
                </>
              )}
            </button>
          ) : (
            // Said rather than hidden: an admin reading over someone's shoulder
            // should be able to see why there is no button.
            <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              Only the business admin can generate insights.
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-10">
        {/* Everything inside names the period in its own copy — "September 2026"
            rather than "the last 30 days". The festival section below is outside
            on purpose: it is about what is coming, so the rolling wording it
            already had is the correct one for it. */}
        <PeriodLabelProvider
          value={
            period
              ? { label: period.label, previousLabel: period.previous?.label }
              : null
          }
        >
          {/* One boundary per section, so a failure in one cannot blank the rest. */}
          <div className="flex flex-col gap-10">
            <ChartErrorBoundary>
              <CustomerRetentionSection
                items={retention}
                state={retentionSection}
                onDismiss={dismiss}
              />
            </ChartErrorBoundary>
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
              <SalesRecommendationsSection
                items={sales}
                state={salesRecommendations}
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
        </PeriodLabelProvider>

        {/* Last, and outside the period selector: this one is about what is
            coming, not about the period above. */}
        <ChartErrorBoundary>
          <FestivalPrepSection
            items={festivals}
            state={festivalPrep}
            onDismiss={dismiss}
          />
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
