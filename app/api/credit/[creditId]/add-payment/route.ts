import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// POST /api/credit/[creditId]/add-payment
// Records a payment against a credit. Body: { paymentAmount, paidAt, paymentMethod }.
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;
    const body = await req.json();

    const res = await fetch(`${BASE}/business/credit/${creditId}/add-payment`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Add credit payment error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
