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
      // section: string;
      promptVersion: string;
      suggestionId: string;
    }>;
  },
) {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { kind, id, promptVersion, suggestionId } = await params;

  const url = periodApiUrl(
    `/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/pricing/${encodeURIComponent(promptVersion)}/items/${encodeURIComponent(suggestionId)}/apply`,
  );

  if (!url) {
    return NextResponse.json(
      { error: "PERIOD_INSIGHTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const actionType =
    typeof body.actionType === "string" ? body.actionType.trim() : "";

  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";

  const variantId =
    typeof body.variantId === "string" ? body.variantId.trim() : "";

  const { previousValue, appliedValue } = body;

  if (!["price-updated", "discount-removed"].includes(actionType)) {
    return NextResponse.json(
      { error: "INVALID_PRICING_ACTION" },
      { status: 400 },
    );
  }

  if (!productId) {
    return NextResponse.json({ error: "PRODUCT_ID_REQUIRED" }, { status: 400 });
  }

  if (
    previousValue !== undefined &&
    (typeof previousValue !== "number" || !Number.isFinite(previousValue))
  ) {
    return NextResponse.json(
      { error: "INVALID_PREVIOUS_VALUE" },
      { status: 400 },
    );
  }

  if (
    appliedValue !== undefined &&
    (typeof appliedValue !== "number" || !Number.isFinite(appliedValue))
  ) {
    return NextResponse.json(
      { error: "INVALID_APPLIED_VALUE" },
      { status: 400 },
    );
  }

  if (
    actionType === "price-updated" &&
    (typeof previousValue !== "number" ||
      typeof appliedValue !== "number" ||
      appliedValue <= 0)
  ) {
    return NextResponse.json(
      { error: "INVALID_PRICE_VALUES" },
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
      body: JSON.stringify({
        actionType,
        productId,
        ...(variantId ? { variantId } : {}),
        ...(previousValue !== undefined ? { previousValue } : {}),
        ...(appliedValue !== undefined ? { appliedValue } : {}),
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "[period-insights] PATCH pricing action failed:",
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

  const normalizedData =
    json?.status === "success" && json.data !== undefined ? json.data : json;

  return NextResponse.json(normalizedData, {
    status: res.status,
  });
}
