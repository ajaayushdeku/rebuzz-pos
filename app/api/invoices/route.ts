import { authHeaders } from "@/services/authServices/session";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export const GET = async () => {
  const res = await fetch(`${BASE}/business/ticket/unarchived`, {
    headers: await authHeaders(),
  });

  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: res.status },
    );

  return NextResponse.json(data);
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const res = await fetch(`${BASE}/business/ticket`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok)
    return NextResponse.json(
      { error: "Failed to create" },
      { status: res.status },
    );
  return NextResponse.json(data);
};
