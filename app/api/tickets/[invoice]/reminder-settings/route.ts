import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Due date and reminder schedule for one invoice.
 *
 * A bridge like every other ticket route here: the browser holds the session
 * in an httpOnly cookie it cannot read, so the token becomes a bearer header
 * on this side.
 *
 * The body is forwarded as-is rather than rebuilt, so a field added to the
 * schedule payload later needs no change here.
 */
export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ invoice: string }> },
) => {
  const { invoice } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const res = await fetch(
      `${BASE}/business/ticket/${invoice}/reminder-settings`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Reminder settings error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
