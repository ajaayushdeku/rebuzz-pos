import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Turn an employee's auto-print on or off.
 *
 * A proxy, like every other authenticated call: the browser cannot read the
 * httpOnly `token` cookie, so the session is attached here.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const { employeeId } = await params;
    const body = await request.json();

    const res = await fetch(
      `${BASE}/business/employees/${employeeId}/autoprint`,
      {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ canAutoPrint: Boolean(body?.canAutoPrint) }),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to update auto print" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Employee autoprint PATCH error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
