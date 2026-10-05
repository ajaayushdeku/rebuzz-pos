"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchPeriodInsights,
  fetchPeriods,
  generateSection,
  type GenerateMode,
  type PeriodInsights,
  type PeriodKind,
  type StoredSection,
} from "@/services/apiPeriodInsights.client";
import { AiInsightsError } from "@/services/apiAiInsights.client";

/**
 * Reading stored insights for an analytics period.
 *
 * The difference from `useAiSection` is what a page load costs. That one asked
 * the model on first visit and cached the answer for the day; these only ever
 * read what is already stored, so opening the page — or opening it ten times —
 * spends nothing. Generating is a deliberate action with its own mutation.
 *
 * A closed period's figures are final, so the answer about it is too. That is
 * why the freshness settings here are so relaxed: there is no "stale" for a
 * stored answer, only "not generated yet", and that only changes when somebody
 * on this page changes it.
 */

/** Long enough that moving around the app does not re-ask; short enough to notice a new generation. */
const REUSE_MS = 10 * 60 * 1000;

export const periodKeys = {
  list: (kind: PeriodKind) => ["period-insights", "periods", kind] as const,
  insights: (kind: PeriodKind, id: string) =>
    ["period-insights", "period", kind, id] as const,
};

/** The periods on offer, and how much of each is already generated. */
export function usePeriodList(kind: PeriodKind) {
  return useQuery({
    queryKey: periodKeys.list(kind),
    queryFn: () => fetchPeriods(kind),
    staleTime: REUSE_MS,
    refetchOnWindowFocus: false,
    // A deployment with no standalone service answers 503 every time; retrying
    // cannot change that, and the page says so instead.
    retry: false,
  });
}

/**
 * Everything stored for one period.
 *
 * `id` must be a real period id, not `latest`. The service does resolve `latest`,
 * but a page that read under that name and then generated under the resolved one
 * would be writing to a cache entry nobody is reading — the card would not appear
 * until something refetched. So the page waits for the list to name its default,
 * and this stays disabled until it has.
 */
export function usePeriodInsights(kind: PeriodKind, id: string | null) {
  return useQuery({
    queryKey: periodKeys.insights(kind, id ?? "pending"),
    queryFn: () => fetchPeriodInsights(kind, id as string),
    enabled: Boolean(id),
    staleTime: REUSE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Generate — or fetch, or extend — one section.
 *
 * The result is written straight into the period's cached read, so the card
 * appears without a second request. That matters more here than usual: the read
 * it would otherwise refetch is cheap, but the page may have seven of these in
 * flight and refetching after each would be seven extra round trips for data
 * already in hand.
 *
 * The period list is invalidated instead of patched, because what changed there
 * is a count — "3 of 7 generated" — and recomputing it is a smaller job than
 * keeping two caches in step.
 */
export function useGenerateSection(kind: PeriodKind, id: string) {
  const queryClient = useQueryClient();

  return useMutation<
    StoredSection,
    AiInsightsError,
    { section: string; mode?: GenerateMode; exclude?: string[] }
  >({
    mutationFn: ({ section, mode, exclude }) =>
      generateSection({ kind, id, section, mode, exclude }),

    onSuccess: (stored, { section }) => {
      queryClient.setQueryData<PeriodInsights>(
        periodKeys.insights(kind, id),
        (previous) =>
          previous
            ? {
                ...previous,
                sections: { ...previous.sections, [section]: stored },
                missing: previous.missing.filter((name) => name !== section),
              }
            : previous,
      );

      void queryClient.invalidateQueries({ queryKey: periodKeys.list(kind) });
    },

    // No retry. Every attempt can spend the merchant's quota, and the codes that
    // come back — a rate limit, a missing key — are not things a retry fixes.
    retry: false,
  });
}

/** How a run of several sections is going, for a progress line. */
export interface GenerationProgress {
  total: number;
  done: number;
  /** Section names that failed, with the reason the UI should show. */
  failed: { section: string; code: string; message: string }[];
}

/** At most two provider calls at once — free tiers refuse a burst of seven. */
const CONCURRENCY = 2;

/**
 * Generate several sections, two at a time.
 *
 * This is what a "Generate insights for September" button runs. Three things it
 * deliberately does not do:
 *
 *   - **Stop at the first failure.** A section that fails is recorded and the
 *     rest carry on. The alternative throws away provider calls that succeeded.
 *   - **Run them all at once.** Seven parallel calls mostly come back as rate
 *     limits on a free tier, and a limit spent on a burst is a limit not
 *     available to the sections still waiting.
 *   - **Retry.** Each attempt may cost money.
 *
 * Progress is reported as it goes, so the button can say "3 of 7" rather than
 * spinning for a minute with nothing to show.
 */
export function useGeneratePeriod(kind: PeriodKind, id: string) {
  // Destructured rather than used through the mutation object: `mutateAsync` is
  // stable across renders, the object is not, and depending on the object would
  // rebuild `run` on every render.
  const { mutateAsync } = useGenerateSection(kind, id);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  /**
   * Two of the same flag, on purpose.
   *
   * The ref is the guard: it is set before the first await, so two clicks in one
   * tick cannot both start a run. The state is what the button reads, because a
   * ref changing does not re-render — a button watching only the ref would never
   * disable, which is the very thing the guard exists to prevent.
   */
  const running = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(
    async (sections: string[], mode: GenerateMode = "ensure") => {
      // A second click while the first run is going would double every call.
      if (running.current || sections.length === 0) return null;
      running.current = true;
      setIsRunning(true);

      const state: GenerationProgress = {
        total: sections.length,
        done: 0,
        failed: [],
      };
      setProgress({ ...state });

      const queue = [...sections];

      const worker = async () => {
        for (;;) {
          const section = queue.shift();
          if (!section) return;
          try {
            await mutateAsync({ section, mode });
          } catch (error) {
            const failure =
              error instanceof AiInsightsError
                ? { code: error.code, message: error.message }
                : { code: "UNKNOWN", message: "Could not be generated." };
            state.failed.push({ section, ...failure });
          } finally {
            state.done += 1;
            // A new object each time, or React sees the same reference and the
            // count never moves on screen.
            setProgress({ ...state, failed: [...state.failed] });
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, sections.length) }, worker),
      );

      running.current = false;
      setIsRunning(false);
      return state;
    },
    [mutateAsync],
  );

  return {
    run,
    progress,
    isRunning,
    /** Clears the progress line once the result has been read. */
    reset: useCallback(() => setProgress(null), []),
  };
}
