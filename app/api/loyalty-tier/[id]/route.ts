import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/** `params` is a promise in this version of Next — it must be awaited. */
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params;

  try {
    const body = await request.json();

    const res = await fetch(`${BASE}/business/loyaltytier/${id}`, {
      method: "PUT",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to update loyalty tier" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Loyalty tier PUT error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/business/loyaltytier/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });

    // A delete may answer with an empty body, which `json()` would throw on.
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to delete loyalty tier" },
        { status: res.status },
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Loyalty tier DELETE error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
