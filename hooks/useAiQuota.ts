"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * What is left of this business's hourly AI allowance, and what has already
 * been written today.
 *
 * Read from the AI service, which counts both — the hour from its own limiter,
 * the day from the answers it has cached. Nothing here is a guess, and nothing
 * here is the provider's own quota: Gemini publishes no such number, so the
 * meter says only what this app can actually know.
 */

/** One section already written today. */
export interface AiQuotaSection {
  /** "pricing", "slow-items" … */
  section: string;
  model: string | null;
  generatedAt: string | null;
}

export interface AiQuota {
  hour: {
    limit: number;
    used: number;
    remaining: number;
    windowMs: number;
    /**
     * When the next slot frees up, or null when none is spent. The window
     * rolls, so this is the oldest call ageing out — not a clock-hour reset.
     */
    nextSlotAt: string | null;
  };
  today: { date: string; sections: AiQuotaSection[] };
}

export const AI_QUOTA_QUERY = ["ai-quota"];

async function fetchAiQuota(): Promise<AiQuota> {
  const res = await fetch("/api/ai-insights/quota", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not read AI usage");
  const json = await res.json();
  return json?.data;
}

export function useAiQuota() {
  return useQuery<AiQuota>({
    queryKey: AI_QUOTA_QUERY,
    queryFn: fetchAiQuota,
    // A minute is enough for a meter of a 20-per-hour budget: slots free up
    // on the hour they were spent, not second by second. Refetching on focus
    // covers coming back to a tab left open.
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Refresh the meter after something has been generated.
 *
 * Generating is exactly when the numbers change, and waiting up to a minute
 * to show it makes the meter look broken.
 */
export function useRefreshAiQuota() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: AI_QUOTA_QUERY });
}
