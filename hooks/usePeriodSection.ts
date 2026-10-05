"use client";

import { useCallback, useMemo } from "react";

import type { AiSectionState } from "@/hooks/useAiSection";
import { useGenerateSection } from "@/hooks/usePeriodInsights";
import type {
  AiSectionResult,
  SalesWindows,
} from "@/lib/ai-insights/sections/shared";
import type {
  PeriodKind,
  StoredSection,
} from "@/services/apiPeriodInsights.client";

/**
 * A stored period insight, in the shape the section components already read.
 *
 * The eight section components take an `AiSectionState` — data, error, refresh,
 * generate-more and the loading flags — and know nothing about where it came
 * from. So rather than rewrite seven of them for periods, this presents the
 * stored answer in the same shape.
 *
 * It is not a pretence. The meanings line up, with one exception worth knowing:
 *
 *   `refresh`     regenerates the stored answer, replacing it
 *   `reload`      asks for the answer, generating only if nothing is stored
 *   `isLoading`   the period's read is still in flight
 *   `cached`      always true — a stored answer is, by definition
 *
 * What is gone is the day-scoped idea of a *stale* answer: an insight about a
 * finished period cannot go out of date, so `stale` is never set. Where a card
 * used to say "from an earlier model because today's failed", a period card
 * either exists or does not.
 */
export function usePeriodSection<T>(options: {
  kind: PeriodKind;
  periodId: string;
  section: string;
  /** The stored answer, or undefined when this section has never been generated. */
  stored: StoredSection | undefined;
  /** The period read, so a section can show the page's own loading state. */
  isPeriodLoading: boolean;
  /** Whether this section offers further batches at all. */
  supportsMore?: boolean;
  /** How the model should describe a card it must not repeat. */
  describe?: (item: T) => string;
}): AiSectionState<T> {
  const {
    kind,
    periodId,
    section,
    stored,
    isPeriodLoading,
    supportsMore = false,
    describe,
  } = options;

  const generate = useGenerateSection(kind, periodId);
  const pendingMode = generate.variables?.mode;
  const isThisSection = generate.variables?.section === section;

  /**
   * Memoised because `reload` closes over it: rebuilt every render, it would make
   * every callback here a new function and defeat the memoisation entirely.
   */
  const data: AiSectionResult<T> | undefined = useMemo(
    () =>
      stored
        ? {
            items: (stored.items ?? []) as T[],
            // `windows` rides along in the stored answer's extras; a stored insight
            // from before that was recorded simply has none.
            windows: (stored as unknown as { windows?: SalesWindows })
              .windows ?? {
              current: { startDate: "", endDate: "" },
              previous: { startDate: "", endDate: "" },
            },
            reason: stored.reason as AiSectionResult<T>["reason"],
            model: stored.model ?? undefined,
            generatedAt: stored.generatedAt ?? undefined,
            // A stored answer always was: nothing was spent showing it.
            cached: true,
            moreBatches: stored.batches,
            noMore: stored.noMore,
          }
        : undefined,
    [stored],
  );

  const refresh = useCallback(() => {
    // The mutation's own guard stops a second click; this stops a click landing
    // while the first request is still being set up.
    if (generate.isPending) return;
    generate.mutate({ section, mode: "regenerate" });
  }, [generate, section]);

  const reload = useCallback(async () => {
    try {
      await generate.mutateAsync({ section, mode: "ensure" });
      return { isError: false, data };
    } catch {
      // The error is already on the mutation, and on screen through `error`.
      return { isError: true, data };
    }
  }, [generate, section, data]);

  const generateMore = useCallback(() => {
    if (generate.isPending || !stored) return;
    generate.mutate({
      section,
      mode: "more",
      // What is on screen already, in the words the model will read.
      exclude: describe
        ? ((stored.items ?? []) as T[]).map(describe).filter(Boolean)
        : [],
    });
  }, [generate, section, stored, describe]);

  return {
    data,
    canGenerateMore: Boolean(
      supportsMore &&
      stored &&
      !stored.reason &&
      (stored.items?.length ?? 0) > 0 &&
      !stored.noMore,
    ),
    generateMore,
    isGeneratingMore: isThisSection && pendingMode === "more",
    error: generate.error ?? undefined,
    // Loading means the page is still fetching what exists, not that a model is
    // thinking: a generation shows as `isFetching` instead, so a card does not
    // flash its skeleton over cards already on screen.
    isLoading: isPeriodLoading && !stored,
    isError: Boolean(generate.error) && !stored,
    retry: () => void reload(),
    reload,
    isFetching: isPeriodLoading || (isThisSection && generate.isPending),
    refresh,
    isRefreshing: isThisSection && pendingMode === "regenerate",
  };
}
