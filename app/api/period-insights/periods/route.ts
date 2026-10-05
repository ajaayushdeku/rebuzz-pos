import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { periodApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

/**
 * Which analytics periods exist, and which already have insights.
 *
 * A thin proxy, like the settings route: the session token is in an httpOnly
 * cookie, so the browser cannot call the service directly, and this is the only
 * place that can attach it.
 *
 * Deliberately no period arithmetic here. The service owns the calendar — it
 * returns each period's id, label and date range — so there is one definition of
 * "September 2026" rather than one here and one there, drifting over the +05:45
 * offset.
 */
export async function GET(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kind = req.nextUrl.searchParams.get("kind");
  const url = periodApiUrl(
    `/periods${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`,
  );

  if (!url) {
    // The POS API has no period routes, so this is a deployment that cannot do
    // period insights — said plainly rather than forwarded into a 404.
    return NextResponse.json(
      { error: "PERIOD_INSIGHTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // Never cached: which periods have insights changes the moment one is
      // generated, and Next's data cache keys on URL rather than on the token.
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};
    console.error(
      `[period-insights] GET ${url} failed:`,
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
    const { error, detail } = readAiError(json);
    return NextResponse.json({ error, detail }, { status: res.status });
  }

  return NextResponse.json(json);
}
