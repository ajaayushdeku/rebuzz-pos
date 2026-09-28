import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Business-scoped upstream: {API_URL}/{slug}/support-question.
const BASE = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "business";

/**
 * POST /api/support-question — a question for support.
 *
 * The browser posts here rather than upstream so the session token stays in
 * the cookie and never reaches client code.
 *
 * Fields are whitelisted rather than forwarded wholesale: the upstream takes
 * anything, and a form that grows a field should be a change made here on
 * purpose rather than one that leaks through.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await request.json();

    const { name, email, contact, subject, message, rating } = body ?? {};

    // Checked here so an unusable message is refused without a round trip
    // upstream; everything else is optional as far as this route cares.
    if (!email || !message || !subject || !rating) {
      return NextResponse.json(
        {
          status: "fail",
          message:
            "An email address, a subject, a rating and a message are all needed.",
        },
        { status: 400 },
      );
    }

    const res = await fetch(`${BASE}/${SLUG}/support-question`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        contact,
        subject,
        message,
        rating,
      }),
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
