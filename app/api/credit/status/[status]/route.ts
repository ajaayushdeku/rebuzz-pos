import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// GET /api/credit/status/[status] — credits filtered by status
// (ongoing | completed | archived).
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ status: string }> },
) => {
  try {
    const { status } = await params;

    const res = await fetch(`${BASE}/business/credit/${status}`, {
      headers: await authHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get credits by status error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
