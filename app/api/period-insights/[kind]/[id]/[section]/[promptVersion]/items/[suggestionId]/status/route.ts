import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { periodApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      kind: string;
      id: string;
      section: string;
      promptVersion: string;
      suggestionId: string;
    }>;
  },
) {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { kind, id, section, promptVersion, suggestionId } = await params;

  const url = periodApiUrl(
    `/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/${encodeURIComponent(section)}/${encodeURIComponent(promptVersion)}/items/${encodeURIComponent(suggestionId)}/status`,
  );

  if (!url) {
    return NextResponse.json(
      { error: "PERIOD_INSIGHTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";
  const addonId = typeof body.addonId === "string" ? body.addonId.trim() : "";

  // Exactly one association must be provided.
  if (Boolean(productId) === Boolean(addonId)) {
    return NextResponse.json(
      { error: "PRODUCT_OR_ADDON_REQUIRED" },
      { status: 400 },
    );
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productId ? { productId } : { addonId }),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      `[period-insights] PATCH status failed:`,
      (error as Error)?.message,
    );

    return NextResponse.json(
      { error: "AI service is unreachable — is it running?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const { error, detail, retryAfter } = readAiError(json);

    return NextResponse.json(
      { error, detail, retryAfter },
      { status: res.status },
    );
  }

  // return NextResponse.json(json);

  const normalizedData =
    json?.status === "success" && json.data !== undefined ? json.data : json;

  return NextResponse.json(normalizedData, {
    status: res.status,
  });
}
