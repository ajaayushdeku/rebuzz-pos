import { NextRequest, NextResponse } from "next/server";
import { aiApiUrl } from "@/lib/ai-insights/posAiApi.server";

type RouteContext = {
  params: Promise<{
    date: string;
    promptVersion: string;
    recommendationId: string;
  }>;
};

// Retrieve a Festival Prep recommendation's completion status.
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    }

    const { date, promptVersion, recommendationId } = await params;

    const url = aiApiUrl(
      `/festival-prep-actions/${encodeURIComponent(date)}/${encodeURIComponent(promptVersion)}/${encodeURIComponent(recommendationId)}`,
    );

    if (!url) {
      return NextResponse.json(
        { error: "SERVER_CONFIGURATION_ERROR" },
        { status: 500 },
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
