import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBreakEvenData } from "@/services/dashboardServices/apiProfitCost";

/**
 * Break-even and margin of safety for one calendar month.
 *
 * The card is a client component (it owns its own month picker), so the
 * calculation runs here instead — it needs the httpOnly token, and keeping it
 * server-side also means the several upstream calls it makes collapse into one
 * request from the browser.
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  // Guard before the values reach date arithmetic, where a NaN would quietly
  // produce an "Invalid Date" and an empty month rather than an error.
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 1970 ||
    year > 9999
  ) {
    return NextResponse.json(
      { error: "month must be 1-12 and year must be a four-digit year" },
      { status: 400 },
    );
  }

  try {
    const data = await getBreakEvenData(month, year);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("break-even error:", error);
    return NextResponse.json(
      { error: "Failed to calculate break-even" },
      { status: 500 },
    );
  }
}
