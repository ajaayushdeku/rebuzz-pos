import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

/**
 * What is left of this business's hourly insight allowance.
 *
 * Same bridge as the insights route, and for the same reason: the session
 * token is in an httpOnly cookie, so only a route handler can attach it.
 *
 * Read-only — asking does not spend from the allowance, which is the point.
 * The insights route reports the same numbers in its headers, but only while
 * something is being generated; the settings screen needs them before that.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-insights/quota");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
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
    console.error(
      `[ai-insights/quota] GET ${url} failed:`,
      (error as Error)?.message,
    );
    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error } = readAiError(json);
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } });
}
