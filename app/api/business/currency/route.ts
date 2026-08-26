import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Persist the business's currency.
 *
 * The backend takes the **symbol** ("$", "Rs"), not the ISO code, so the
 * caller sends whatever symbol belongs to the code it selected.
 */
export const PATCH = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const body = (await request.json()) as { currency?: string };

    if (!body.currency) {
      return NextResponse.json(
        { message: "A currency symbol is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${BASE}/business/auth/updateCurrency`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currency: body.currency }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Update currency error:", error);
    return NextResponse.json(
      { message: "Failed to update currency" },
      { status: 500 },
    );
  }
};
