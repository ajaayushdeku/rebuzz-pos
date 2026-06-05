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

// ── Types matching actual API response ────────────────────────────────────

type RawBill = {
  _id: string;
  orderId: string;
  invoiceNo: number;
  paidBillNo: number;
  totalAmount: number;
  grandTotal: number;
  paidAt: string;
};

type RawEmployee = {
  _id: string;
  name: string;
  adminId: string;
  totalSales: number;
  totalRevenue: number;
  bills: RawBill[];
};

// ── Date helpers ──────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Returns last 30 days date range
function getDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 30);
  return {
    startDate: toDateStr(start),
    endDate: toDateStr(today),
  };
}

// ── Nepal hour extractor ────────────────────────────────────────────────
function getNepalHour(paidAt: string): number {
  if (!paidAt) return 0;
  const timePart =
    (paidAt.includes("T") ? paidAt.split("T")[1] : paidAt.split(" ")[1]) ||
    "00:00:00";
  const [h, m] = timePart.split(":").map(Number);

  if (h >= 12) {
    // Already Nepal 24-hour time — use as-is
    return h;
  }

  // UTC time — add 5 hours 45 minutes
  let nepalHour = h + 5;
  if ((m ?? 0) + 45 >= 60) nepalHour += 1;
  return nepalHour;
}

function getHourLabel(paidAt: string): string | null {
  const h = getNepalHour(paidAt);
  if (h === 12) return "12pm";
  if (h >= 7 && h <= 11) return `${h}am`;
  if (h >= 13 && h <= 21) return `${h - 12}pm`;
  return null; // outside tracked range
}

// ── Core fetcher — salesByAllEmployee ────────────────────────────────────

async function fetchAllEmployeeSales(): Promise<RawEmployee[]> {
  const { startDate, endDate } = getDateRange();
  const res = await fetch(
    `${BASE}/business/report/salesByAllEmployee?startDate=${startDate}&endDate=${endDate}`,
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`salesByAllEmployee failed: ${res.status}`);
  const json = await res.json();
  // Response shape: { status, data: { businessName, employeesData: [...] } }
  return json?.data?.employeesData ?? [];
}

// ── Core fetcher — salesByEmployee/:id ───────────────────────────────────

async function fetchEmployeeDetail(
  employeeId: string,
): Promise<RawEmployee | null> {
  const { startDate, endDate } = getDateRange();
  const res = await fetch(
    `${BASE}/business/report/salesByEmployee/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
    { headers: await authHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  // Response shape: { status, data: { businessName, employeeData: {...} } }
  return json?.data?.employeeData ?? null;
}

// ── getStaffData — stat boxes ─────────────────────────────────────────────

export async function getStaffData(): Promise<StaffBoxProps[]> {
  try {
    const employees = await fetchAllEmployeeSales();
    if (employees.length === 0) return [];

    console.log("Fetched employees for StaffStatBox:", employees); // Debug log to check fetched data

    return employees
      .map((emp) => ({
        staffName: emp.name || emp._id,
        staffPosition: "Staff",
        ordersTaken: emp.totalSales ?? 0,
        amount: Math.round((emp.totalRevenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  } catch (err) {
    console.error("getStaffData error:", err);
    return [];
  }
}

// ── getStaffRevenue — revenue bar chart ───────────────────────────────────

export async function getStaffRevenue(): Promise<StaffRevenue[]> {
  try {
    const employees = await fetchAllEmployeeSales();
    if (employees.length === 0) return [];

    return employees
      .map((emp) => ({
        name: emp.name || emp._id,
        revenue: Math.round((emp.totalRevenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (err) {
    console.error("getStaffRevenue error:", err);
    return [];
  }
}

// ── getStaffOrdersPerHour — hourly line chart ─────────────────────────────

export async function getStaffOrdersPerHour(): Promise<StaffHourlyData[]> {
  try {
    const employees = await fetchAllEmployeeSales();
    if (employees.length === 0) return mockStaffHourlyOrderData;

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

    // Build map: employeeName → hour → count
    // Bills are already included in the salesByAllEmployee response
    const staffHourMap = new Map<string, Map<string, number>>();

    for (const emp of employees) {
      const name = emp.name || emp._id;
      const hourMap = new Map<string, number>(HOUR_SLOTS.map((h) => [h, 0]));

      for (const bill of emp.bills ?? []) {
        const slot = getHourLabel(bill.paidAt);
        console.log("Slot:", slot);
        if (slot && hourMap.has(slot)) {
          hourMap.set(slot, (hourMap.get(slot) ?? 0) + 1);
        }
      }

      staffHourMap.set(name, hourMap);
    }

    console.log("Staff hourly map:", staffHourMap); // Debug log to check mapping
    // Convert to StaffHourlyData[]
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

// ── getShiftAnalysisData — shift breakdown table ──────────────────────────

export async function getShiftAnalysisData(): Promise<Shift[]> {
  try {
    const employees = await fetchAllEmployeeSales();
    if (employees.length === 0) return mockShiftAnalysisData;

    // Shift hour boundaries (Nepal time)
    const SHIFTS = [
      { label: "Morning (6am–12pm)", start: 6, end: 12 },
      { label: "Afternoon (12pm–5pm)", start: 12, end: 17 },
      { label: "Evening (5pm–11pm)", start: 17, end: 23 },
    ];

    type ShiftAccum = {
      orders: number;
      revenue: number;
      staffSet: Set<string>;
    };

    const shiftMap = new Map<string, ShiftAccum>(
      SHIFTS.map((s) => [
        s.label,
        { orders: 0, revenue: 0, staffSet: new Set() },
      ]),
    );

    for (const emp of employees) {
      for (const bill of emp.bills ?? []) {
        const hour = getNepalHour(bill.paidAt);

        for (const shift of SHIFTS) {
          if (hour >= shift.start && hour < shift.end) {
            const accum = shiftMap.get(shift.label)!;
            accum.orders += 1;
            accum.revenue += bill.grandTotal ?? 0;
            accum.staffSet.add(emp._id);
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
        avgTime: 0, // not available from this API
      };
    });
  } catch (err) {
    console.error("getShiftAnalysisData error:", err);
    return mockShiftAnalysisData;
  }
}
