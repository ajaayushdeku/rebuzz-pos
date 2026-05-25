import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── PUT — update product by ID ─────────────────────────────────────────────
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "productId is required" },
        { status: 400 },
      );
    }

    // Client now sends multipart/form-data directly — forward it as-is
    const formData = await request.formData();

    // ── Debug FormData ──────────────────
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const res = await fetch(`${BASE}/business/products/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// ── DELETE — delete product by ID ───────────────────────────────────────────
export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "productId is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${BASE}/business/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
