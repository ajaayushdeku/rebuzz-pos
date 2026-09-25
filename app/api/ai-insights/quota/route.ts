import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

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

  if (!AI_SERVICE_URL) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${AI_SERVICE_URL}/api/ai-insights/quota`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      `[ai-insights/quota] GET ${AI_SERVICE_URL} failed:`,
      (error as Error)?.message,
    );
    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: json?.error ?? "Request failed" },
      { status: res.status },
    );
  }

  return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } });
}
