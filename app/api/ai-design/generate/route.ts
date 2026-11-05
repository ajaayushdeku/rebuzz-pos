import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { aiApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = aiApiUrl("/ai-design/generate");

  if (!url) {
    return NextResponse.json(
      { error: "AI service is not configured on this server" },
      { status: 503 },
    );
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const prompt = formData.get("prompt");

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "PROMPT_REQUIRED" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do not set Content-Type manually.
        // fetch automatically adds the multipart boundary.
      },
      body: formData,
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const {
        error,
        available,
        detail,
        retryAfter,
        requestId,
        providerCode,
      } = readAiError(json);

      return NextResponse.json(
        { error, available, detail, retryAfter, requestId, providerCode },
        { status: res.status },
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    const cause =
      (error as { cause?: { code?: string; message?: string } })?.cause ?? {};

    console.error(
      `[ai-design-generate] POST ${url} failed:`,
      (error as Error)?.message,
      "| cause:",
      cause.code ?? cause.message ?? "(none)",
    );

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }
}
