"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

import {
  fetchAiInsights,
  fetchCachedOverviewInsight,
  type AiInsightsError,
  type CachedOverviewInsight,
} from "@/services/apiAiInsights.client";

import type { AiInsightsEnvelope } from "@/lib/ai-insights/contract";

/**
 * Retrieve today's saved Overview insight.
 *
 * This query never generates an insight. A cache miss is handled by
 * the provider, which decides whether generation should begin.
 */
export function useCachedOverviewInsight() {
  return useQuery<CachedOverviewInsight, AiInsightsError>({
    queryKey: ["ai-insights", "overview-cache"],
    queryFn: fetchCachedOverviewInsight,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/**
 * Generate a fresh Overview insight.
 *
 * Only called after a cache miss or an explicit regeneration request.
 */
export function useGenerateOverviewInsight() {
  return useMutation<AiInsightsEnvelope, AiInsightsError>({
    mutationFn: fetchAiInsights,
  });
}
