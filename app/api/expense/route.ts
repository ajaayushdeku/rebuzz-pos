import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year query parameters are required" },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${BASE}/business/expense/getall?month=${month}&year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Expense getall error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
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

    const res = await fetch(`${BASE}/business/expense/create`, {
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
    console.error("Expense create error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}
