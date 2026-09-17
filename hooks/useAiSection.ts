"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  fetchAiSection,
  type AiInsightsError,
  type AiSectionName,
} from "@/services/apiAiInsights.client";
import type { AiSectionResult } from "@/lib/ai-insights/sections/shared";

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
 */
export function useAiSection<T>(section: AiSectionName) {
  const queryClient = useQueryClient();
  const queryKey = ["ai-insights", "section", section];
  // Set the moment a refresh starts, not on the next render. `isPending` only
  // changes after React re-renders, so clicks that land before that — a fast
  // double-click, a stuck key — each read "not running" and each paid for an
  // answer. Checked in a test: three clicks in one tick made three calls.
  const refreshing = useRef(false);

  const query = useQuery<AiSectionResult<T>, AiInsightsError>({
    queryKey,
    queryFn: () => fetchAiSection<T>(section, false),
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

  return {
    data: query.data,
    error: query.error ?? undefined,
    isLoading: query.isPending,
    /** First load failed; there is nothing on screen to keep. */
    isError: query.isError && !query.data,
    retry: () => void query.refetch({ cancelRefetch: false }),
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
