"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCachedOverviewInsight,
  useGenerateOverviewInsight,
} from "@/hooks/useAiInsights";

import type { AiInsightsResponse } from "@/lib/ai-insights/contract";

import type {
  AiInsightsError,
  OverviewActivitySnapshot,
} from "@/services/apiAiInsights.client";

type AiInsightsState = {
  status: "loading" | "success" | "error";
  data?: AiInsightsResponse;
  error?: AiInsightsError;
  model?: string;
  generatedAt?: string;
  newSalesCount: number;
  regenerate: () => void;
};

const AiInsightsContext = createContext<AiInsightsState | null>(null);

export function useAiInsightsResult(): AiInsightsState {
  const ctx = useContext(AiInsightsContext);

  if (!ctx) {
    throw new Error(
      "useAiInsightsResult must be used inside <AiInsightsProvider>",
    );
  }

  return ctx;
}

export function AiInsightsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const cacheQuery = useCachedOverviewInsight();
  const generateMutation = useGenerateOverviewInsight();

  // Prevent duplicate automatic generation during React StrictMode effect replay.
  const autoGenerationStarted = useRef(false);

  const cacheMiss =
    cacheQuery.isError && cacheQuery.error.code === "OVERVIEW_CACHE_MISS";

  // Generate automatically only when the server confirms today's cache is missing.
  useEffect(() => {
    if (
      cacheMiss &&
      !autoGenerationStarted.current &&
      !generateMutation.isPending
    ) {
      autoGenerationStarted.current = true;
      generateMutation.mutate();
    }
  }, [cacheMiss, generateMutation.isPending, generateMutation.mutate]);

  const regenerate = () => {
    if (generateMutation.isPending) return;

    autoGenerationStarted.current = true;
    generateMutation.mutate();
  };

  // Once generation succeeds, refresh the cached response to retrieve
  // its saved activity snapshot and the latest sales snapshot.
  useEffect(() => {
    if (generateMutation.isSuccess) {
      void queryClient.invalidateQueries({
        queryKey: ["ai-insights", "overview-cache"],
      });
    }
  }, [generateMutation.isSuccess, queryClient]);

  const cachedData = cacheQuery.data;

  const data =
    generateMutation.data?.insights &&
    typeof generateMutation.data.insights !== "string"
      ? generateMutation.data.insights
      : cachedData?.insights;

  const activitySnapshot: OverviewActivitySnapshot | null =
    cachedData?.activitySnapshot ?? null;

  const currentActivitySnapshot: OverviewActivitySnapshot | null =
    cachedData?.currentActivitySnapshot ?? null;

  const newSalesCount =
    activitySnapshot && currentActivitySnapshot
      ? Math.max(
          0,
          currentActivitySnapshot.salesCount - activitySnapshot.salesCount,
        )
      : 0;

  const isGenerating = generateMutation.isPending;

  const error =
    generateMutation.error ??
    (cacheMiss ? undefined : (cacheQuery.error ?? undefined));

  const status: AiInsightsState["status"] =
    isGenerating || (cacheQuery.isPending && !cachedData)
      ? "loading"
      : error
        ? "error"
        : data
          ? "success"
          : "loading";

  const state: AiInsightsState = {
    status,
    data,
    error,
    model: generateMutation.data?.model ?? cachedData?.model,
    generatedAt: generateMutation.data?.generatedAt ?? cachedData?.generatedAt,
    newSalesCount,
    regenerate,
  };

  return (
    <AiInsightsContext.Provider value={state}>
      {children}
    </AiInsightsContext.Provider>
  );
}
