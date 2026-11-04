import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-design/settings/verify");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);

  const accountId =
    typeof body?.accountId === "string" ? body.accountId.trim() : "";

  const apiToken =
    typeof body?.apiToken === "string" ? body.apiToken.trim() : "";

  // Both credentials must be provided together.
  // If neither is provided, the backend verifies saved credentials.
  if (Boolean(accountId) !== Boolean(apiToken)) {
    return NextResponse.json(
      { error: "CLOUDFLARE_CREDENTIALS_REQUIRED" },
      { status: 400 },
    );
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        accountId && apiToken ? { accountId, apiToken } : {},
      ),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[ai-design-settings] Verification request failed:", error);

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error, detail, retryAfter, requestId } = readAiError(json);

    return NextResponse.json(
      { error, detail, retryAfter, requestId },
      { status: res.status },
    );
  }

  return NextResponse.json(json);
}
