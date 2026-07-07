import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// Proxy for the Business Report API so client components can read revenue for a
// given date range without exposing the httpOnly auth token.
export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const today = new Date().toISOString().split("T")[0];
    const startDate = searchParams.get("startDate") ?? today;
    const endDate = searchParams.get("endDate") ?? today;
    const limit = searchParams.get("limit") ?? "25";

    const res = await fetch(
      `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Always fresh — the tracker reflects the live current-period revenue.
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: `Failed to fetch report: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Report route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
