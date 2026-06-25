import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface SalesResponse {
  status: string;
  data: {
    businessName?: string;
    employeesData: Array<{
      _id: string;
      name: string;
      role: string;
      totalSales: number;
      totalRevenue: number;
      bills: Array<{
        _id: string;
        orderId: string;
        invoiceNo: number;
        paidBillNo: number;
        totalAmount: number;
        grandTotal: number;
        paidAt: string;
      }>;
    }>;
  };
}

interface BillsResponse {
  status: string;
  data: {
    totalBills: number;
    customerCount: number;
    refundedBills: number;
    refundRate: number;
  };
}

interface TicketsResponse {
  status: string;
  data: {
    allTickets: Array<{
      _id: string;
      ticketTakenBy: string;
      paidStatus: string;
      grandTotal: number;
      invoice: number;
    }>;
  };
}

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
    // Fetch sales data, tickets, and bills in parallel
    const [salesRes, ticketsRes, billsRes] = await Promise.all([
      fetchSalesData(token, startDate, endDate),
      fetchTicketsData(token, startDate, endDate),
      fetchBillsData(token, startDate, endDate),
    ]);

    const salesData = salesRes?.data;
    const employeesData = salesData?.employeesData ?? [];

    // Calculate total revenue and total sales from all employees
    let totalRevenue = 0;
    let totalSales = 0;

    for (const employee of employeesData) {
      totalRevenue += employee.totalRevenue ?? 0;
      totalSales += employee.totalSales ?? 0;
    }

    // Get total orders from tickets
    const ticketsData = ticketsRes?.data;
    const allTickets = ticketsData?.allTickets ?? [];
    const totalOrders = allTickets.length;

    // Get total bills from bills API
    const billsData = billsRes?.data;
    const totalBills = billsData?.totalBills ?? 0;

    return NextResponse.json(
      {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        totalOrders,
        totalBills,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch aggregated metrics" },
      { status: 500 },
    );
  }
};

async function fetchSalesData(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<SalesResponse | null> {
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
      console.error("Failed to fetch sales data:", res.status);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return null;
  }
}

async function fetchBillsData(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<BillsResponse | null> {
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
      console.error("Failed to fetch bills data:", res.status);
      return null;
    }

    const data = await res.json();
    const employeesData = data?.data?.employeesData ?? [];

    // Calculate total bills from all employees
    let totalBills = 0;
    let customerCount = 0;
    let refundedBills = 0;

    for (const employee of employeesData) {
      const bills = employee.bills ?? [];
      totalBills += bills.length;

      // Count unique customers (simplified - counting unique orderIds)
      const uniqueCustomers = new Set(
        bills.map((b: { orderId: string }) => b.orderId),
      );
      customerCount += uniqueCustomers.size;

      // Count refunded bills (bills with refund status - simplified)
      refundedBills += bills.filter(
        (b: { paidBillNo: number }) => b.paidBillNo === 0,
      ).length;
    }

    const refundRate = totalBills > 0 ? refundedBills / totalBills : 0;

    return {
      status: "success",
      data: {
        totalBills,
        customerCount,
        refundedBills,
        refundRate,
      },
    };
  } catch (error) {
    console.error("Error fetching bills data:", error);
    return null;
  }
}

async function fetchTicketsData(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<TicketsResponse | null> {
  try {
    const url = new URL(`${BASE}/business/ticket`);

    const params = new URLSearchParams();
    if (startDate) params.set("from_date", startDate);
    if (endDate) params.set("to_date", endDate);
    params.set("limit", "500");

    url.search = params.toString();

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch tickets data:", res.status);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching tickets data:", error);
    return null;
  }
}
