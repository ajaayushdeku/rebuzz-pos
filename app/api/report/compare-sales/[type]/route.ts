import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    let endpoint = "";

    switch (type) {
      case "date":
        endpoint = "compare-sales-by-date";
        break;
      case "week":
        endpoint = "compare-sales-by-week";
        break;
      case "month":
        endpoint = "compare-sales-by-month";
        break;
      case "year":
        endpoint = "compare-sales-by-year";
        break;
      default:
        return NextResponse.json(
          { message: "Invalid compare type" },
          { status: 400 },
        );
    }

    let url = `${BASE}/business/report/${endpoint}`;

    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    console.log("Compare Data:", data);

    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (error) {
    console.error("Compare sales API error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
