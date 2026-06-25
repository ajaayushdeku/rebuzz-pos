import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const POST = async (request: Request) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const body = await request.json();

  const res = await fetch(`${BASE}/business/ticket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  return NextResponse.json(data, {
    status: res.status,
  });
};

export const GET = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("from_date") ?? "";
  const endDate = searchParams.get("to_date") ?? "";

  try {
    const url = new URL(`${BASE}/business/ticket`);

    const params = new URLSearchParams();
    if (startDate) params.set("from_date", startDate);
    if (endDate) params.set("to_date", endDate);
    params.set("limit", "500");

    url.search = params.toString();

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const allTickets = data?.data?.allTickets ?? [];
    const totalOrders = allTickets.length;

    return NextResponse.json(
      {
        totalOrders,
        tickets: allTickets,
      },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
};
