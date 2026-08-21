import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { mergeEmployeeSalesById } from "@/lib/staff/employeeSales";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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
  totalSales: number;
  totalRevenue: number;
  totalRefunds?: number;
  refundedAmount?: number;
  bills: RawBill[];
};

interface SalesResponse {
  status: string;
  data: {
    businessName?: string;
    employeesData: RawEmployee[];
  };
}

/**
 * `/business/ticket/bills` rows. Unlike the bills embedded in
 * salesByAllEmployee — which carry only `orderId`, the ticket, not the
 * customer — these carry both the customer and the employee who rang them up.
 */
interface BillListRecord {
  invoiceNo?: number;
  generatedById?: string | null;
  customerId?: string | null;
}

/** `/business/ticket/{invoiceNo}/bill` — the per-invoice fallback. */
interface BillDetailResponse {
  data?: {
    bill?: {
      customerId?: string | null;
      customer?: { _id?: string } | null;
    } | null;
  } | null;
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

/**
 * Team figures behind the Performance Radar's benchmarks.
 *
 * Both a sum and a per-employee maximum are returned, because the radar uses
 * them for different things: totals for context, and the single best
 * performer as the 100 mark for the volume axes. Benchmarking one person
 * against the team *sum* — which is what the radar used to do — caps their
 * score at roughly 100/N and makes the chart shrink whenever someone is
 * hired, so the maxima are the numbers that matter here.
 */
interface AggregatedMetrics {
  totalRevenue: number;
  totalSales: number;
  totalOrders: number;
  totalBills: number;
  maxEmployeeRevenue: number;
  maxEmployeeSales: number;
  maxEmployeeBills: number;
  maxEmployeeOrders: number;
  maxEmployeeCustomers: number;
  /** Employees with any activity in the range. */
  activeEmployeeCount: number;
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
    // One salesByAllEmployee call, not two — the previous version fetched the
    // same URL twice (once for revenue, once to count bills off the identical
    // payload) and threw half of each response away.
    const [salesRes, ticketsRes, billsList] = await Promise.all([
      fetchSalesData(token, startDate, endDate),
      fetchTicketsData(token, startDate, endDate),
      fetchBillsList(token, startDate, endDate),
    ]);

    // Merge first. A renamed employee comes back as two rows sharing one
    // `_id`, and without merging they inflate activeEmployeeCount and split
    // one person's revenue across two entries — which understates the
    // per-employee maximum the radar benchmarks against.
    const employeesData = mergeEmployeeSalesById(
      salesRes?.data?.employeesData ?? [],
    );

    let totalRevenue = 0;
    let totalSales = 0;
    let totalBills = 0;

    let maxEmployeeRevenue = 0;
    let maxEmployeeSales = 0;
    let maxEmployeeBills = 0;
    let activeEmployeeCount = 0;

    for (const employee of employeesData) {
      const revenue = employee.totalRevenue ?? 0;
      const sales = employee.totalSales ?? 0;
      const bills = employee.bills ?? [];

      totalRevenue += revenue;
      totalSales += sales;
      totalBills += bills.length;

      maxEmployeeRevenue = Math.max(maxEmployeeRevenue, revenue);
      maxEmployeeSales = Math.max(maxEmployeeSales, sales);
      maxEmployeeBills = Math.max(maxEmployeeBills, bills.length);

      if (revenue > 0 || sales > 0 || bills.length > 0) {
        activeEmployeeCount += 1;
      }
    }

    // ── Customers served, per employee ────────────────────────────────────
    // salesByAllEmployee's bills only expose `orderId`, which identifies the
    // ticket, not the buyer — counting those counted bills, not customers.
    //
    // `/business/ticket/bills` carries `customerId` *and* `generatedById`, so
    // one call answers this for every employee at once. That also matches how
    // /api/staff/bills/[employeeId] derives the single employee's
    // `customerCount`, which is the numerator this benchmark divides — the two
    // have to come from the same source or the ratio is meaningless. Grouping
    // by `generatedById` is id-based, so a renamed employee cannot split.
    const customersByEmployee = new Map<string, Set<string>>();
    for (const bill of billsList) {
      const employeeId = bill.generatedById;
      const customerId = bill.customerId;
      if (!employeeId || !customerId) continue;

      let seen = customersByEmployee.get(employeeId);
      if (!seen) {
        seen = new Set<string>();
        customersByEmployee.set(employeeId, seen);
      }
      seen.add(customerId);
    }

    // Fallback: if the list came back without any customer ids, resolve them
    // per invoice from /business/ticket/{invoiceNo}/bill. Far more requests,
    // so it only runs when the cheap path produced nothing.
    if (customersByEmployee.size === 0 && employeesData.length > 0) {
      await resolveCustomersPerInvoice(
        token,
        employeesData,
        customersByEmployee,
      );
    }

    const maxEmployeeCustomers = Math.max(
      0,
      ...Array.from(customersByEmployee.values(), (set) => set.size),
    );

    // Tickets carry the employee who took them, so orders-per-employee is a
    // group-by rather than a field on the sales payload.
    const allTickets = ticketsRes?.data?.allTickets ?? [];
    const ordersByEmployee = new Map<string, number>();
    for (const ticket of allTickets) {
      const takenBy = ticket.ticketTakenBy;
      if (!takenBy) continue;
      ordersByEmployee.set(takenBy, (ordersByEmployee.get(takenBy) ?? 0) + 1);
    }
    const maxEmployeeOrders = Math.max(0, ...ordersByEmployee.values());

    const payload: AggregatedMetrics = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      totalOrders: allTickets.length,
      totalBills,
      maxEmployeeRevenue: Math.round(maxEmployeeRevenue * 100) / 100,
      maxEmployeeSales,
      maxEmployeeBills,
      maxEmployeeOrders,
      maxEmployeeCustomers,
      activeEmployeeCount,
    };

    return NextResponse.json(payload, { status: 200 });
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
      cache: "no-store",
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

/** Bounded so a wide date range cannot fire hundreds of parallel requests. */
const INVOICE_LOOKUP_CONCURRENCY = 8;

/** Ceiling on the fallback's per-invoice lookups. */
const INVOICE_LOOKUP_LIMIT = 400;

/**
 * Fallback path for the customers-served benchmark: fetch each employee's
 * bills one invoice at a time and read the customer off the detail payload.
 * Mutates `target` in place, keyed by employee `_id`.
 */
async function resolveCustomersPerInvoice(
  token: string,
  employeesData: RawEmployee[],
  target: Map<string, Set<string>>,
): Promise<void> {
  const jobs: Array<{ employeeId: string; invoiceNo: number }> = [];
  for (const employee of employeesData) {
    for (const bill of employee.bills ?? []) {
      if (bill.invoiceNo == null) continue;
      jobs.push({ employeeId: employee._id, invoiceNo: bill.invoiceNo });
    }
  }

  if (jobs.length > INVOICE_LOOKUP_LIMIT) {
    console.warn(
      `aggregated-metrics: customers-served fallback capped at ${INVOICE_LOOKUP_LIMIT} of ${jobs.length} invoices`,
    );
    jobs.length = INVOICE_LOOKUP_LIMIT;
  }

  let cursor = 0;
  const worker = async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const customerId = await fetchBillCustomerId(token, job.invoiceNo);
      if (!customerId) continue;

      let seen = target.get(job.employeeId);
      if (!seen) {
        seen = new Set<string>();
        target.set(job.employeeId, seen);
      }
      seen.add(customerId);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(INVOICE_LOOKUP_CONCURRENCY, jobs.length) },
      worker,
    ),
  );
}

async function fetchBillCustomerId(
  token: string,
  invoiceNo: number,
): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/business/ticket/${invoiceNo}/bill`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json: BillDetailResponse = await res.json();
    const bill = json?.data?.bill;
    return bill?.customerId ?? bill?.customer?._id ?? null;
  } catch {
    return null;
  }
}

async function fetchBillsList(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<BillListRecord[]> {
  try {
    let url = `${BASE}/business/ticket/bills?limit=1000`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch bills list:", res.status);
      return [];
    }

    const json = await res.json();
    // Same three shapes the other bills consumers defend against.
    return json?.data?.bill ?? json?.bill ?? json?.data ?? [];
  } catch (error) {
    console.error("Error fetching bills list:", error);
    return [];
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
      cache: "no-store",
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
