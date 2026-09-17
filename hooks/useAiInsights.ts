"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAiInsights,
  type AiInsightsError,
} from "@/services/apiAiInsights.client";
import type { AiInsightsEnvelope } from "@/lib/ai-insights/contract";

/**
 * How long a generation is reused before another is spent.
 *
 * Every generation is a real Gemini call on the merchant's own quota, and the
 * card lives on the overview page, which is where people land and return to.
 * Fifteen minutes keeps navigation from costing anything while still letting
 * a working day's figures move the story along: at most four automatic calls
 * an hour, well inside the service's limit of twenty, leaving room for the
 * regenerate button.
 */
export const AI_INSIGHTS_REUSE_MS = 15 * 60 * 1000;

/**
 * Insights for a briefing, reused across visits.
 *
 * This was a mutation, fired from an effect on every mount, so that a query's
 * habit of refetching on mount, focus and reconnect could not spend calls
 * unasked. It avoided that, and in doing so kept no memory at all: leaving the
 * overview and coming back unmounted the card, discarded the answer, and paid
 * for a fresh one — every time, even seconds later.
 *
 * A query configured against those habits does both jobs. `staleTime` means a
 * remount inside the window serves the cached answer without a request.
 * Focus and reconnect refetches are switched off explicitly, because the app's
 * client defaults turn focus refetching on. Retries are off: repeating a
 * rate-limited or malformed answer blindly costs more than surfacing it.
 *
 * `scope` names the cache entry. The briefing is deliberately not part of the
 * key: it carries live figures, so every sale would change it and turn "reuse
 * for fifteen minutes" back into "call on every visit after any sale". The
 * latest briefing still goes out whenever a call is made, because the query
 * function is read fresh on each render.
 */
export function useAiInsights(scope: string, briefing: string) {
  return useQuery<AiInsightsEnvelope, AiInsightsError>({
    queryKey: ["ai-insights", scope],
    queryFn: () => fetchAiInsights(briefing),
    staleTime: AI_INSIGHTS_REUSE_MS,
    gcTime: AI_INSIGHTS_REUSE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}
