import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

/**
 * Bridge for GET /api/settings/ai/models.
 *
 * Same trust chain as the settings route: the session token lives in an
 * httpOnly cookie, so only this route can attach it and reach the AI service.
 * The service fetches the model list from the provider using the business's
 * stored key and answers 404 NOT_CONFIGURED when none is saved, which is what
 * the settings UI uses to decide whether to show the model selector at all.
 * `?provider=` asks about one the business has a key for but is not using yet,
 * so the form can show its models before the switch.
 *
 * Nothing is cached — the model list is a live call to the provider against
 * the merchant's key, and Next's data cache keys on URL rather than the
 * Authorization header, so a cached response could leak across businesses.
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only the name travels on: the service decides whether it knows it.
  const provider = req.nextUrl.searchParams.get("provider")?.trim();
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";

  const base = aiApiUrl("/settings/ai/models");

  if (!base) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  const url = `${base}${query}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};
    console.error(
      `[ai-models] GET ${url} failed:`,
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
    // `retryAfter` is forwarded on a 429: the client turns it into "try again
    // in N s", and rebuilding the body without it made that unreachable.
    const { error, retryAfter } = readAiError(json);
    return NextResponse.json({ error, retryAfter }, { status: res.status });
  }

  return NextResponse.json(json);
}
