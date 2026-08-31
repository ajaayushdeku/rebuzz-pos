import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const ENDPOINT = `${BASE}/business/loyaltytier`;

/**
 * Proxy for the loyalty tier collection.
 *
 * The browser cannot read the httpOnly `token` cookie, so the session is
 * attached here, as with every other authenticated call in the app.
 */
export async function GET() {
  try {
    const res = await fetch(ENDPOINT, {
      headers: await authHeaders(),
      // Tiers change from this very page, so a cached list would show the
      // business its own edit missing.
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to fetch loyalty tiers" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Loyalty tier GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to create loyalty tier" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Loyalty tier POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
