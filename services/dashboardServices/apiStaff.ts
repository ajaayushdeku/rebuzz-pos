import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffOrdersChart";
import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
import { authHeaders } from "../authServices/session";

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
  role: string;
  adminId: string;
  totalSales: number;
  totalRevenue: number;
  bills: RawBill[];
};

// ── Date helpers ──────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(
  range: string = "month",
  startDateOverride?: string,
  endDateOverride?: string,
): { startDate: string; endDate: string } {
  // If direct date overrides are provided, use them
  if (startDateOverride && endDateOverride) {
    return { startDate: startDateOverride, endDate: endDateOverride };
  }

  const today = new Date();
  const end = toDateStr(today);
  let start: Date;

  switch (range) {
    case "today":
    case "24h":
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      break;
    case "week": {
      // Sunday of current week → today
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate: toDateStr(start), endDate: end };
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

async function fetchAllEmployeeSales(
  range: string = "month",
  startDateOverride?: string,
  endDateOverride?: string,
): Promise<RawEmployee[]> {
  const { startDate, endDate } = getDateRange(
    range,
    startDateOverride,
    endDateOverride,
  );

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
  range: string = "month",
): Promise<RawEmployee | null> {
  const { startDate, endDate } = getDateRange(range);

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

export async function getStaffData(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffBoxProps[]> {
  try {
    const employees = await fetchAllEmployeeSales(range, startDate, endDate);
    if (employees.length === 0) return [];

    return employees
      .map((emp) => ({
        staffName: emp.name || emp._id,
        staffPosition: emp.role || "",
        ordersTaken: emp.totalSales ?? 0,
        amount: Math.round((emp.totalRevenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => a.staffName.localeCompare(b.staffName));
  } catch (err) {
    console.error("getStaffData error:", err);
    return [];
  }
}

// ── getStaffRevenue — revenue bar chart ───────────────────────────────────

export async function getStaffRevenue(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffRevenue[]> {
  try {
    const employees = await fetchAllEmployeeSales(range, startDate, endDate);
    if (employees.length === 0) return [];

    return employees
      .map((emp) => ({
        name: emp.name || emp._id,
        revenue: Math.round((emp.totalRevenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("getStaffRevenue error:", err);
    return [];
  }
}

// ── getStaffOrdersPerHour — hourly line chart ─────────────────────────────

export async function getStaffOrdersPerHour(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffHourlyData[]> {
  try {
    const employees = await fetchAllEmployeeSales(range, startDate, endDate);
    if (employees.length === 0) return [];

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
        if (slot && hourMap.has(slot)) {
          hourMap.set(slot, (hourMap.get(slot) ?? 0) + 1);
        }
      }

      staffHourMap.set(name, hourMap);
    }

    // Sort staff names alphabetically for consistent color mapping
    const sortedStaffNames = Array.from(staffHourMap.keys()).sort();

    // Convert to StaffHourlyData[]
    return HOUR_SLOTS.map((hour) => ({
      hour,
      staff: sortedStaffNames.map((name) => ({
        name,
        value: staffHourMap.get(name)?.get(hour) ?? 0,
      })),
    }));
  } catch (err) {
    console.error("getStaffOrdersPerHour error:", err);
    return [];
  }
}

// ── getShiftAnalysisData — shift breakdown table ──────────────────────────

export async function getShiftAnalysisData(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<Shift[]> {
  try {
    const employees = await fetchAllEmployeeSales(range, startDate, endDate);
    if (employees.length === 0) {
      return [
        {
          label: "Morning (6am–12pm)",
          orders: 0,
          revenue: 0,
          staff: 0,
          // avgTime: 0,
        },
        {
          label: "Afternoon (12pm–5pm)",
          orders: 0,
          revenue: 0,
          staff: 0,
          // avgTime: 0,
        },
        {
          label: "Evening (5pm–11pm)",
          orders: 0,
          revenue: 0,
          staff: 0,
          // avgTime: 0,
        },
      ];
    }

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
        // avgTime: 0, // not available from this API
      };
    });
  } catch (err) {
    console.error("getShiftAnalysisData error:", err);
    return [];
  }
}
