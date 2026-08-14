import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// PUT /api/credit/[creditId]/payments/[paymentId]
// Updates an existing payment on a credit.
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ creditId: string; paymentId: string }> },
) => {
  try {
    const { creditId, paymentId } = await params;
    const body = await req.json();

    const res = await fetch(
      `${BASE}/business/credit/${creditId}/payments/${paymentId}`,
      {
        method: "PUT",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update credit payment error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// DELETE /api/credit/[creditId]/payments/[paymentId]
// Removes a payment from a credit's payment history.
export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ creditId: string; paymentId: string }> },
) => {
  try {
    const { creditId, paymentId } = await params;

    const res = await fetch(
      `${BASE}/business/credit/${creditId}/payments/${paymentId}`,
      {
        method: "DELETE",
        headers: await authHeaders(),
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Delete credit payment error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
