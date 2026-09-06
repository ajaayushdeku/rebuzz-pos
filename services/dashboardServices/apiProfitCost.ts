import { BudgetItem } from "@/components/dashboardComponents/profitcostDash/budget-column";
import { ExpenseCategory } from "@/components/dashboardComponents/profitcostDash/ExpenseByCategoryChart";
import { ProfitTrendData } from "@/components/dashboardComponents/profitcostDash/GrossProfitTrendChart";
import { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";
import { RefundReason } from "@/components/dashboardComponents/profitcostDash/refund-analysis-column";
import { ProfitCostApiResponse } from "@/lib/dashboardstats";
import {
  mockBudgetData,
  mockCostStats,
  mockExpenseByCategoryData,
  mockGrossProfitTrendData,
  // mockProfitPerProduct,
  // mockProfitStats,
  // mockRefundReason,
} from "@/lib/mockData/mock-profitcostdata";
import { authHeaders } from "../authServices/session";
import axios from "axios";
import { RawBill } from "@/lib/types/bill";
import { RawReport, RawReportResponse } from "@/lib/types/report";
import { DayTimeProfitData } from "@/components/dashboardComponents/profitcostDash/DayTimeProfitHeatmap";
import { formatDayTimeProfitAverages } from "@/utils/formatHourReportToday";
import { classifyExpenses } from "@/lib/costClassification";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface ProfitCostBill {
  isRefunded?: boolean;
}

interface ProfitCostSalesItem {
  category: string;
  costPrice: number;
  count: number;
  itemDiscount: number;
  itemName: string;
  netProfit: number;
  paymentMethod: string;
  price: number;
  totalRevenue: number;
}

// interface SalesByItemResponse {
//   data?: ProfitCostSalesItem[];
// }

// interface BillsResponseData {
//   bill?: ProfitCostBill[];
// }

// interface BillsResponse {
//   data?: BillsResponseData;
// }

export const getProfitStats = async (
  startDate?: string,
  endDate?: string,
): Promise<ProfitCostApiResponse> => {
  const today: Date = new Date();
  const defaultStart: Date = new Date(today.getFullYear(), 0, 1); // Start of current year (Jan 1)

  const start: string = startDate ?? defaultStart.toISOString().split("T")[0];
  const end: string = endDate ?? today.toISOString().split("T")[0];

  // Params for the api fetch for stats data
  const params: URLSearchParams = new URLSearchParams({
    startDate: start,
    endDate: end,
    limit: "25",
  });

  const [reportRes, billsRes] = await Promise.all([
    axios.get(`${BASE}/business/report?${params}`, {
      headers: await authHeaders(),
    }),
    axios.get(
      `${BASE}/business/ticket/bills?startDate=${start}&endDate=${end}&limit=25`,
      {
        headers: await authHeaders(),
      },
    ),
  ]);

  const data: RawReportResponse = reportRes.data;

  // Gross Revenue = totalRevenue from report API
  const grossRevenue: number = data.data.report.totalRevenue ?? 0;

  // Total Refunds = count of bills where isRefunded is true
  const allBills: ProfitCostBill[] = billsRes.data?.data?.bill ?? [];
  const totalRefunds: number = allBills.filter(
    (bill: ProfitCostBill) => bill.isRefunded === true,
  ).length;

  // Net Profit = profit from report API
  const netProfit: number = data.data.report.profit ?? 0;

  // Avg Margin = (netProfit / grossRevenue) * 100 as a percentage
  const avgMargin: number =
    grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    grossRevenue: { value: parseFloat(grossRevenue.toFixed(2)) },
    netProfit: { value: parseFloat(netProfit.toFixed(2)) },
    totalRefunds: { value: totalRefunds },
    avgMargin: { value: parseFloat(avgMargin.toFixed(2)) },
  };
};

export async function getGrossProfitTrendData(): Promise<ProfitTrendData[]> {
  const res = await fetch("/api/profit-trend", {
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn("Failed to fetch profit trend data");
    return [];
  }

  const json = await res.json();
  return json.data ?? [];
}

export async function getProfitPerProduct(): Promise<Product[]> {
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), 0, 1); // Start of current year (Jan 1)

  const start = defaultStart.toISOString().split("T")[0];
  const end = today.toISOString().split("T")[0];

  const res = await axios.get(
    `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
    { headers: await authHeaders() },
  );

  const rawItems: {
    itemName: string;
    totalRevenue: number;
    count: number;
    profit?: number;
    costPrice?: number;
  }[] = res.data?.data ?? [];

  return rawItems.map((item) => {
    const revenue = item.totalRevenue ?? 0;
    const cost = (item.costPrice ?? 0) * (item.count ?? 0);
    const profit = item.profit ?? revenue - cost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      name: item.itemName,
      revenue,
      cogs: cost,
      profit,
      margin,
    };
  });
}

export async function getRefundReason(): Promise<RefundReason[]> {
  const res = await axios.get(`${BASE}/business/ticket/bills?limit=25`, {
    headers: await authHeaders(),
  });

  const bills: {
    ticketName: string;
    grandTotal: number;
    isRefunded: boolean;
    updatedAt: string;
  }[] = res.data?.data?.bill ?? [];

  return bills
    .filter((bill) => bill.isRefunded === true)
    .map((bill) => ({
      name: bill.ticketName || "Unknown",
      loss: bill.grandTotal ?? 0,
      updatedAt: new Date(bill?.updatedAt).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
}

export interface RefundBillWithTax {
  billNumber: string;
  refundedAmount: number;
  taxRefunded: number;
  reason: string;
  date: string;
}

export async function getRefundedBillsWithTax(
  startDate?: string,
  endDate?: string,
): Promise<RefundBillWithTax[]> {
  const today = new Date();
  const defaultEnd = today.toISOString().split("T")[0];
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const start = startDate ?? defaultStart;
  const end = endDate ?? defaultEnd;

  const res = await axios.get(
    `${BASE}/business/ticket/bills?startDate=${start}&endDate=${end}&limit=500`,
    {
      headers: await authHeaders(),
    },
  );

  const bills: RawBill[] = res.data?.data?.bill ?? [];

  return bills
    .filter((bill) => bill.isRefunded === true)
    .map((bill) => ({
      billNumber: `INV-${bill.invoiceNo}`,
      refundedAmount: bill.grandTotal ?? 0,
      taxRefunded: bill.taxamt ?? 0,
      reason: bill.ticketName || "Refund",
      date: new Date(bill.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getBudgetData(): Promise<BudgetItem[]> {
  return mockBudgetData;
}

export async function getExpenseStats(): Promise<ProfitCostApiResponse> {
  return mockCostStats;
}

export async function getExpenseByCategoryData(): Promise<ExpenseCategory[]> {
  return mockExpenseByCategoryData;
}

// ── Day × Time Profit Heatmap ────────────────────────────────────────────────
// Average profit per weekday × hour over the page's date range. Mirrors the
// Peak Hours Analysis architecture: fetch the report, then aggregate bills.
export const getDayTimeProfitData = async (
  startDate: string,
  endDate: string,
): Promise<DayTimeProfitData[]> => {
  const res = await axios.get(
    `${BASE}/business/report?startDate=${startDate}&endDate=${endDate}`,
    { headers: await authHeaders() },
  );

  const data: RawReportResponse = res.data;
  const bills: RawBill[] = data?.data?.report?.allBills ?? [];

  // Profit per bill = grandTotal - costPrice (refunded bills are ignored).
  return formatDayTimeProfitAverages(bills);
};

// ── Unit Economics ───────────────────────────────────────────────────────────
// The per-order and per-item averages behind the headline totals, over the
// page's date range.

export interface UnitEconomicsData {
  /**
   * Net profit divided by units sold.
   *
   * Divided by units, not orders: the card reads "Avg profit per item sale",
   * and profit ÷ orders under that label would be a different figure — larger
   * by whatever the average order holds — wearing the wrong name. Pairs with
   * avgCostPerItem, which uses the same denominator.
   */
  avgProfitPerItem: number;
  /** Revenue divided by the number of orders — the average bill. */
  avgOrderSize: number;
  /** Units sold divided by the number of orders — how full an order is. */
  avgItemsPerOrder: number;
  /** Cost of goods divided by units sold. */
  avgCostPerItem: number;
  /**
   * Net profit per hour of recorded staff time, or null when no shift was
   * recorded in the range. Null rather than 0: no shifts means the figure is
   * unknown, and a "Rs 0.00" reads as a measured result.
   */
  profitPerLaborHour: number | null;
}

type UnitEconomicsSalesItem = {
  count?: number;
  costPrice?: number;
  netProfit?: number;
};

type UnitEconomicsShift = {
  totalHours?: string; // "HH:MM:SS"
};

/** "HH:MM:SS" → hours. Malformed or missing values contribute nothing. */
function shiftHours(totalHours?: string): number {
  if (!totalHours) return 0;
  const parts = totalHours.split(":").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return 0;
  return parts[0] + parts[1] / 60 + parts[2] / 3600;
}

export async function getUnitEconomics(
  startDate?: string,
  endDate?: string,
): Promise<UnitEconomicsData> {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 30);

  const start = startDate ?? defaultStart.toISOString().split("T")[0];
  const end = endDate ?? today.toISOString().split("T")[0];

  const headers = await authHeaders();

  // Shifts are supplementary — only the labour-hour metric depends on them, so
  // a shift outage should blank that one card rather than fail the whole panel.
  // The limit is raised well above fetchAllShifts' 15: that cap is fine for the
  // staff table's recent-shift list, but truncating shifts here would divide
  // the period's profit by a fraction of the hours actually worked and report a
  // figure several times too high.
  const [reportRes, salesRes, shiftsRes] = await Promise.allSettled([
    axios.get(`${BASE}/business/report?startDate=${start}&endDate=${end}`, {
      headers,
    }),
    axios.get(
      `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
      { headers },
    ),
    axios.get(
      `${BASE}/business/shift/allshifts?limit=500&from_date=${start}&to_date=${end}`,
      { headers },
    ),
  ]);

  const report: RawReport | undefined =
    reportRes.status === "fulfilled"
      ? (reportRes.value.data as RawReportResponse)?.data?.report
      : undefined;

  const items: UnitEconomicsSalesItem[] =
    salesRes.status === "fulfilled" ? (salesRes.value.data?.data ?? []) : [];

  const shifts: UnitEconomicsShift[] =
    shiftsRes.status === "fulfilled"
      ? Array.isArray(shiftsRes.value.data?.data)
        ? shiftsRes.value.data.data
        : []
      : [];

  // `totalSales` on the report is the ticket count; `count` on a sales item is
  // units of that item. The two are deliberately not interchangeable here.
  const tickets = report?.totalSales ?? 0;
  const revenue = report?.totalRevenue ?? 0;

  const units = items.reduce((sum, i) => sum + (i.count ?? 0), 0);

  // Per-unit cost × units, matching how getProfitPerProduct derives COGS.
  const cost = items.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * (i.count ?? 0),
    0,
  );

  // Summed per item rather than read from report.profit, which apiOverview
  // documents as reporting an incorrect total.
  const netProfit = items.reduce((sum, i) => sum + (i.netProfit ?? 0), 0);

  const laborHours = shifts.reduce(
    (sum, s) => sum + shiftHours(s.totalHours),
    0,
  );

  // Every divisor is guarded: an empty range must read as 0, never NaN or ∞.
  return {
    avgProfitPerItem: units > 0 ? netProfit / units : 0,
    avgOrderSize: tickets > 0 ? revenue / tickets : 0,
    avgItemsPerOrder: tickets > 0 ? units / tickets : 0,
    avgCostPerItem: units > 0 ? cost / units : 0,
    profitPerLaborHour: laborHours > 0 ? netProfit / laborHours : null,
  };
}

// ── Break-even & Margin of Safety ────────────────────────────────────────────
// Break-even here is what the month actually cost — everything that had to be
// paid for, fixed and variable together:
//
//   break-even       = fixed costs + variable costs
//   margin of safety = (revenue − break-even) / revenue
//
// This is the realised break-even rather than the textbook projected one
// (fixed ÷ contribution margin ratio). The two agree exactly at the crossover
// — they are equal precisely when revenue equals total costs — but they answer
// different questions away from it: the projection models the revenue a given
// cost structure would need, while this states the bill the month actually
// ran up. For a POS dashboard reporting a month that has already happened, the
// second is the more direct reading, and it needs no assumption that variable
// costs scale linearly.
//
// Variable cost is COGS — the cost of goods actually sold — plus any expense
// the classifier did not recognise as fixed. Fixed costs come from recorded
// expenses, classified by lib/costClassification.

export interface BreakEvenData {
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  /**
   * Fixed + variable costs — the revenue the month needed to pay for itself.
   * Null when no costs were recorded at all.
   */
  breakEvenPoint: number | null;
  /** Share of each rupee of revenue left after variable cost, 0–1. */
  contributionMarginRatio: number;
  /**
   * Expense purposes counted as variable because no fixed-cost rule matched.
   * An unrecognised fixed cost drags the break-even point down, so this is
   * surfaced rather than swallowed — see classifyExpenses.
   */
  unclassifiedPurposes: string[];
  /**
   * True when the month is still running, so revenue is month-to-date while
   * fixed costs are the full month's. The card says so rather than letting an
   * early-month shortfall read as a real one.
   */
  isPartialMonth: boolean;
  /** Days of the month traded so far, or null for a completed month. */
  daysElapsed: number | null;
  daysInMonth: number;
}

type BreakEvenTransaction = {
  kind?: string;
  purposeId?: string;
  amount?: number;
  date?: string;
};

type BreakEvenPurpose = {
  _id: string;
  name?: string;
  icon?: string;
};

/** Zero-padded month, for building YYYY-MM-DD strings. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Break-even for one calendar month.
 *
 * Scoped to a month rather than the page's global range on purpose. Fixed
 * costs are a period commitment — September's rent is owed on the 6th just as
 * much as on the 30th — so charging a rolling 30-day window with whichever
 * expenses happen to fall inside it made the answer depend on which day of the
 * month someone dated the rent. A calendar month is the period those costs are
 * actually incurred over, and it is also the only shape the expense API
 * accepts.
 */
export async function getBreakEvenData(
  month: number,
  year: number,
): Promise<BreakEvenData> {
  const mm = pad2(month);
  const monthStart = `${year}-${mm}-01`;
  // Day 0 of the next month is the last day of this one.
  const monthEnd = `${year}-${mm}-${pad2(new Date(year, month, 0).getDate())}`;

  const now = new Date();
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  // Sales can only be read up to today; the report API has no future to report
  // on. Expenses still use the whole month — see the note above.
  const salesEnd = isCurrentMonth
    ? `${year}-${mm}-${pad2(now.getDate())}`
    : monthEnd;

  const start = monthStart;
  const end = salesEnd;

  const headers = await authHeaders();
  const months = [{ month, year }];

  const [reportRes, salesRes, purposeRes, ...expenseResults] =
    await Promise.allSettled([
      axios.get(`${BASE}/business/report?startDate=${start}&endDate=${end}`, {
        headers,
      }),
      axios.get(
        `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
        { headers },
      ),
      axios.get(`${BASE}/business/expense/purpose/getall`, { headers }),
      ...months.map(({ month, year }) =>
        axios.get(
          `${BASE}/business/expense/getall?month=${month}&year=${year}`,
          { headers },
        ),
      ),
    ]);

  const report: RawReport | undefined =
    reportRes.status === "fulfilled"
      ? (reportRes.value.data as RawReportResponse)?.data?.report
      : undefined;

  const revenue = report?.totalRevenue ?? 0;

  // Variable cost = COGS, per-unit cost × units, as getProfitPerProduct derives it.
  const items: UnitEconomicsSalesItem[] =
    salesRes.status === "fulfilled" ? (salesRes.value.data?.data ?? []) : [];
  const cogs = items.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * (i.count ?? 0),
    0,
  );

  const purposes: BreakEvenPurpose[] =
    purposeRes.status === "fulfilled"
      ? (purposeRes.value.data?.data?.purposes ?? [])
      : [];
  const purposeMap = new Map(purposes.map((p) => [p._id, p]));

  // Whole months came back; keep only the transactions inside the range. Dates
  // are compared as YYYY-MM-DD strings, which sort correctly and avoid pulling
  // the browser's timezone into a date-only comparison.
  const transactions: BreakEvenTransaction[] = expenseResults.flatMap((r) =>
    r.status === "fulfilled" ? (r.value.data?.data?.transactions ?? []) : [],
  );

  // Whole month, deliberately wider than the sales window: a fixed cost dated
  // the 20th is owed even when only the first 6 days have been traded.
  const inRange = transactions.filter((t) => {
    if (t.kind !== "expense") return false;
    const day = String(t.date ?? "").slice(0, 10);
    return day >= monthStart && day <= monthEnd;
  });

  const {
    fixed,
    variable: variableExpenses,
    unclassified,
  } = classifyExpenses(
    inRange.map((t) => {
      const purpose = purposeMap.get(String(t.purposeId));
      return {
        amount: Number(t.amount) || 0,
        name: purpose?.name ?? "",
        icon: purpose?.icon ?? "",
      };
    }),
  );

  // Variable expenses sit alongside COGS: both scale with trading.
  const variableCosts = cogs + variableExpenses;

  // Still reported, though break-even no longer divides by it: it is the
  // clearest single measure of whether each sale carries its own weight.
  const contributionMarginRatio =
    revenue > 0 ? (revenue - variableCosts) / revenue : 0;

  // Null only when nothing was spent at all: a break-even of zero is trivially
  // met and tells the reader nothing, so the card shows an empty state instead.
  const totalCosts = fixed + variableCosts;
  const breakEvenPoint = totalCosts > 0 ? totalCosts : null;

  return {
    revenue,
    fixedCosts: fixed,
    variableCosts,
    breakEvenPoint,
    contributionMarginRatio,
    unclassifiedPurposes: unclassified,
    isPartialMonth: isCurrentMonth,
    daysElapsed: isCurrentMonth ? now.getDate() : null,
    daysInMonth: new Date(year, month, 0).getDate(),
  };
}
