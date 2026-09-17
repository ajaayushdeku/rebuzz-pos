"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { useAiInsights } from "@/hooks/useAiInsights";
import { buildBriefing } from "@/lib/ai-insights/buildBriefing";
import type {
  AiInsightsResponse,
  BriefingData,
} from "@/lib/ai-insights/contract";
import type { AiInsightsError } from "@/services/apiAiInsights.client";

type AiInsightsState = {
  /** The dashboard data this generation was based on (rendered as fallback). */
  briefingData: BriefingData;
  status: "loading" | "success" | "error";
  /** Undefined until the first successful generation. */
  data?: AiInsightsResponse;
  error?: AiInsightsError;
  model?: string;
  generatedAt?: string;
  /** Run another generation. Costs the merchant's quota — call on purpose. */
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

/**
 * Generates the insights once and shares them with every card below it.
 *
 * One generation, not one per card: each call is a real Gemini request spent
 * from the merchant's own quota, and the story and the insights card describe
 * the same business — asking the model twice would double the spend and could
 * make the two cards disagree.
 *
 * A generation is reused for a while rather than made on every mount; the
 * window and the reasoning live in `useAiInsights`. React Query also
 * de-duplicates the request, so StrictMode's double-mounted effects in
 * development cannot spend a second call — the job the ref guard used to do.
 */
export function AiInsightsProvider({
  briefingData,
  children,
}: {
  briefingData: BriefingData;
  children: ReactNode;
}) {
  // The briefing is assembled on the client so the payload stays inspectable
  // in devtools, and so the debug console output (gated by the ai-insights-debug
  // localStorage flag) is visible where you are looking for it.
  const briefing = useMemo(() => buildBriefing(briefingData), [briefingData]);
  const query = useAiInsights("overview", briefing);

  // An explicit request, so it bypasses the reuse window. `cancelRefetch: false`
  // makes a second click while one is running join that call instead of
  // cancelling it: cancelling only stops the browser waiting, and Gemini would
  // still bill the abandoned request.
  const regenerate = () => {
    void query.refetch({ cancelRefetch: false });
  };

  const state: AiInsightsState = {
    briefingData,
    // Loading until there is something to show. The old mapping reported
    // "success" for the idle moment before the first request went out, so
    // both cards briefly rendered their empty state — "No insights for this
    // period yet" — on every visit, before switching to a spinner.
    status: query.isFetching
      ? "loading"
      : query.isError
        ? "error"
        : query.data
          ? "success"
          : "loading",
    // The envelope types insights as `Response | string` because the service
    // can technically receive raw prose; the route always sends the schema,
    // and the client already guards that case, so narrow to the object here.
    data:
      query.data && typeof query.data.insights !== "string"
        ? query.data.insights
        : undefined,
    error: query.error ?? undefined,
    model: query.data?.model,
    generatedAt: query.data?.generatedAt,
    regenerate,
  };

  return (
    <AiInsightsContext.Provider value={state}>
      {children}
    </AiInsightsContext.Provider>
  );
}
