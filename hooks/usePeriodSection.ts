"use client";

import { useCallback, useEffect, useMemo } from "react";

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

export function usePeriodSection<T>(options: {
  kind: PeriodKind;
  periodId: string;
  section: string;
  stored: StoredSection | undefined;
  isPeriodLoading: boolean;
  supportsMore?: boolean;
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

  // Clear mutation state when switching periods or sections.
  // This prevents an old generation error from leaking into another period.
  const resetGeneration = generate.reset;

  useEffect(() => {
    resetGeneration();
  }, [kind, periodId, section, resetGeneration]);

  /**
   * Only treat mutation variables as active while a request is pending.
   */
  const pending = generate.isPending ? generate.variables : undefined;
  const pendingMode = pending?.mode;
  const isThisSection = pending?.section === section;

  const data: AiSectionResult<T> | undefined = useMemo(
    () =>
      stored
        ? {
            items: (stored.items ?? []) as T[],
            windows: (stored as unknown as { windows?: SalesWindows })
              .windows ?? {
              current: { startDate: "", endDate: "" },
              previous: { startDate: "", endDate: "" },
            },
            reason: stored.reason as AiSectionResult<T>["reason"],
            model: stored.model ?? undefined,
            generatedAt: stored.generatedAt ?? undefined,
            cached: true,
            moreBatches: stored.batches,
            noMore: stored.noMore,
          }
        : undefined,
    [stored],
  );

  const refresh = useCallback(() => {
    if (generate.isPending) return;
    generate.mutate({ section, mode: "regenerate" });
  }, [generate, section]);

  const reload = useCallback(async () => {
    try {
      await generate.mutateAsync({ section, mode: "ensure" });
      return { isError: false, data };
    } catch {
      return { isError: true, data };
    }
  }, [generate, section, data]);

  const generateMore = useCallback(() => {
    if (generate.isPending || !stored) return;

    generate.mutate({
      section,
      mode: "more",
      exclude: describe
        ? ((stored.items ?? []) as T[]).map(describe).filter(Boolean)
        : [],
    });
  }, [generate, section, stored, describe]);

  // Only expose an error when the currently selected section has no stored data.
  const currentError = stored ? undefined : (generate.error ?? undefined);

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
    error: currentError,
    isLoading: isPeriodLoading && !stored,
    isError: Boolean(generate.error) && !stored,

    retry: () => void reload(),
    reload,
    isFetching: isPeriodLoading || isThisSection,
    refresh,
    isRefreshing: isThisSection && pendingMode === "regenerate",
  };
}
