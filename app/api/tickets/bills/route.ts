import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const endDate =
      searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
    const startDate =
      searchParams.get("startDate") ??
      new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    const limit = searchParams.get("limit") ?? "25";

    const res = await fetch(
      `${BASE}/business/ticket/bills?startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: `Failed to fetch bills: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Bills fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
