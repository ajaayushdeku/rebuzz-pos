import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffSalesChart";
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

type RawShift = {
  shiftId: string;
  employeeId: string;
  employeeName: string;
  openingTime: string;
  closingTime: string;
  totalHours: string; // "HH:MM:SS"
  totalSale: number;
  openingCash: number;
  closingCash: number;
};

type AllShiftsResponse = {
  status: string;
  data: RawShift[];
};

type RawUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

// ── Ticket API response types ──────────────────────────────────────────

type RawTicket = {
  _id: string;
  ticketTakenBy: string;
  paidStatus: string;
  grandTotal: number;
  invoice: number;
};

type TicketsResponse = {
  status: string;
  data: {
    allTickets: RawTicket[];
  };
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

// ── Core fetcher — all employees from users/roles/employee ────────────

async function fetchAllEmployees(): Promise<RawUser[]> {
  try {
    const res = await fetch(`${BASE}/business/users/roles/employee`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`fetchAllEmployees failed: ${res.status}`);
    const json = await res.json();

    // Log the raw response to confirm the actual shape
    // console.log("fetchAllEmployees raw:", JSON.stringify(json?.data));

    // Handle both { data: [...] } and { data: { users: [...] } }
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.data?.users)) return json.data.users;

    return [];
  } catch (err) {
    console.error("fetchAllEmployees error:", err);
    return [];
  }
}

// ── Core fetcher — all shifts ──────────────────────────────────────────

export async function fetchAllShifts(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<RawShift[]> {
  try {
    // Resolve the date range from preset or custom dates
    const { startDate: from, endDate: to } = getDateRange(
      range,
      startDate,
      endDate,
    );

    const params = new URLSearchParams();
    params.set("limit", "15");
    if (from) params.set("from_date", from);
    if (to) params.set("to_date", to);

    const res = await fetch(
      `${BASE}/business/shift/allshifts?${params.toString()}`,
      {
        headers: await authHeaders(),
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return [];

    const json = await res.json();

    // Backend returns { message: "No shifts found!" } when empty
    // Guard against any non-array shape
    if (!json?.data || !Array.isArray(json.data)) return [];

    return json.data;
  } catch (err) {
    console.error("fetchAllShifts error:", err);
    return [];
  }
}

// ── Core fetcher — tickets (for ticketTakenBy-based sales count) ────────

async function fetchAllTickets(
  range: string = "month",
  startDateOverride?: string,
  endDateOverride?: string,
): Promise<RawTicket[]> {
  try {
    const { startDate, endDate } = getDateRange(
      range,
      startDateOverride,
      endDateOverride,
    );

    const params = new URLSearchParams();
    params.set("from_date", startDate);
    params.set("to_date", endDate);
    params.set("limit", "500");

    const res = await fetch(`${BASE}/business/ticket?${params.toString()}`, {
      headers: await authHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const json: TicketsResponse = await res.json();
    return json?.data?.allTickets ?? [];
  } catch (err) {
    console.error("fetchAllTickets error:", err);
    return [];
  }
}

// ── Helper: parse "HH:MM:SS" to total minutes ─────────────────────────

function parseHoursToMinutes(totalHours: string): number {
  if (!totalHours) return 0;
  const parts = totalHours.split(":").map(Number);
  if (parts.length !== 3) return 0;
  return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
}

// ── getStaffData — stat boxes ─────────────────────────────────────────────
export async function getStaffData(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffBoxProps[]> {
  try {
    const dateRange = getDateRange(range, startDate, endDate);

    const [employees, allUsersRaw, allShiftsRaw, tickets] = await Promise.all([
      fetchAllEmployeeSales(range, startDate, endDate),
      fetchAllEmployees(),
      fetchAllShifts(range, dateRange.startDate, dateRange.endDate),
      fetchAllTickets(range, startDate, endDate),
    ]);

    const allUsers: RawUser[] = Array.isArray(allUsersRaw)
      ? allUsersRaw
      : Array.isArray((allUsersRaw as any)?.users)
        ? (allUsersRaw as any).users
        : [];

    const allShifts: RawShift[] = Array.isArray(allShiftsRaw)
      ? allShiftsRaw
      : [];

    // ── Registered employee IDs — the source of truth for "is staff" ──────
    const registeredEmployeeIds = new Set(allUsers.map((u) => u._id));

    // ── Build sales map: employeeId → RawEmployee ─────────────────────────
    const salesMap = new Map<string, RawEmployee>();
    for (const emp of employees) {
      salesMap.set(emp._id, emp);
    }

    // ── IDs that have actual sales data (revenue or sales > 0) ───────────
    const hasSalesData = (id: string): boolean => {
      const s = salesMap.get(id);
      if (!s) return false;
      return (s.totalSales ?? 0) > 0 || (s.totalRevenue ?? 0) > 0;
    };

    // ── Build ticket count map ────────────────────────────────────────────
    const ticketCountMap = new Map<string, number>();
    for (const ticket of tickets) {
      const takerId = ticket.ticketTakenBy;
      if (takerId) {
        ticketCountMap.set(takerId, (ticketCountMap.get(takerId) ?? 0) + 1);
      }
    }

    // ── Build avgTime map ─────────────────────────────────────────────────
    const shiftGroups = new Map<string, number[]>();
    for (const shift of allShifts) {
      const minutes = parseHoursToMinutes(shift.totalHours);
      if (!shiftGroups.has(shift.employeeId)) {
        shiftGroups.set(shift.employeeId, []);
      }
      shiftGroups.get(shift.employeeId)!.push(minutes);
    }

    const avgTimeMap = new Map<string, string>();
    for (const [empId, minutesArr] of shiftGroups.entries()) {
      if (minutesArr.length === 0) continue;
      const avgMin = Math.round(
        minutesArr.reduce((sum, m) => sum + m, 0) / minutesArr.length,
      );
      const hrs = Math.floor(avgMin / 60);
      const mins = avgMin % 60;
      avgTimeMap.set(empId, hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
    }

    // ── Build identity map ────────────────────────────────────────────────

    const identityMap = new Map<string, { name: string; role: string }>();

    // 1. All registered employees — always included regardless of sales
    for (const user of allUsers) {
      identityMap.set(user._id, {
        name: user.name || user._id,
        role: user.role || "",
      });
    }

    // 2. Non-registered users from salesByAllEmployee (owners/admins)
    //    — ONLY if they have actual sales data
    for (const emp of employees) {
      if (registeredEmployeeIds.has(emp._id)) continue;
      if (!hasSalesData(emp._id)) continue; // ← exclude if no real sales

      identityMap.set(emp._id, {
        name: emp.name || emp._id,
        role: emp.role || "Owner",
      });
    }

    // 3. Non-registered users from shifts
    //    — ONLY if they also have actual sales data
    for (const shift of allShifts) {
      if (identityMap.has(shift.employeeId)) continue;
      if (!hasSalesData(shift.employeeId)) continue; // ← exclude if no real sales

      identityMap.set(shift.employeeId, {
        name: shift.employeeName || shift.employeeId,
        role: "Owner",
      });
    }

    // 4. Non-registered users from tickets
    //    — ONLY if they also have actual sales data
    for (const ticket of tickets) {
      if (!ticket.ticketTakenBy) continue;
      if (identityMap.has(ticket.ticketTakenBy)) continue;
      if (!hasSalesData(ticket.ticketTakenBy)) continue; // ← exclude if no real sales

      identityMap.set(ticket.ticketTakenBy, {
        name: ticket.ticketTakenBy,
        role: "Staff",
      });
    }

    // ── Merge everything ──────────────────────────────────────────────────
    const staffList: StaffBoxProps[] = Array.from(identityMap.entries()).map(
      ([id, identity], idx) => {
        const sales = salesMap.get(id);
        const salesFromApi = sales?.totalSales ?? 0;
        const ticketCount = ticketCountMap.get(id) ?? 0;

        // For registered employees: use max of both sources
        // For non-registered (owners): use only sales API data — no ticket inflation
        const resolvedOrders = registeredEmployeeIds.has(id)
          ? Math.max(salesFromApi, ticketCount)
          : salesFromApi;

        return {
          staffId: id,
          staffName: identity.name,
          staffPosition: identity.role,
          salesTaken: salesFromApi,
          ordersTaken: resolvedOrders,
          amount: Math.round((sales?.totalRevenue ?? 0) * 100) / 100,
          avgTime: avgTimeMap.get(id) ?? "—",
          colorIndex: idx,
        };
      },
    );

    return staffList.sort((a, b) => b.amount - a.amount);
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

// ── getStaffSalesPerHour — hourly line chart ─────────────────────────────

export async function getStaffSalesPerHour(
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
    console.error("getStaffSalesPerHour error:", err);
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
        },
        {
          label: "Afternoon (12pm–5pm)",
          orders: 0,
          revenue: 0,
          staff: 0,
        },
        {
          label: "Evening (5pm–11pm)",
          orders: 0,
          revenue: 0,
          staff: 0,
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
      };
    });
  } catch (err) {
    console.error("getShiftAnalysisData error:", err);
    return [];
  }
}
