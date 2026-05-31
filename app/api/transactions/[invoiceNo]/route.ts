import { authHeaders } from "@/services/authServices/session";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceNo: string }> },
) => {
  const { invoiceNo } = await params; // ← await it

  const res = await fetch(`${BASE}/business/ticket/${invoiceNo}/bill`, {
    headers: await authHeaders(),
  });

  const data = await res.json();

  // console.log("BILL DATA:", data);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
};
