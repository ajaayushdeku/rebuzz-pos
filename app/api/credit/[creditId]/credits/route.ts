import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// GET /api/credit/[creditId]/credits — all credits for a customer (userId).
// The dynamic segment holds the customer's user id.
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId: userId } = await params;

    const res = await fetch(`${BASE}/business/credit/${userId}/credits`, {
      headers: await authHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get customer credits error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
