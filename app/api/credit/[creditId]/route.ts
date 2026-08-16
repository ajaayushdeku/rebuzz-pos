import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// PATCH /api/credit/[creditId] — update credit's user and/or ticketName.
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;
    const body = await req.json();

    const res = await fetch(`${BASE}/business/credit/${creditId}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update credit error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
