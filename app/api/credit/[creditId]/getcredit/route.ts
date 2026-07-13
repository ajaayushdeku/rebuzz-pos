import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// GET /api/credit/[creditId]/getcredit — credit detail + items + paymentHistory.
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;

    const res = await fetch(`${BASE}/business/credit/${creditId}/getcredit`, {
      headers: await authHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get credit detail error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
