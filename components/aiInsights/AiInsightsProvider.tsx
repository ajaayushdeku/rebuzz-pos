"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
 * Auto-runs once on mount, deliberately not on refetch/reconnect: this is a
 * mutation rather than a query for exactly that reason (see useAiInsights).
 * The ref guard keeps React 18 StrictMode's double-mounted effects from
 * spending a second real call in development.
 */
export function AiInsightsProvider({
  briefingData,
  children,
}: {
  briefingData: BriefingData;
  children: ReactNode;
}) {
  const mutation = useAiInsights();
  // The briefing is assembled on the client so the payload stays inspectable
  // in devtools, and so the debug console output (gated by the ai-insights-debug
  // localStorage flag) is visible where you are looking for it.
  const briefing = useMemo(() => buildBriefing(briefingData), [briefingData]);
  const started = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutation.mutate(briefing);
    // Runs once per mount, plus on explicit regenerate() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefing, tick]);

  const regenerate = () => {
    started.current = true;
    setTick((t) => t + 1);
    mutation.mutate(briefing);
  };

  const state: AiInsightsState = {
    briefingData,
    status: mutation.isPending
      ? "loading"
      : mutation.isError
        ? "error"
        : "success",
    // The envelope types insights as `Response | string` because the service
    // can technically receive raw prose; the route always sends the schema,
    // and the client already guards that case, so narrow to the object here.
    data:
      mutation.data && typeof mutation.data.insights !== "string"
        ? mutation.data.insights
        : undefined,
    error: mutation.error ?? undefined,
    model: mutation.data?.model,
    generatedAt: mutation.data?.generatedAt,
    regenerate,
  };

  return (
    <AiInsightsContext.Provider value={state}>
      {children}
    </AiInsightsContext.Provider>
  );
}
