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
    `/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/slow-items/${encodeURIComponent(promptVersion)}/items/${encodeURIComponent(suggestionId)}/complete`,
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

  const discountId =
    typeof body.discountId === "string" ? body.discountId.trim() : "";

  const offerId = typeof body.offerId === "string" ? body.offerId.trim() : "";

  if (!["discount-applied", "freebie-created"].includes(actionType)) {
    return NextResponse.json(
      { error: "INVALID_SLOW_ITEM_ACTION" },
      { status: 400 },
    );
  }

  if (!productId) {
    return NextResponse.json({ error: "PRODUCT_ID_REQUIRED" }, { status: 400 });
  }

  if (actionType === "discount-applied" && !discountId) {
    return NextResponse.json(
      { error: "DISCOUNT_ID_REQUIRED" },
      { status: 400 },
    );
  }

  if (actionType === "freebie-created" && !offerId) {
    return NextResponse.json({ error: "OFFER_ID_REQUIRED" }, { status: 400 });
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
        ...(actionType === "discount-applied" ? { discountId } : {}),
        ...(actionType === "freebie-created" ? { offerId } : {}),
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "[period-insights] PATCH slow-item completion failed:",
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
