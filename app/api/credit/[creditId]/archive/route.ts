import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// DELETE /api/credit/[creditId]/archive — archive (soft-delete) a credit.
export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;

    const res = await fetch(`${BASE}/business/credit/${creditId}/archive`, {
      method: "DELETE",
      headers: await authHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Archive credit error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
