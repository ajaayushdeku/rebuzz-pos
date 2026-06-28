import { NextRequest, NextResponse } from "next/server";
import { authHeaders } from "@/services/authServices/session";
import { RawBillListResponse } from "@/lib/types/bill";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let url = `${BASE}/business/ticket/bills?limit=500`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const headers = await authHeaders();

    const res = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: res.status },
      );
    }

    const data: RawBillListResponse = await res.json();
    const bills = data.data.bill;

    let totalOrders = 0;
    let revenue = 0;
    let refunds = 0;
    let refundCount = 0;
    let completedCount = 0;

    for (const bill of bills) {
      totalOrders += 1;
      const amount = bill.grandTotal ?? 0;
      if (bill.isRefunded) {
        refunds += amount;
        refundCount += 1;
      } else {
        revenue += amount;
        completedCount += 1;
      }
    }

    const avgOrderValue = completedCount > 0 ? revenue / completedCount : 0;
    const refundRate = totalOrders > 0 ? (refundCount / totalOrders) * 100 : 0;

    return NextResponse.json({
      data: {
        totalOrders,
        revenue: Math.round(revenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
        refundCount,
        refundRate: Math.round(refundRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Order history stats error:", error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
