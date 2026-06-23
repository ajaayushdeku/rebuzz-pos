import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "15";

    const res = await fetch(`${BASE}/business/ticket/archived?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    // Extract tickets array from response: { status: "success", data: { tickets: [...], nextCursor: "..." } }
    const tickets = data?.data?.tickets || data?.tickets || [];
    return NextResponse.json(
      { ...data, data: tickets },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch archived invoices" },
      { status: 500 },
    );
  }
}
