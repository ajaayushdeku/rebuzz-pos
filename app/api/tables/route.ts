import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        status: "fail",
        message: "No token found",
      },
      { status: 401 },
    );
  }

  const res = await axios.get(`${BASE}/business/tables`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = res.data;
  return NextResponse.json(data, {
    status: res.status,
  });
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await request.json();
    const { name, notes, seats } = body;

    const payload = {
      name,
      notes,
      seats,
    };

    const res = await fetch(`${BASE}/business/tables`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to create new table" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create Table POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
