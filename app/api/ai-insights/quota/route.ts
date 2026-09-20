import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { nepalToday } from "@/lib/nepalDate";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

/**
 * How much of this business's hour is left, and which sections were written
 * today — for the meter on the AI Insights page.
 *
 * The day is the business's own (Nepal), decided here rather than by the AI
 * service, which has no idea what timezone a merchant trades in. Nothing is
 * cached: a meter that lags is worse than none, and Next's data cache keys on
 * URL rather than the Authorization header, so a cached answer could show one
 * business another's usage.
 */
export async function GET() {
  const token = (await cookies()).get("token")?.value;
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
    res = await fetch(
      `${AI_SERVICE_URL}/api/ai-insights/quota?date=${nepalToday()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error(
      `[ai-quota] GET ${AI_SERVICE_URL} failed:`,
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

  return NextResponse.json(json, {
    headers: { "Cache-Control": "no-store" },
  });
}
