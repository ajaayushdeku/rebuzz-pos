import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Business-scoped upstream: {API_URL}/{slug}/feedback.
const BASE = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "business";

/**
 * POST /api/feedback — how the app is going, in the merchant's words.
 *
 * Unlike a support question this needs no reply, so nothing identifying is
 * asked for or forwarded. The rating is the only field required: the three
 * written answers are each optional, because a rating alone is still worth
 * having and demanding prose is how feedback forms go unused.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await request.json();

    const { rating, likeMost, improvement, featureRequest } = body ?? {};

    if (!rating || !likeMost?.trim() || !improvement?.trim()) {
      return NextResponse.json(
        {
          status: "fail",
          message:
            "A rating, what works well and what could be better are all needed.",
        },
        { status: 400 },
      );
    }

    const res = await fetch(`${BASE}/${SLUG}/feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, likeMost, improvement, featureRequest }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
