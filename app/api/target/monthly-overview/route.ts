import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG ?? "business";

/** GET /api/target/monthly-overview?year=2026 — modal actual/growth columns. */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const year = request.nextUrl.searchParams.get("year");
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";

    const res = await fetch(`${BASE}/${SLUG}/target/monthly-overview${qs}`, {
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
