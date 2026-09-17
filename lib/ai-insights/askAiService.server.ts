/**
 * Send a briefing to the BYOK AI service, from a route handler.
 *
 * Shared by the AI Insights page's sections. Each section builds its own
 * briefing, instructions and answer format on the server, then hands them to
 * this; the browser never chooses what the model is asked, so these routes
 * cannot be used as a general Gemini proxy on the merchant's key.
 *
 * A failure comes back as a ready response carrying the service's error code
 * unchanged, so the client's existing error messages and the error panel work
 * for every section without a new vocabulary.
 */

import { NextResponse } from "next/server";

import type { AiInsightsEnvelope } from "@/lib/ai-insights/contract";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export interface AskAiServiceInput {
  token: string;
  briefing: string;
  systemInstruction: string;
  responseSchema: object;
  /** Names the answer for the service's daily cache. */
  cacheKey?: string;
  /** Skip the cache and generate a new answer. Spends a call. */
  refresh?: boolean;
}

export type AskAiServiceResult =
  | { ok: true; data: AiInsightsEnvelope & { cached?: boolean } }
  | { ok: false; response: NextResponse };

export async function askAiService(
  input: AskAiServiceInput,
): Promise<AskAiServiceResult> {
  if (!AI_SERVICE_URL) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI service is not configured on this server" },
        { status: 503 },
      ),
    };
  }

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/api/ai-insights`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        briefing: input.briefing,
        systemInstruction: input.systemInstruction,
        responseSchema: input.responseSchema,
        ...(input.cacheKey ? { cacheKey: input.cacheKey } : {}),
        ...(input.refresh ? { refresh: true } : {}),
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      `[ai-insights] POST ${AI_SERVICE_URL} failed:`,
      (error as Error)?.message,
    );
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AI service is unreachable — is it running?" },
        { status: 503 },
      ),
    };
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const retryAfter = res.headers.get("retry-after");
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: json?.error ?? "Request failed",
          retryAfter: json?.retryAfter ?? undefined,
        },
        {
          status: res.status,
          headers: retryAfter ? { "Retry-After": retryAfter } : undefined,
        },
      ),
    };
  }

  return { ok: true, data: json?.data };
}
