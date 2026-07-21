import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Target Tracker API is business-scoped: {API_URL}/{slug}/target.
const BASE = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "business";

/** GET /api/target?year=2026 — saved daily/weekly/monthly/annual targets. */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const year = request.nextUrl.searchParams.get("year");
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";

    const res = await fetch(`${BASE}/${SLUG}/target${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PUT /api/target — set daily/weekly/monthly targets (admin only upstream). */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const body = await request.json();

    const res = await fetch(`${BASE}/${SLUG}/target`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
