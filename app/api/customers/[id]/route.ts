import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const contentType = request.headers.get("content-type") ?? "";

    // Multipart carries the profile photo and is forwarded as-is; JSON is kept
    // for callers that don't upload an image.
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    let upstreamBody: BodyInit;

    if (contentType.includes("multipart/form-data")) {
      // DO NOT set Content-Type — fetch re-encodes with a fresh boundary
      upstreamBody = await request.formData();
    } else {
      headers["Content-Type"] = "application/json";
      upstreamBody = JSON.stringify(await request.json());
    }

    const res = await fetch(`${BASE}/business/users/${id}`, {
      method: "PUT",
      headers,
      body: upstreamBody,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const res = await fetch(`${BASE}/business/users/user/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
