import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  try {
    const params = new URLSearchParams();
    params.set("limit", "5000");
    if (startDate) params.set("from_date", startDate);
    if (endDate) params.set("to_date", endDate);

    const res = await fetch(
      `${BASE}/business/shift/allshifts?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch shifts" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const shifts = data?.data ?? [];

    return NextResponse.json({
      status: "success",
      data: shifts,
    });
  } catch (error) {
    console.error("Error fetching all shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch all shifts data" },
      { status: 500 },
    );
  }
};
