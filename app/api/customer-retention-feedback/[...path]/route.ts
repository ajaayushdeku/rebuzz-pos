import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  customerRetentionFeedbackApiUrl,
  readAiError,
} from "@/lib/ai-insights/posAiApi.server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyFeedbackRequest(
  req: NextRequest,
  { params }: RouteContext,
) {
  // 1. Authenticate using the existing POS session cookie.
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  // 2. Build the Express endpoint using the configured POS backend.
  const { path } = await params;

  const endpoint = path.map(encodeURIComponent).join("/");
  const url = customerRetentionFeedbackApiUrl(`/${endpoint}`);

  if (!url) {
    return NextResponse.json(
      { error: "FEEDBACK_SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  // 3. Forward the request to Express.
  let response: Response;

  try {
    const body = req.method === "PUT" ? await req.text() : undefined;

    response = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body } : {}),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "[customer-retention-feedback] Request failed:",
      (error as Error)?.message,
    );

    return NextResponse.json(
      { error: "FEEDBACK_SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  // 4. Read and normalize the backend response.
  const json = await response.json().catch(() => ({}));

  // Handle HTTP errors.
  if (!response.ok) {
    const { error, detail, retryAfter } = readAiError(json);

    return NextResponse.json(
      {
        error,
        ...(detail ? { detail } : {}),
        ...(retryAfter ? { retryAfter } : {}),
      },
      { status: response.status },
    );
  }

  // Handle JSend failures even if the backend returns HTTP 200.
  if (
    json &&
    typeof json === "object" &&
    ("fail" === json.status || "error" === json.status)
  ) {
    const { error, detail, retryAfter } = readAiError(json);

    return NextResponse.json(
      {
        error,
        ...(detail ? { detail } : {}),
        ...(retryAfter ? { retryAfter } : {}),
      },
      { status: 502 },
    );
  }

  // 5. Return the successful backend response.
  return NextResponse.json(json, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest, context: RouteContext) {
  return proxyFeedbackRequest(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return proxyFeedbackRequest(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return proxyFeedbackRequest(req, context);
}
