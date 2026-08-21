import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { mergeEmployeeSalesById } from "@/lib/staff/employeeSales";

const BASE = process.env.NEXT_PUBLIC_API_URL;

type EmployeeSalesRow = {
  _id: string;
  name?: string;
  totalSales?: number;
  totalRevenue?: number;
  totalRefunds?: number;
  refundedAmount?: number;
  bills?: unknown[];
};

export const GET = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  try {
    const url = new URL(`${BASE}/business/report/salesByAllEmployee`);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch employee sales data" },
        { status: res.status },
      );
    }

    const data = await res.json();

    // A renamed employee is returned as two rows sharing one `_id`. The sums
    // below are unaffected, but the list is passed through to callers, so it
    // is merged here too rather than leaving one person as two entries.
    const employeesData: EmployeeSalesRow[] = mergeEmployeeSalesById(
      data?.data?.employeesData ?? [],
    );

    // Calculate total revenue and total sales from all employees
    let totalRevenue = 0;
    let totalSales = 0;

    for (const employee of employeesData) {
      totalRevenue += employee.totalRevenue ?? 0;
      totalSales += employee.totalSales ?? 0;
    }

    return NextResponse.json(
      {
        ...data,
        data: { ...data?.data, employeesData },
        aggregated: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalSales,
        },
      },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch employee sales data" },
      { status: 500 },
    );
  }
};
