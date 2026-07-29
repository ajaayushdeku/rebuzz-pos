import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BASE}/business/expense/purpose-group/delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Expense purpose-group delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense group" },
      { status: 500 },
    );
  }
}
