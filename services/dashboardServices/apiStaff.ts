import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
import { authHeaders } from "../authServices/session";
import {
  mockShiftAnalysisData,
  mockStaffData,
  mockStaffHourlyOrderData,
  mockStaffRevenue,
} from "@/lib/mockData/mock-staffdata";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Types for the new sales endpoints ────────────────────────────────────

export type AllEmployeeSales = {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  orderCount: number;
};

export type EmployeeSalesDetail = {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  orderCount: number;
  bills: {
    billNo: string;
    grandTotal: number;
    paidAt: string;
  }[];
};

// ── New API functions ────────────────────────────────────────────────────

/** Fetch aggregated sales data for all employees */
export async function getSalesByAllEmployee(): Promise<AllEmployeeSales[]> {
  try {
    const res = await fetch(`${BASE}/business/report/salesByAllEmployee`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const json = await res.json();
    // Handle various response shapes: { data: [...] } or { data: { data: [...] } } or [...] directly
    const raw = json?.data ?? json ?? [];
    return raw;
  } catch (err) {
    console.error("getSalesByAllEmployee error:", err);
    return [];
  }
}

/** Fetch detailed sales data for a specific employee */
export async function getSalesByEmployee(
  employeeId: string,
): Promise<EmployeeSalesDetail | null> {
  try {
    const res = await fetch(
      `${BASE}/business/report/salesByEmployee/${employeeId}`,
      {
        headers: await authHeaders(),
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const json = await res.json();
    return json?.data ?? null;
  } catch (err) {
    console.error("getSalesByEmployee error:", err);
    return null;
  }
}

// ── Existing functions ───────────────────────────────────────────────────

export async function getStaffRevenue(): Promise<StaffRevenue[]> {
  return mockStaffRevenue;
}

export async function getStaffOrdersPerHour(): Promise<StaffHourlyData[]> {
  return mockStaffHourlyOrderData;
}

export async function getShiftAnalysisData(): Promise<Shift[]> {
  return mockShiftAnalysisData;
}

/** Fetch staff list from API and map to StaffBoxProps */
export async function getStaffData(): Promise<StaffBoxProps[]> {
  try {
    const headers = await authHeaders();
    const res = await fetch(`${BASE}/business/users/roles/employee`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Failed to fetch staff: ${res.status}`);
    const json = await res.json();
    const users: {
      _id: string;
      name: string;
      email?: string;
      role?: string;
      numberOfPurchases?: number;
      totalSpent?: number;
    }[] = json?.data?.users ?? [];

    if (users.length === 0) return mockStaffData;

    // Also fetch sales data to get order counts and revenue
    const salesData = await getSalesByAllEmployee();
    const salesMap = new Map(salesData.map((s) => [s.employeeId, s]));

    console.log("Fetched users:", users);
    console.log("Fetched sales data:", salesData);

    return users.map((user) => ({
      staffName: user.name || user._id,
      staffPosition: user.role ?? "Staff",
      ordersTaken:
        salesMap.get(user._id)?.orderCount ?? user.numberOfPurchases ?? 0,
      amount: salesMap.get(user._id)?.totalSales ?? user.totalSpent ?? 0,
    }));
  } catch (err) {
    console.error("getStaffData error:", err);
    return mockStaffData;
  }
}
