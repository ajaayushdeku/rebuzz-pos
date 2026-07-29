import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BASE}/business/expense/purpose/getall`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Expense purpose getall error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense purposes" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${BASE}/business/expense/purpose/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Expense purpose create error:", error);
    return NextResponse.json(
      { error: "Failed to create expense purpose" },
      { status: 500 },
    );
  }
}
