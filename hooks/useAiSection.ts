"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  fetchAiSection,
  type AiInsightsError,
  type AiSectionName,
} from "@/services/apiAiInsights.client";
import {
  MAX_MORE_BATCHES,
  type AiSectionResult,
} from "@/lib/ai-insights/sections/shared";

/**
 * How long the page reuses its copy before asking the server again.
 *
 * Asking again is cheap either way: the server answers from the AI service's
 * daily cache. This only saves the POS report requests each route makes to
 * work out its facts, when someone moves between pages.
 */
const REUSE_MS = 30 * 60 * 1000;

/**
 * One AI Insights section, reused for the day.
 *
 * Loading the page never spends more than one AI call a day per section: the
 * first visit generates, and every later visit — this tab, another tab, after
 * a reload — is served from the cache. Focus and reconnect refetches are off,
 * and so are retries, for the same reasons as the overview's insights.
 *
 * `refresh` is the one deliberate spend. It keeps the current answer on screen
 * while the new one is written, and if it fails the answer stays and a toast
 * says why — a failed refresh should not wipe advice that was fine.
 *
 * `generateMore` is the other, for sections that pass `describe`: it asks for
 * a further batch of cards, telling the model what is already shown (each
 * card as `describe` puts it), and adds the new cards after the current ones.
 * A Refresh replaces all of them, extra batches included.
 */
export function useAiSection<T>(
  section: AiSectionName,
  options: {
    /** A card as the model should read it in "already shown". */
    describe?: (item: T) => string;
  } = {},
) {
  const { describe } = options;
  const queryClient = useQueryClient();
  const queryKey = ["ai-insights", "section", section];
  // Set the moment a refresh starts, not on the next render. `isPending` only
  // changes after React re-renders, so clicks that land before that — a fast
  // double-click, a stuck key — each read "not running" and each paid for an
  // answer. Checked in a test: three clicks in one tick made three calls.
  // One flag for both paid actions, so a Refresh and a "Generate more" cannot
  // run at once and race to write the section.
  const refreshing = useRef(false);

  const query = useQuery<AiSectionResult<T>, AiInsightsError>({
    queryKey,
    queryFn: async () => {
      const next = await fetchAiSection<T>(section, false);
      // Asking again ("Try again", the page's "Generate insights") returns
      // the same saved answer. Extra batches added to it stay on screen; only
      // a different answer — a Refresh, a new day — replaces them.
      const prev = queryClient.getQueryData<AiSectionResult<T>>(queryKey);
      if (!prev?.moreBatches || prev.generatedAt !== next.generatedAt) {
        return next;
      }
      const ids = new Set(next.items.map((i) => (i as { id?: string }).id));
      return {
        ...next,
        items: [
          ...next.items,
          ...prev.items.filter((i) => !ids.has((i as { id?: string }).id)),
        ],
        moreBatches: prev.moreBatches,
        noMore: prev.noMore,
      };
    },
    staleTime: REUSE_MS,
    gcTime: REUSE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const refresh = useMutation<AiSectionResult<T>, AiInsightsError>({
    mutationFn: () => fetchAiSection<T>(section, true),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const more = useMutation<
    AiSectionResult<T>,
    AiInsightsError,
    { batch: number; after: string; exclude: string[] }
  >({
    mutationFn: (request) => fetchAiSection<T>(section, false, request),
  });

  const data = query.data;
  const canGenerateMore = Boolean(
    describe &&
    data &&
    !data.reason &&
    data.items.length > 0 &&
    data.generatedAt &&
    !data.noMore &&
    (data.moreBatches ?? 0) < MAX_MORE_BATCHES,
  );

  const generateMore = () => {
    if (!canGenerateMore || !data?.generatedAt || !describe) return;
    if (refreshing.current) return;
    refreshing.current = true;

    const extends_ = data.generatedAt;
    const batch = (data.moreBatches ?? 0) + 1;
    more.mutate(
      { batch, after: extends_, exclude: data.items.map(describe) },
      {
        onSuccess: (next) => {
          let added = 0;
          queryClient.setQueryData<AiSectionResult<T>>(queryKey, (prev) => {
            // Refreshed while this was running: these cards extend an answer
            // that is no longer on screen.
            if (!prev || prev.generatedAt !== extends_) return prev;
            const ids = new Set(
              prev.items.map((item) => (item as { id?: string }).id),
            );
            const fresh = next.items.filter(
              (item) => !ids.has((item as { id?: string }).id),
            );
            added = fresh.length;
            return {
              ...prev,
              items: [...prev.items, ...fresh],
              moreBatches: batch,
              // Nothing new is the model running out of ideas; asking again
              // would pay for the same answer.
              noMore: fresh.length === 0 || batch >= MAX_MORE_BATCHES,
            };
          });
          if (added === 0) toast("The AI has no new ones to add right now.");
        },
        onError: (error) => {
          toast.error(error.message);
        },
        onSettled: () => {
          refreshing.current = false;
        },
      },
    );
  };

  return {
    data: query.data,
    /** A further batch of cards can be asked for. */
    canGenerateMore,
    generateMore,
    isGeneratingMore: more.isPending,
    error: query.error ?? undefined,
    isLoading: query.isPending,
    /** First load failed; there is nothing on screen to keep. */
    isError: query.isError && !query.data,
    retry: () => void query.refetch({ cancelRefetch: false }),
    /**
     * Ask the server again, the same request "Try again" makes, and report how
     * it went. Never `refresh`: the server answers from today's saved answer
     * when there is one, so this only spends a call for a section that has
     * none yet. `cancelRefetch: false` joins a request already running rather
     * than starting a second.
     */
    reload: () => query.refetch({ cancelRefetch: false }),
    /** Any request for this section is running, first load included. */
    isFetching: query.isFetching,
    refresh: () => {
      // A second click while one is running would pay for a second answer.
      if (refreshing.current) return;
      refreshing.current = true;
      refresh.mutate(undefined, {
        onSettled: () => {
          refreshing.current = false;
        },
      });
    },
    isRefreshing: refresh.isPending,
  };
}

export type AiSectionState<T> = ReturnType<typeof useAiSection<T>>;
