import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  AI_INSIGHTS_RESPONSE_SCHEMA,
  AI_SYSTEM_PROMPT,
} from "@/lib/ai-insights/contract";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

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
const MAX_BRIEFING_CHARS = 16_000;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  if (!AI_SERVICE_URL) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const briefing =
    typeof body?.briefing === "string" ? body.briefing.trim() : "";

  if (!briefing) {
    return NextResponse.json({ error: "BRIEFING_REQUIRED" }, { status: 400 });
  }
  if (briefing.length > MAX_BRIEFING_CHARS) {
    return NextResponse.json({ error: "BRIEFING_TOO_LONG" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/api/ai-insights`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        briefing,
        systemInstruction: AI_SYSTEM_PROMPT,
        responseSchema: AI_INSIGHTS_RESPONSE_SCHEMA,
      }),
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};
    console.error(
      `[ai-insights] POST ${AI_SERVICE_URL} failed:`,
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
    // Codes pass through intact: NOT_CONFIGURED and AI_DISABLED are 424s the UI
    // answers by pointing at the settings screen, the rest are 502s naming an
    // upstream failure. Collapsing them would lose the only actionable part.
    return NextResponse.json(
      {
        error: json?.error ?? "Request failed",
        raw: json?.raw ?? undefined,
        // Forwarded on a 429. The service sends the wait in the body, and the
        // client turns it into "try again in N s" — but only if it arrives.
        // Rebuilding the body without it made that sentence unreachable.
        retryAfter: json?.retryAfter ?? undefined,
      },
      {
        status: res.status,
        headers: retryAfterHeader(res),
      },
    );
  }

  return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } });
}
