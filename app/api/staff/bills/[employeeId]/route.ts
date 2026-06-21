import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface BillRecord {
  _id: string;
  generatedById: string;
  customerId?: string | null;
  isRefunded: boolean;
  invoiceNo: number;
  grandTotal: number;
  totalAmount: number;
  paidAt: string;
  [key: string]: unknown;
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> },
) => {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  try {
    // Fetch bills from the external API with date range
    let billsUrl = `${BASE}/business/ticket/bills?limit=1000`;
    if (startDate) billsUrl += `&startDate=${startDate}`;
    if (endDate) billsUrl += `&endDate=${endDate}`;

    const res = await fetch(billsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const allBills: BillRecord[] =
      data?.data?.bill ?? data?.bill ?? data?.data ?? [];

    // Filter bills for the selected employee
    const employeeBills = allBills.filter(
      (bill) => bill.generatedById === employeeId,
    );

    // Calculate customer count (unique customer IDs)
    const uniqueCustomerIds = new Set<string>();
    employeeBills.forEach((bill) => {
      if (bill.customerId) {
        uniqueCustomerIds.add(bill.customerId);
      }
    });

    // Calculate refund rate
    const totalBills = employeeBills.length;
    const refundedBills = employeeBills.filter(
      (bill) => bill.isRefunded === true,
    ).length;

    return NextResponse.json({
      status: "success",
      data: {
        totalBills,
        customerCount: uniqueCustomerIds.size,
        refundedBills,
        refundRate: totalBills > 0 ? refundedBills / totalBills : 0,
        bills: employeeBills,
      },
    });
  } catch (error) {
    console.error("Error fetching employee bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee bills data" },
      { status: 500 },
    );
  }
};
