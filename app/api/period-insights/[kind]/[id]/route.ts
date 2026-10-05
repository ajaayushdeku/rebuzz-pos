import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { periodApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

/**
 * Every insight stored for one period — the AI Insights page's whole read.
 *
 * No AI call and no spend, whoever is asking: this returns what has already been
 * generated. `id` may be `latest`, which the service resolves to the most recent
 * completed period, so the browser never has to work out which month that is.
 *
 * Generation is a separate route, because it is a separate decision: it costs the
 * merchant money and only an admin may do it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { kind, id } = await params;
  const url = periodApiUrl(
    `/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`,
  );

  if (!url) {
    return NextResponse.json(
      { error: "PERIOD_INSIGHTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

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
