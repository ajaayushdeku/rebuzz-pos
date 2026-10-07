import { NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function PUT(_request: Request, { params }: Ctx) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/business/offers/${id}/enable-disable`, {
      method: "PUT",
      headers: await authHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data?.message || "Failed to enable/disable offer card",
        },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Offer card enable/disable PUT error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
