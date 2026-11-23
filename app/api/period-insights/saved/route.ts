import { NextRequest, NextResponse } from "next/server";

import { aiApiUrl } from "@/lib/ai-insights/posAiApi.server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const url = aiApiUrl("/period-insights/saved");

    if (!url) {
      return NextResponse.json(
        { error: "AI_SERVICE_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = searchParams ? `${url}?${searchParams}` : url;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("[Period Insights] Saved insights proxy error:", error);

    return NextResponse.json(
      { error: "AI_SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
