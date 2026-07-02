import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Proxy for the backend "email bill" endpoint:
 *   POST {BASE}/:business_slug/bills/email
 *
 * The browser can't read the httpOnly `token` cookie or know the business slug,
 * so this route reads the session token server-side, resolves the slug from the
 * business profile, and forwards the frontend-generated PDF to the backend.
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

  // ── Resolve the business slug from the business profile ──
  let slug: string | undefined;
  try {
    const bizRes = await fetch(`${BASE}/business/aboutBusiness`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const bizJson = await bizRes.json();
    const business = bizJson?.data?.business;
    slug =
      business?.slug ??
      business?.businessSlug ??
      business?.slugName ??
      undefined;
  } catch (error) {
    console.error("email bill: failed to resolve business slug", error);
  }

  if (!slug) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Could not resolve business. Please try again.",
      },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${BASE}/${slug}/bills/email`, {
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
