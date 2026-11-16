import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ── GET /api/addons/:id ──────────────────────────────────────────────

export const GET = async (_request: Request, { params }: RouteContext) => {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(
      `${BASE}/business/addons/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to fetch addon" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Fetch addon error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// ── PUT /api/addons/:id ──────────────────────────────────────────────

export const PUT = async (request: Request, { params }: RouteContext) => {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const body = await request.json();

    const res = await fetch(
      `${BASE}/business/addons/${encodeURIComponent(id)}`,
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

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to update addon" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update addon error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// ── DELETE /api/categories/:id ────────────────────────────────────────────

export const DELETE = async (_request: Request, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(`${BASE}/business/addons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to delete addon" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Delete addon error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
