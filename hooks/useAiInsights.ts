"use client";

import { useMutation } from "@tanstack/react-query";

import {
  fetchAiInsights,
  type AiInsightsError,
} from "@/services/apiAiInsights.client";
import type { AiInsightsEnvelope } from "@/lib/ai-insights/contract";

/**
 * Generate insights for a briefing.
 *
 * A mutation rather than a query, deliberately. React Query's cache is keyed by
 * the request, and a query would want to refetch on mount and on reconnect —
 * every one of those is a real Gemini call spent from the merchant's own quota.
 * The dashboard decides when to spend one; this only carries the request.
 *
 * Retries are off for the same reason: a rate-limited or malformed-answer
 * failure is more expensive to repeat blindly than it is to surface.
 */
export function useAiInsights() {
  return useMutation<AiInsightsEnvelope, AiInsightsError, string>({
    mutationFn: fetchAiInsights,
    retry: false,
  });
}