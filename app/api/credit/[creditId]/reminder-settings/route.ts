import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * PUT /api/credit/[creditId]/reminder-settings
 *
 * Due date and reminder schedule for a credit, the counterpart to the ticket
 * route of the same name. The body is forwarded as-is, so a field added to the
 * payload later needs no change here.
 */
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ creditId: string }> },
) => {
  try {
    const { creditId } = await params;
    const body = await req.json();

    const res = await fetch(
      `${BASE}/business/credit/${creditId}/reminder-settings`,
      {
        method: "PUT",
        headers: await authHeaders(),
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Credit reminder settings error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
