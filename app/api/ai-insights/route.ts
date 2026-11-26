import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  AI_INSIGHTS_RESPONSE_SCHEMA,
  AI_SYSTEM_PROMPT,
} from "@/lib/ai-insights/contract";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";
import { getTodayActivitySnapshot } from "@/services/dashboardServices/apiOverview";
import { collectBriefingData } from "@/lib/ai-insights/collectBriefingData.server";
import { buildBriefing } from "@/lib/ai-insights/buildBriefing";

/**
 * Server-side bridge to the BYOK AI service's insights endpoint.
 *
 * Same constraint as the settings bridge: the session token is in an httpOnly
 * cookie, so only a route handler can attach it. The browser posts a briefing,
 * this forwards it.
 *
 * The system instruction and response schema are attached here rather than
 * accepted from the caller. The caller is a browser, and those two values decide
 * what the model is asked to do and what shape it answers in — letting a request
 * body choose them would let it turn this into a general-purpose Gemini proxy
 * billed to the merchant's key. The briefing is free-form by design (it is JSON
 * assembled from the dashboard), so it stays caller-supplied, but it is clamped
 * here as well as at the service.
 */

/** Mirrors MAX_BRIEFING_CHARS in the service; refusing early saves a round trip. */

/** Passes the service's Retry-After through, for any client reading headers. */
function retryAfterHeader(res: Response): HeadersInit | undefined {
  const value = res.headers.get("retry-after");
  return value ? { "Retry-After": value } : undefined;
}

/**
 * The service's rate-limit headers, copied onto our answer.
 *
 * `fetch` gives this route the upstream headers, but the browser only sees the
 * ones we write ourselves — so the quota meter would be blind without this.
 * They ride on every answer, including the cached ones that cost no quota.
 */
const RATE_LIMIT_HEADERS = [
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
] as const;

function rateLimitHeaders(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of RATE_LIMIT_HEADERS) {
    const value = res.headers.get(name);
    if (value) out[name] = value;
  }
  return out;
}
const MAX_BRIEFING_CHARS = 16_000;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-insights/overview");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const { error, raw, retryAfter } = readAiError(json);

      return NextResponse.json(
        { error, raw, retryAfter },
        {
          status: res.status,
          headers: {
            ...rateLimitHeaders(res),
            ...retryAfterHeader(res),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // The cache exists. Now retrieve the latest sales activity.
    // Failure here must not prevent the cached insight from loading.
    let currentActivitySnapshot = null;

    try {
      currentActivitySnapshot = await getTodayActivitySnapshot();
    } catch (error) {
      console.error(
        "[ai-insights] Failed to get current activity snapshot:",
        error,
      );
    }

    return NextResponse.json(
      {
        ...json,
        data: {
          ...json.data,
          activitySnapshot: json.data?.activitySnapshot ?? null,
          currentActivitySnapshot,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...rateLimitHeaders(res),
        },
      },
    );
  } catch (error) {
    console.error("[ai-insights] GET overview failed:", error);

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-insights");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  // Collect dashboard data only when generation is actually requested.
  let briefing: string;

  try {
    const briefingData = await collectBriefingData();
    briefing = buildBriefing(briefingData);

    if (!briefing.trim()) {
      return NextResponse.json({ error: "BRIEFING_REQUIRED" }, { status: 400 });
    }

    if (briefing.length > MAX_BRIEFING_CHARS) {
      return NextResponse.json({ error: "BRIEFING_TOO_LONG" }, { status: 400 });
    }
  } catch (error) {
    console.error("[ai-insights] Failed to collect briefing data:", error);

    return NextResponse.json(
      { error: "SALES_DATA_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const cacheKey = `overview:v1:${today}`;

  // Activity snapshot is useful for the new-sales badge,
  // but failure should not prevent insight generation.
  let activitySnapshot = null;

  try {
    activitySnapshot = await getTodayActivitySnapshot();
  } catch (error) {
    console.error("[ai-insights] Failed to get activity snapshot:", error);
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        briefing,
        systemInstruction: AI_SYSTEM_PROMPT,
        responseSchema: AI_INSIGHTS_RESPONSE_SCHEMA,
        cacheKey,
        refresh: true,
        ...(activitySnapshot ? { activitySnapshot } : {}),
      }),
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};

    console.error(
      `[ai-insights] POST ${url} failed:`,
      (error as Error)?.message,
      "| cause:",
      cause.code ?? cause.message ?? "(none)",
    );

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error, raw, retryAfter } = readAiError(json);

    return NextResponse.json(
      { error, raw, retryAfter },
      {
        status: res.status,
        headers: {
          ...rateLimitHeaders(res),
          ...retryAfterHeader(res),
        },
      },
    );
  }

  return NextResponse.json(json, {
    headers: {
      "Cache-Control": "no-store",
      ...rateLimitHeaders(res),
    },
  });
}
