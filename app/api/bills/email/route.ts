import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Proxy for the backend "email bill" endpoint:
 *   POST {BASE}/business/bills/email
 *
 * The browser can't read the httpOnly `token` cookie, so this route reads the
 * session token server-side and forwards the frontend-generated PDF, using the
 * token-scoped `business` context (same as the app's other authenticated calls).
 */
export const POST = async (request: Request) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { status: "fail", message: "Login Required" },
      { status: 403 },
    );
  }

  const body = await request.json();

  try {
    const res = await fetch(`${BASE}/business/bills/email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({
      status: "fail",
      message: "Failed to email bill",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("email bill proxy error", error);
    return NextResponse.json(
      { status: "fail", message: "Failed to email bill" },
      { status: 500 },
    );
  }
};
