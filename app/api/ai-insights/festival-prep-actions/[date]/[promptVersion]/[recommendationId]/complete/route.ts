import { NextRequest, NextResponse } from "next/server";
import { aiApiUrl } from "@/lib/ai-insights/posAiApi.server";

type RouteContext = {
  params: Promise<{
    date: string;
    promptVersion: string;
    recommendationId: string;
  }>;
};

// Persist a successfully created offer against a recommendation.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { date, promptVersion, recommendationId } = await params;
    const body = await request.json();

    const url = aiApiUrl(
      `/festival-prep-actions/${encodeURIComponent(date)}/${encodeURIComponent(promptVersion)}/${encodeURIComponent(recommendationId)}/complete`,
    );

    if (!url) {
      return NextResponse.json(
        { error: "SERVER_CONFIGURATION_ERROR" },
        { status: 500 },
      );
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({
      error: "INVALID_SERVER_RESPONSE",
    }));

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: "FESTIVAL_PREP_REQUEST_FAILED" },
      { status: 500 },
    );
  }
}
