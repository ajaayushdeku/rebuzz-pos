// import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
// import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
// import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
// import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
// import { authHeaders } from "../authServices/session";
// import {
//   mockShiftAnalysisData,
//   mockStaffData,
//   mockStaffHourlyOrderData,
//   mockStaffRevenue,
// } from "@/lib/mockData/mock-staffdata";

// const BASE = process.env.NEXT_PUBLIC_API_URL;

// // ── Types for the new sales endpoints ────────────────────────────────────

// export type AllEmployeeSales = {
//   employeeId: string;
//   employeeName: string;
//   totalSales: number;
//   orderCount: number;
// };

// export type EmployeeSalesDetail = {
//   employeeId: string;
//   employeeName: string;
//   totalSales: number;
//   orderCount: number;
//   bills: {
//     billNo: string;
//     grandTotal: number;
//     paidAt: string;
//   }[];
// };

// // ── New API functions ────────────────────────────────────────────────────

// /** Fetch aggregated sales data for all employees */
// export async function getSalesByAllEmployee(): Promise<AllEmployeeSales[]> {
//   try {
//     const res = await fetch(`${BASE}/business/report/salesByAllEmployee`, {
//       headers: await authHeaders(),
//       next: { revalidate: 300 },
//     });
//     if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
//     const json = await res.json();
//     // Handle various response shapes: { data: [...] } or { data: { data: [...] } } or [...] directly
//     const raw = json?.data ?? json ?? [];
//     return raw;
//   } catch (err) {
//     console.error("getSalesByAllEmployee error:", err);
//     return [];
//   }
// }

// /** Fetch detailed sales data for a specific employee */
// export async function getSalesByEmployee(
//   employeeId: string,
// ): Promise<EmployeeSalesDetail | null> {
//   try {
//     const res = await fetch(
//       `${BASE}/business/report/salesByEmployee/${employeeId}`,
//       {
//         headers: await authHeaders(),
//         next: { revalidate: 300 },
//       },
//     );
//     if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
//     const json = await res.json();
//     return json?.data ?? null;
//   } catch (err) {
//     console.error("getSalesByEmployee error:", err);
//     return null;
//   }
// }

// // ── Existing functions ───────────────────────────────────────────────────

// export async function getStaffRevenue(): Promise<StaffRevenue[]> {
//   return mockStaffRevenue;
// }

// export async function getStaffOrdersPerHour(): Promise<StaffHourlyData[]> {
//   return mockStaffHourlyOrderData;
// }

// export async function getShiftAnalysisData(): Promise<Shift[]> {
//   return mockShiftAnalysisData;
// }

// /** Fetch staff list from API and map to StaffBoxProps */
// export async function getStaffData(): Promise<StaffBoxProps[]> {
//   try {
//     const headers = await authHeaders();
//     const res = await fetch(`${BASE}/business/users/roles/employee`, {
//       headers,
//       next: { revalidate: 300 },
//     });
//     if (!res.ok) throw new Error(`Failed to fetch staff: ${res.status}`);
//     const json = await res.json();
//     const users: {
//       _id: string;
//       name: string;
//       email?: string;
//       role?: string;
//       numberOfPurchases?: number;
//       totalSpent?: number;
//     }[] = json?.data?.users ?? [];

//     if (users.length === 0) return mockStaffData;

//     // Also fetch sales data to get order counts and revenue
//     const salesData = await getSalesByAllEmployee();
//     const salesMap = new Map(salesData.map((s) => [s.employeeId, s]));

//     console.log("Fetched users:", users);
//     console.log("Fetched sales data:", salesData);

//     return users.map((user) => ({
//       staffName: user.name || user._id,
//       staffPosition: user.role ?? "Staff",
//       ordersTaken:
//         salesMap.get(user._id)?.orderCount ?? user.numberOfPurchases ?? 0,
//       amount: salesMap.get(user._id)?.totalSales ?? user.totalSpent ?? 0,
//     }));
//   } catch (err) {
//     console.error("getStaffData error:", err);
//     return mockStaffData;
//   }
// }

import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
import { authHeaders } from "../authServices/session";
import {
  mockShiftAnalysisData,
  mockStaffHourlyOrderData,
} from "@/lib/mockData/mock-staffdata";

const BASE = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────

export type RawEmployeeSale = {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  orderCount: number;
};

export type RawEmployeeBill = {
  billNo?: string;
  grandTotal?: number;
  paidAt?: string;
};

export type RawEmployeeDetail = {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  orderCount: number;
  bills: RawEmployeeBill[];
};

// ── Nepal time parser — same logic as heatmap ─────────────────────────────

function parseNepalDate(paidAt: string): Date {
  if (!paidAt) return new Date(0);
  const normalized = paidAt.includes("T")
    ? paidAt.replace("Z", "")
    : paidAt.replace(" ", "T");
  const rawHour = parseInt(normalized.split("T")[1]?.split(":")[0] ?? "12", 10);
  if (rawHour >= 12) {
    return new Date(normalized);
  }
  // UTC — add +5:45
  const d = new Date(normalized + "+00:00");
  d.setMinutes(d.getMinutes() + 5 * 60 + 45);
  return d;
}

function hourLabel(date: Date): string {
  const h = date.getHours();
  if (h === 12) return "12pm";
  if (h >= 7 && h <= 11) return `${h}am`;
  if (h >= 13 && h <= 21) return `${h - 12}pm`;
  return `${h}:00`;
}

// ── Fetchers ──────────────────────────────────────────────────────────────

export async function getSalesByAllEmployee(): Promise<RawEmployeeSale[]> {
  try {
    const res = await fetch(`${BASE}/business/report/salesByAllEmployee`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    console.log("salesByAllEmployee raw:", JSON.stringify(json, null, 2));
    // Handle both { data: [...] } and { data: { data: [...] } }
    const raw = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json)
          ? json
          : [];
    return raw;
  } catch (err) {
    console.error("getSalesByAllEmployee error:", err);
    return [];
  }
}

export async function getSalesByEmployee(
  employeeId: string,
): Promise<RawEmployeeDetail | null> {
  try {
    const res = await fetch(
      `${BASE}/business/report/salesByEmployee/${employeeId}`,
      { headers: await authHeaders(), next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    console.log(
      `salesByEmployee(${employeeId}) raw:`,
      JSON.stringify(json, null, 2),
    );
    return json?.data ?? null;
  } catch (err) {
    console.error(`getSalesByEmployee(${employeeId}) error:`, err);
    return null;
  }
}

// ── getStaffData — stat boxes ─────────────────────────────────────────────

export async function getStaffData(): Promise<StaffBoxProps[]> {
  try {
    const [usersRes, salesData] = await Promise.all([
      fetch(`${BASE}/business/users/roles/employee`, {
        headers: await authHeaders(),
        next: { revalidate: 300 },
      }),
      getSalesByAllEmployee(),
    ]);

    if (!usersRes.ok) throw new Error(`Users fetch failed: ${usersRes.status}`);
    const usersJson = await usersRes.json();
    const users: { _id: string; name: string; role?: string }[] =
      usersJson?.data?.users ?? [];

    console.log("Staff users:", users);
    console.log("Staff sales:", salesData);

    if (users.length === 0 && salesData.length === 0) {
      // No employees fetched — build cards purely from salesData
      return salesData.map((s) => ({
        staffName: s.employeeName || s.employeeId,
        staffPosition: "Staff",
        ordersTaken: s.orderCount ?? 0,
        amount: Math.round((s.totalSales ?? 0) * 100) / 100,
      }));
    }

    const salesMap = new Map(salesData.map((s) => [s.employeeId, s]));

    // Merge users with sales data
    const merged = users.map((user) => {
      const sale = salesMap.get(user._id);
      return {
        staffName: user.name || user._id,
        staffPosition: user.role ?? "Staff",
        ordersTaken: sale?.orderCount ?? 0,
        amount: Math.round((sale?.totalSales ?? 0) * 100) / 100,
      } as StaffBoxProps;
    });

    // Also include any salesData entries that didn't match a user
    const userIds = new Set(users.map((u) => u._id));
    for (const sale of salesData) {
      if (!userIds.has(sale.employeeId)) {
        merged.push({
          staffName: sale.employeeName || sale.employeeId,
          staffPosition: "Staff",
          ordersTaken: sale.orderCount ?? 0,
          amount: Math.round((sale.totalSales ?? 0) * 100) / 100,
        });
      }
    }

    return merged.sort((a, b) => b.amount - a.amount);
  } catch (err) {
    console.error("getStaffData error:", err);
    // Fallback: try just salesByAllEmployee
    const salesData = await getSalesByAllEmployee();
    if (salesData.length > 0) {
      return salesData.map((s) => ({
        staffName: s.employeeName || s.employeeId,
        staffPosition: "Staff",
        ordersTaken: s.orderCount ?? 0,
        amount: Math.round((s.totalSales ?? 0) * 100) / 100,
      }));
    }
    return [];
  }
}

// ── getStaffRevenue — bar chart ───────────────────────────────────────────

export async function getStaffRevenue(): Promise<StaffRevenue[]> {
  try {
    const salesData = await getSalesByAllEmployee();
    if (salesData.length === 0) return [];

    return salesData
      .map((s) => ({
        name: s.employeeName || s.employeeId,
        revenue: Math.round((s.totalSales ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (err) {
    console.error("getStaffRevenue error:", err);
    return [];
  }
}

// ── getStaffOrdersPerHour — hourly line chart per staff ───────────────────

export async function getStaffOrdersPerHour(): Promise<StaffHourlyData[]> {
  try {
    const salesData = await getSalesByAllEmployee();
    if (salesData.length === 0) return mockStaffHourlyOrderData;

    // Fetch detail for each employee in parallel
    const details = await Promise.all(
      salesData.map((s) => getSalesByEmployee(s.employeeId)),
    );

    const HOUR_SLOTS = [
      "7am",
      "8am",
      "9am",
      "10am",
      "11am",
      "12pm",
      "1pm",
      "2pm",
      "3pm",
      "4pm",
      "5pm",
      "6pm",
      "7pm",
      "8pm",
      "9pm",
    ];

    // Build map: employeeId → name
    const nameMap = new Map(
      salesData.map((s) => [s.employeeId, s.employeeName || s.employeeId]),
    );

    // Build map: employeeName → hour → count
    const staffHourMap = new Map<string, Map<string, number>>();

    for (const detail of details) {
      if (!detail) continue;
      const name = nameMap.get(detail.employeeId) ?? detail.employeeName;
      const hourMap = new Map<string, number>();
      for (const slot of HOUR_SLOTS) hourMap.set(slot, 0);

      for (const bill of detail.bills ?? []) {
        if (!bill.paidAt) continue;
        const date = parseNepalDate(bill.paidAt);
        const slot = hourLabel(date);
        if (hourMap.has(slot)) {
          hourMap.set(slot, (hourMap.get(slot) ?? 0) + 1);
        }
      }

      staffHourMap.set(name, hourMap);
    }

    if (staffHourMap.size === 0) return mockStaffHourlyOrderData;

    // Convert to StaffHourlyData format
    return HOUR_SLOTS.map((hour) => ({
      hour,
      staff: Array.from(staffHourMap.entries()).map(([name, hourMap]) => ({
        name,
        value: hourMap.get(hour) ?? 0,
      })),
    }));
  } catch (err) {
    console.error("getStaffOrdersPerHour error:", err);
    return mockStaffHourlyOrderData;
  }
}

// ── getShiftAnalysisData — morning/afternoon/evening breakdown ────────────

export async function getShiftAnalysisData(): Promise<Shift[]> {
  try {
    const salesData = await getSalesByAllEmployee();
    if (salesData.length === 0) return mockShiftAnalysisData;

    const details = await Promise.all(
      salesData.map((s) => getSalesByEmployee(s.employeeId)),
    );

    // Shift definitions (Nepal time hours)
    const SHIFTS = [
      { label: "Morning", start: 6, end: 12 },
      { label: "Afternoon", start: 12, end: 17 },
      { label: "Evening", start: 17, end: 23 },
    ];

    type ShiftAccum = {
      orders: number;
      revenue: number;
      staffSet: Set<string>;
      totalTime: number;
    };

    const shiftMap = new Map<string, ShiftAccum>(
      SHIFTS.map((s) => [
        s.label,
        { orders: 0, revenue: 0, staffSet: new Set(), totalTime: 0 },
      ]),
    );

    for (const detail of details) {
      if (!detail) continue;
      for (const bill of detail.bills ?? []) {
        if (!bill.paidAt) continue;
        const date = parseNepalDate(bill.paidAt);
        const hour = date.getHours();

        for (const shift of SHIFTS) {
          if (hour >= shift.start && hour < shift.end) {
            const accum = shiftMap.get(shift.label)!;
            accum.orders += 1;
            accum.revenue += bill.grandTotal ?? 0;
            accum.staffSet.add(detail.employeeId);
            break;
          }
        }
      }
    }

    return SHIFTS.map((s) => {
      const accum = shiftMap.get(s.label)!;
      return {
        label: s.label,
        orders: accum.orders,
        revenue: Math.round(accum.revenue * 100) / 100,
        staff: accum.staffSet.size,
        avgTime:
          accum.orders > 0 ? Math.round(accum.totalTime / accum.orders) : 0,
      };
    });
  } catch (err) {
    console.error("getShiftAnalysisData error:", err);
    return mockShiftAnalysisData;
  }
}
