import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { periodApiUrl, readAiError } from "@/lib/ai-insights/posAiApi.server";

export async function PATCH(
  _req: Request,
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
    `/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/pricing/${encodeURIComponent(promptVersion)}/items/${encodeURIComponent(suggestionId)}/dismiss`,
  );

  if (!url) {
    return NextResponse.json(
      { error: "PERIOD_INSIGHTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "[period-insights] PATCH pricing dismiss failed:",
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

  return NextResponse.json(json);
}
