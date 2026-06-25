import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface AggregatedMetrics {
  totalRevenue: number;
  totalSales: number;
  totalOrders: number;
}

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

export async function getAggregatedMetrics(
  startDate?: string,
  endDate?: string,
): Promise<AggregatedMetrics> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return {
        totalRevenue: 0,
        totalSales: 0,
        totalOrders: 0,
      };
    }

    // Fetch sales data and tickets in parallel
    const [salesRes, ticketsRes] = await Promise.all([
      fetchSalesData(token, startDate, endDate),
      fetchTicketsData(token, startDate, endDate),
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

    console.log("Total Revenue:", totalRevenue);
    console.log("Total Sales:", totalSales);
    console.log("Total Orders:", totalOrders);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      totalOrders,
    };
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    return {
      totalRevenue: 0,
      totalSales: 0,
      totalOrders: 0,
    };
  }
}

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
