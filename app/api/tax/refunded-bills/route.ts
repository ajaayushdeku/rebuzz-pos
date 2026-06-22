import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface RefundedBill {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const endDate =
      searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];
    const startDate =
      searchParams.get("startDate") ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

    const res = await fetch(
      `${BASE}/business/ticket/bills?startDate=${startDate}&endDate=${endDate}&limit=500`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: `Failed to fetch bills: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    const bills = data?.data?.bill ?? [];

    const refundedBills: RefundedBill[] = bills
      .filter((bill: { isRefunded: boolean }) => bill.isRefunded === true)
      .map(
        (bill: {
          invoiceNo: number;
          grandTotal: number;
          taxamt: number;
          ticketName: string;
          updatedAt: string;
        }) => ({
          billNumber: bill.invoiceNo,
          refundedAmount: bill.grandTotal ?? 0,
          taxRefunded: bill.taxamt ?? 0,
          reason: bill.ticketName || "Refund",
          date: new Date(bill.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        }),
      )
      .sort(
        (a: RefundedBill, b: RefundedBill) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

    return NextResponse.json(refundedBills, { status: 200 });
  } catch (error) {
    console.error("Refunded bills fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
