import { NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// GET /api/credit/getall — list every credit.
export const GET = async () => {
  try {
    const res = await fetch(`${BASE}/business/credit/getall`, {
      headers: await authHeaders(),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get all credits error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
