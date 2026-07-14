import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// GET /api/credit/[creditId]/payment-history — payment records for a credit.
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;

    const res = await fetch(
      `${BASE}/business/credit/${creditId}/payment-history`,
      {
        headers: await authHeaders(),
        cache: "no-store",
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get credit payment history error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
