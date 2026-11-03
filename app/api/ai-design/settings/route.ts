import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

async function forward(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-design/settings");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};

    console.error(
      `[ai-design-settings] ${method} ${url} failed:`,
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
    const { error, available, detail, retryAfter, requestId } =
      readAiError(json);

    return NextResponse.json(
      { error, available, detail, retryAfter, requestId },
      { status: res.status },
    );
  }

  return NextResponse.json(json);
}

export async function GET() {
  return forward("GET");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

  if (!apiKey) {
    return NextResponse.json({ error: "API_KEY_REQUIRED" }, { status: 400 });
  }

  return forward("POST", { apiKey });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "INVALID_SETTINGS" }, { status: 400 });
  }

  return forward("PATCH", {
    enabled: body.enabled,
  });
}

export async function DELETE() {
  return forward("DELETE");
}
