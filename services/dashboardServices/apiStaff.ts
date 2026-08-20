import { StaffRevenue } from "@/components/dashboardComponents/staffDash/RevenueStaffChart";
import { Shift } from "@/components/dashboardComponents/staffDash/ShiftAnalysisReport";
import { StaffHourlyData } from "@/components/dashboardComponents/staffDash/StaffSalesChart";
import { StaffBoxProps } from "@/components/dashboardComponents/staffDash/StaffStatBox";
import { formatHourLabel } from "@/utils/formatHourReportToday";
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
      // start = new Date(today);
      // start.setDate(today.getDate() - today.getDay());
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      break;
    }
    case "month":
      // start = new Date(today.getFullYear(), today.getMonth(), 1);
      start = new Date(today);
      start.setDate(today.getDate() - 29);
      break;
    case "threemonth": {
      start = new Date(today);
      start.setDate(today.getDate() - 89);
      break;
    }
    case "sixmonth": {
      start = new Date(today);
      start.setDate(today.getDate() - 179);
      break;
    }
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
  const hour = Number.isNaN(h) ? 0 : h;
  const minute = Number.isNaN(m) ? 0 : m;

  // paidAt with NON-ZERO milliseconds is already Nepal time; ".000" or no
  // fraction is UTC out of MongoDB, so convert (+5:45). Same rule as
  // formatHourlyData — the previous "h >= 12 means Nepal" heuristic
  // mis-bucketed every UTC afternoon bill.
  const fraction = timePart.match(/\.(\d+)/)?.[1];
  const hasSubSecond = fraction != null && Number(fraction) > 0;
  if (hasSubSecond) return hour;

  let nepalHour = hour + 5;
  if (minute + 45 >= 60) nepalHour += 1;
  return nepalHour % 24;
}

/** "HH:00" in Nepal time, for the full 24-hour clock. */
function getHourLabel(paidAt: string): string {
  return formatHourLabel(getNepalHour(paidAt));
}

// ── Core fetcher — salesByAllEmployee ────────────────────────────────────

/**
 * salesByAllEmployee reports sales against the employee name as it was when
 * the bill was paid, so an employee who has been renamed comes back as two
 * rows sharing one `_id` — one under the old name, one under the new. Merged
 * here rather than at each call site: unmerged they rendered as two separate
 * series in the charts, and `getStaffData` silently dropped one of them
 * (its Map keyed by `_id` kept only the last row it saw).
 */
function mergeEmployeesById(employees: RawEmployee[]): RawEmployee[] {
  const merged = new Map<string, RawEmployee>();

  for (const emp of employees) {
    const existing = merged.get(emp._id);
    if (!existing) {
      merged.set(emp._id, { ...emp, bills: [...(emp.bills ?? [])] });
      continue;
    }
    existing.totalSales = (existing.totalSales ?? 0) + (emp.totalSales ?? 0);
    existing.totalRevenue =
      (existing.totalRevenue ?? 0) + (emp.totalRevenue ?? 0);
    existing.bills.push(...(emp.bills ?? []));
  }

  return Array.from(merged.values());
}

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
    { headers: await authHeaders(), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`salesByAllEmployee failed: ${res.status}`);
  const json = await res.json();
  // Response shape: { status, data: { businessName, employeesData: [...] } }
  return mergeEmployeesById(json?.data?.employeesData ?? []);
}

// ── Core fetcher — salesByEmployee/:id ───────────────────────────────────

async function fetchEmployeeDetail(
  employeeId: string,
  range: string = "month",
): Promise<RawEmployee | null> {
  const { startDate, endDate } = getDateRange(range);

  const res = await fetch(
    `${BASE}/business/report/salesByEmployee/${employeeId}?startDate=${startDate}&endDate=${endDate}`,
    { headers: await authHeaders(), cache: "no-store" },
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
      cache: "no-store",
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

/**
 * `_id` → the employee's current name, from the live user records. The name on
 * a sales row is a snapshot from when the bill was paid, so it goes stale on
 * rename; this is what the charts label their series with.
 */
async function fetchEmployeeNameMap(): Promise<Map<string, string>> {
  const users = await fetchAllEmployees();
  return new Map(
    users.filter((u) => u?._id && u?.name).map((u) => [u._id, u.name]),
  );
}

// ── Core fetcher — all shifts ──────────────────────────────────────────

export async function fetchAllShifts(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<RawShift[]> {
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
      cache: "no-store",
    },
  );
  // A real HTTP failure is an error — let it surface (not "no data").
  if (!res.ok) throw new Error(`fetchAllShifts failed: ${res.status}`);

  const json = await res.json();

  // Backend returns { message: "No shifts found!" } when empty — genuine empty.
  if (!json?.data || !Array.isArray(json.data)) return [];

  return json.data;
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
      cache: "no-store",
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
      // Shift data is supplementary here (avg time) — degrade to [] on failure
      // so a shift outage doesn't blank out the stat boxes.
      fetchAllShifts(range, dateRange.startDate, dateRange.endDate).catch(
        () => [],
      ),
      fetchAllTickets(range, startDate, endDate),
    ]);

    // fetchAllEmployees already unwraps both response shapes and returns [].
    const allUsers: RawUser[] = allUsersRaw;

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
      ([id, identity]) => {
        const sales = salesMap.get(id);
        const salesFromApi = sales?.totalSales ?? 0;
        const ticketCount = ticketCountMap.get(id) ?? 0;
        const resolvedOrders = Math.max(salesFromApi, ticketCount);

        return {
          staffId: id,
          staffName: identity.name,
          staffPosition: identity.role,
          salesTaken: salesFromApi,
          ordersTaken: resolvedOrders,
          amount: Math.round((sales?.totalRevenue ?? 0) * 100) / 100,
          avgTime: avgTimeMap.get(id) ?? "—",
        };
      },
    );

    return staffList.sort((a, b) => b.amount - a.amount);
  } catch (err) {
    console.error("getStaffData error:", err);
    throw err;
  }
}
// ── getStaffRevenue — revenue bar chart ───────────────────────────────────

export async function getStaffRevenue(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffRevenue[]> {
  try {
    const [employees, nameMap] = await Promise.all([
      fetchAllEmployeeSales(range, startDate, endDate),
      fetchEmployeeNameMap(),
    ]);
    if (employees.length === 0) return [];

    return employees
      .map((emp) => ({
        // Current name first — the name on the sales row is whatever it was
        // when the bill was paid.
        name: nameMap.get(emp._id) || emp.name || emp._id,
        revenue: Math.round((emp.totalRevenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("getStaffRevenue error:", err);
    throw err;
  }
}

// ── getStaffSalesPerHour — hourly line chart ─────────────────────────────

export async function getStaffSalesPerHour(
  range: string = "month",
  startDate?: string,
  endDate?: string,
): Promise<StaffHourlyData[]> {
  try {
    const [employees, nameMap] = await Promise.all([
      fetchAllEmployeeSales(range, startDate, endDate),
      fetchEmployeeNameMap(),
    ]);
    if (employees.length === 0) return [];

    // The full clock — the chart filters it down to a range client-side, the
    // same way the hourly sales trend does.
    const HOUR_SLOTS = Array.from({ length: 24 }, (_, h) => formatHourLabel(h));

    // Build map: employeeName → hour → count
    const staffHourMap = new Map<string, Map<string, number>>();

    for (const emp of employees) {
      // Current name first, same as the revenue chart.
      const name = nameMap.get(emp._id) || emp.name || emp._id;
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
    throw err;
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
    throw err;
  }
}
