import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// POST /api/credit/create/[invoiceNo]
// Moves the given ticket/invoice into the credit section (creates a credit).
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> },
) => {
  try {
    const { invoiceNo } = await params;
    const body = await req.json();

    const res = await fetch(`${BASE}/business/credit/create/${invoiceNo}`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Create credit error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
