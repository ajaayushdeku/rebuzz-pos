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
import { mergeSalesItems } from "@/lib/profitPerProduct";

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

/**
 * Revenue, cost and margin per product.
 *
 * Server-rendered so the table has rows on first paint; useProfitPerProduct
 * then refetches on the client whenever the range changes. The two derive
 * their figures the same way on purpose — a different rule here would make the
 * numbers visibly jump the moment the client query resolved.
 */
export async function getProfitPerProduct(
  startDate?: string,
  endDate?: string,
): Promise<Product[]> {
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), 0, 1); // Start of current year (Jan 1)

  const start = startDate ?? defaultStart.toISOString().split("T")[0];
  const end = endDate ?? today.toISOString().split("T")[0];

  const res = await axios.get(
    `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
    { headers: await authHeaders() },
  );

  return mergeSalesItems(res.data?.data ?? []);
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
  totalRevenue?: number;
  /** Pre-tax unit price. `totalRevenue` for the line includes tax. */
  price?: number;
  totalTax?: number;
};

/**
 * Tax charged on a period's sales.
 *
 * Sales revenue from this report is tax-inclusive: the pre-tax value of a line
 * is price × count, and the tax pages here derive tax as the difference. The
 * report's own `totalTax` is preferred where it sends one, with that
 * subtraction as the fallback, because the two are documented in different
 * places in this codebase and only live data settles which is current.
 */
function salesTax(items: UnitEconomicsSalesItem[]): number {
  return items.reduce((sum, i) => {
    if (typeof i.totalTax === "number" && i.totalTax > 0)
      return sum + i.totalTax;
    const preTax = (i.price ?? 0) * (i.count ?? 0);
    return sum + Math.max(0, (i.totalRevenue ?? 0) - preTax);
  }, 0);
}

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
// Variable cost is COGS — the cost of goods actually sold — plus tax charged
// on those sales, plus any expense the classifier did not recognise as fixed.
// Fixed costs come from recorded expenses, classified by lib/costClassification.

export interface BreakEvenData {
  /** Sales revenue plus income recorded in the expense tracker. */
  revenue: number;
  /**
   * The side-income part of `revenue`, kept only so the card can name what it
   * is showing. Zero when the tracker recorded none.
   */
  miscIncome: number;
  /**
   * Tax charged on sales, part of `variableCosts`.
   *
   * Kept separately only so the card can name it. It belongs on the variable
   * side because it is a share of every sale rather than a monthly commitment.
   */
  tax: number;
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
 * Every (month, year) an arbitrary date range touches.
 *
 * The expense API is keyed by month and year with no range form, so a range is
 * covered by fetching each month it overlaps and filtering the transactions
 * back down afterwards.
 */
function monthsBetween(
  start: string,
  end: string,
): { month: number; year: number }[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  if (!sy || !sm || !ey || !em) return [];

  const months: { month: number; year: number }[] = [];
  let year = sy;
  let month = sm;
  // Bounded so a malformed range cannot spin here.
  while ((year < ey || (year === ey && month <= em)) && months.length < 120) {
    months.push({ month, year });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * Money the expense tracker recorded as coming in rather than going out.
 *
 * The expense endpoint carries both kinds of transaction, and everywhere on
 * this page the income rows used to be skipped. That understates what the
 * business actually took: a supplier rebate, a sublet, a one-off sale of old
 * equipment is real money, and a profit figure that drops it is wrong by
 * exactly that amount.
 *
 * Whole months come back from the API, so the range filter is applied here.
 */
function sumMiscIncome(
  transactions: { kind?: string; amount?: number; date?: string }[],
  start: string,
  end: string,
): number {
  return transactions.reduce((sum, t) => {
    if (t.kind !== "income") return sum;
    const day = String(t.date ?? "").slice(0, 10);
    if (day < start || day > end) return sum;
    return sum + (Number(t.amount) || 0);
  }, 0);
}

/**
 * What to call the revenue line once misc income is folded into it.
 *
 * Named plainly when there is nothing extra in it, so a business that records
 * no side income is not asked to wonder what "misc" means on its chart.
 */
function revenueLabel(miscIncome: number): string {
  return miscIncome > 0 ? "Revenue + Misc income" : "Revenue";
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

  // Income takes the sales window, not the whole month. It is money already
  // received, so it stops at today for the same reason revenue does — the
  // costs above are the only side of this that is known in advance.
  const miscIncome = sumMiscIncome(transactions, start, end);

  // Counted towards break-even because it genuinely helps pay the bills: a
  // month covered partly by a rebate has still covered itself.
  const revenue = (report?.totalRevenue ?? 0) + miscIncome;

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

  // Tax joins the variable side, and for consistency rather than prudence:
  // `revenue` above is tax-inclusive, so part of every sale is the
  // government's. Comparing takings that contain tax against a target with no
  // tax in it flatters the business and shows break-even reached earlier than
  // it really is. Both halves now sit on the same basis.
  const tax = salesTax(items);

  // Variable expenses sit alongside COGS: all three scale with trading.
  const variableCosts = cogs + variableExpenses + tax;

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
    miscIncome,
    tax,
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

// ── What-If Scenario baseline ────────────────────────────────────────────────
// The real figures the planner's sliders move against. Same sources as
// getBreakEvenData, but COGS is kept separate from other variable spend
// because the planner adjusts them independently.

export interface ScenarioBaseline {
  /** Sales revenue. What the price and volume sliders act on. */
  revenue: number;
  /**
   * Income recorded in the expense tracker — rebates, sublets, one-off sales.
   *
   * Counted towards profit but held flat under the sliders, since none of them
   * describes how that money arrives.
   */
  miscIncome: number;
  /** Cost of goods sold — the part that moves with volume. */
  cogs: number;
  /**
   * Tax charged on sales. Inside `revenue`, which this report gives
   * tax-inclusive, and owed onwards rather than kept.
   *
   * It has no slider of its own because it is not a lever: it follows takings
   * at whatever rate the till charges. It moves with price and volume all the
   * same, which is why it is here rather than folded into fixed costs.
   */
  tax: number;
  /** Recorded expenses classified as fixed. Payroll lands here too. */
  fixedCosts: number;
  /** Recorded expenses that are neither fixed nor cost of goods. */
  variableExpenses: number;
  orders: number;
  /**
   * Labour, when it can be separated from everything else — currently never.
   *
   * Shifts record hours but no employee carries a pay rate, so hours cannot
   * become money. Any payroll the business records as an expense is already
   * inside `fixedCosts` via the classifier, which is why this is null rather
   * than zero: zero would read as "this business spends nothing on staff".
   */
  laborCost: number | null;
  /** Sources that failed, so the card can say the picture is partial. */
  missing: string[];
}

export async function getScenarioBaseline(
  startDate?: string,
  endDate?: string,
): Promise<ScenarioBaseline> {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 29);

  const start = startDate ?? defaultStart.toISOString().split("T")[0];
  const end = endDate ?? today.toISOString().split("T")[0];

  const headers = await authHeaders();
  const months = monthsBetween(start, end);

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

  const missing: string[] = [];

  const report: RawReport | undefined =
    reportRes.status === "fulfilled"
      ? (reportRes.value.data as RawReportResponse)?.data?.report
      : undefined;
  if (!report) missing.push("sales report");

  const items: UnitEconomicsSalesItem[] =
    salesRes.status === "fulfilled" ? (salesRes.value.data?.data ?? []) : [];
  if (salesRes.status !== "fulfilled") missing.push("cost of goods");

  const cogs = items.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * (i.count ?? 0),
    0,
  );

  const purposes: { _id: string; name?: string; icon?: string }[] =
    purposeRes.status === "fulfilled"
      ? (purposeRes.value.data?.data?.purposes ?? [])
      : [];
  const purposeMap = new Map(purposes.map((p) => [p._id, p]));

  const transactions: {
    kind?: string;
    purposeId?: string;
    amount?: number;
    date?: string;
  }[] = expenseResults.flatMap((r) =>
    r.status === "fulfilled" ? (r.value.data?.data?.transactions ?? []) : [],
  );
  if (expenseResults.some((r) => r.status !== "fulfilled")) {
    missing.push("expenses");
  }

  const inRange = transactions.filter((t) => {
    if (t.kind !== "expense") return false;
    const day = String(t.date ?? "").slice(0, 10);
    return day >= start && day <= end;
  });

  const { fixed, variable } = classifyExpenses(
    inRange.map((t) => {
      const purpose = purposeMap.get(String(t.purposeId));
      return {
        amount: Number(t.amount) || 0,
        name: purpose?.name ?? "",
        icon: purpose?.icon ?? "",
      };
    }),
  );

  return {
    revenue: report?.totalRevenue ?? 0,
    // Kept apart from sales rather than added in, because the sliders must not
    // touch it: charging 10% more per item does not raise a supplier rebate,
    // and folding it into `revenue` would let price and volume inflate money
    // the business does not earn that way.
    miscIncome: sumMiscIncome(transactions, start, end),
    cogs,
    tax: salesTax(items),
    fixedCosts: fixed,
    variableExpenses: variable,
    orders: report?.totalSales ?? 0,
    laborCost: null,
    missing,
  };
}

// ── Profit Waterfall ─────────────────────────────────────────────────────────
// Revenue at the left, each cost knocking the running total down, net profit
// at the right. Cost steps are named by the business's own expense purposes
// rather than a fixed list, so the chart describes this business rather than
// an imagined one.

export type WaterfallStepType = "start" | "deduct" | "locked" | "result";

export interface WaterfallStep {
  label: string;
  /** Running total after this step. */
  value: number;
  /** Amount removed here. Zero for the ends, and for a locked step. */
  deduction: number;
  type: WaterfallStepType;
}

export interface ProfitWaterfall {
  steps: WaterfallStep[];
  missing: string[];
}

/** Named cost steps before the tail is folded into "Other". */
const MAX_PURPOSE_STEPS = 5;

export async function getProfitWaterfall(
  startDate?: string,
  endDate?: string,
): Promise<ProfitWaterfall> {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 29);

  const start = startDate ?? defaultStart.toISOString().split("T")[0];
  const end = endDate ?? today.toISOString().split("T")[0];

  const headers = await authHeaders();
  const months = monthsBetween(start, end);

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

  const missing: string[] = [];

  const report: RawReport | undefined =
    reportRes.status === "fulfilled"
      ? (reportRes.value.data as RawReportResponse)?.data?.report
      : undefined;
  if (!report) missing.push("sales report");

  const items: UnitEconomicsSalesItem[] =
    salesRes.status === "fulfilled" ? (salesRes.value.data?.data ?? []) : [];
  if (salesRes.status !== "fulfilled") missing.push("cost of goods");

  const cogs = items.reduce(
    (sum, i) => sum + (i.costPrice ?? 0) * (i.count ?? 0),
    0,
  );

  const purposes: { _id: string; name?: string }[] =
    purposeRes.status === "fulfilled"
      ? (purposeRes.value.data?.data?.purposes ?? [])
      : [];
  const purposeName = new Map(
    purposes.map((p) => [p._id, (p.name ?? "").trim() || "Uncategorised"]),
  );

  const transactions: {
    kind?: string;
    purposeId?: string;
    amount?: number;
    date?: string;
  }[] = expenseResults.flatMap((r) =>
    r.status === "fulfilled" ? (r.value.data?.data?.transactions ?? []) : [],
  );
  if (expenseResults.some((r) => r.status !== "fulfilled")) {
    missing.push("expenses");
  }

  // Group by purpose, biggest first — a waterfall reads as "what took the
  // largest bite", so an arbitrary order would bury the answer.
  const byPurpose = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const day = String(t.date ?? "").slice(0, 10);
    if (day < start || day > end) continue;

    const label = purposeName.get(String(t.purposeId)) ?? "Uncategorised";
    byPurpose.set(label, (byPurpose.get(label) ?? 0) + (Number(t.amount) || 0));
  }

  const ranked = Array.from(byPurpose.entries())
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const named = ranked.slice(0, MAX_PURPOSE_STEPS);
  // Everything past the cap collapses into one bar: twenty labelled columns
  // are unreadable, and the tail is individually too small to act on.
  const tail = ranked
    .slice(MAX_PURPOSE_STEPS)
    .reduce((sum, [, amount]) => sum + amount, 0);

  // Everything that came in, sales and side income alike. The costs below are
  // taken out of both, so leaving side income out would show the business
  // paying its bills from a smaller pot than it actually had.
  const miscIncome = sumMiscIncome(transactions, start, end);
  const revenue = (report?.totalRevenue ?? 0) + miscIncome;
  let running = revenue;

  const steps: WaterfallStep[] = [
    {
      label: revenueLabel(miscIncome),
      value: running,
      deduction: 0,
      type: "start",
    },
  ];

  running -= cogs;
  steps.push({
    label: "Cost of goods",
    value: running,
    deduction: cogs,
    type: "deduct",
  });

  // Tax comes out next, because the revenue at the left includes it. It was
  // collected from customers and is owed onwards, so leaving it in overstated
  // every step after this one.
  const tax = salesTax(items);
  if (tax > 0) {
    running -= tax;
    steps.push({
      label: "Tax",
      value: running,
      deduction: tax,
      type: "deduct",
    });
  }

  // Labour, shown but inert: no employee carries a pay rate, so hours cannot
  // become money. Deducts nothing — payroll a business does record appears
  // under its own purpose below, and subtracting here would double-count it.
  steps.push({ label: "Labour", value: running, deduction: 0, type: "locked" });

  for (const [label, amount] of named) {
    running -= amount;
    steps.push({ label, value: running, deduction: amount, type: "deduct" });
  }

  if (tail > 0) {
    running -= tail;
    steps.push({
      label: "Other",
      value: running,
      deduction: tail,
      type: "deduct",
    });
  }

  // Derived, never fetched: the bars have to reconcile, and a net profit read
  // from elsewhere would visibly fail to add up.
  steps.push({
    label: "Net profit",
    value: running,
    deduction: 0,
    type: "result",
  });

  return { steps, missing };
}

// ── Profit Variance Bridge ───────────────────────────────────────────────────
// Why profit moved between two periods. Each bar is one cause, signed by
// whether it helped or hurt, and they sum exactly to the change.
//
// Volume and price/mix are deliberately absent. Splitting a revenue change
// into those two needs per-item quantity and average price in both periods,
// and a rule for items that exist in only one — arithmetic where a subtle
// error yields bars that look plausible and are wrong. Revenue moves as a
// single cause until that is designed properly.

export type VarianceBarType =
  "base" | "revenue" | "positive" | "negative" | "result";

export interface VarianceBar {
  label: string;
  /** Running total after this cause — the height the bar is drawn at. */
  value: number;
  /** This month's figure for this line. Net profit on the two end bars. */
  current: number;
  /** Last month's figure for the same line. */
  previous: number;
  /**
   * Signed effect on profit: positive helped, negative hurt. Zero on the two
   * end bars, which are figures rather than causes and must not be added to
   * the running total twice.
   *
   * Not simply `current - previous`, because a cost reads the other way round
   * — spending more on rent is a bigger figure and a worse result.
   */
  impact: number;
  type: VarianceBarType;
}

export interface ProfitVariance {
  bars: VarianceBar[];
  current: { start: string; end: string };
  previous: { start: string; end: string };
  /**
   * True while the current month is still running.
   *
   * Worth saying out loud on the card: a month nine days in is being compared
   * against a whole one, so every cost looks to have fallen.
   */
  inProgress: boolean;
  missing: string[];
}

interface PeriodFigures {
  /** Sales revenue plus income recorded in the expense tracker. */
  revenue: number;
  /** The side-income part of `revenue`, kept only to name the bar. */
  miscIncome: number;
  cogs: number;
  /** Tax charged on sales — inside `revenue`, and owed onwards. */
  tax: number;
  /** Expense total per purpose name. */
  byPurpose: Map<string, number>;
  ok: boolean;
}

/**
 * Revenue, cost of goods and expenses-by-purpose for one window.
 *
 * `expenseWindow` lets spending be counted over a wider span than trading.
 * Sales can only be read up to today, but an expense dated the 12th is this
 * month's expense whether or not the 12th has arrived — rent is owed on its
 * date, not on the day someone opens the dashboard. Break-even already treats
 * the two the same way. Defaults to the trading window when not given.
 */
async function periodFigures(
  start: string,
  end: string,
  headers: Record<string, string>,
  expenseWindow?: { start: string; end: string },
): Promise<PeriodFigures> {
  const spend = expenseWindow ?? { start, end };

  // Fetch every month either window touches, so a wider spending window can't
  // ask for transactions that were never requested.
  const months = monthsBetween(
    start < spend.start ? start : spend.start,
    end > spend.end ? end : spend.end,
  );

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

  const items: UnitEconomicsSalesItem[] =
    salesRes.status === "fulfilled" ? (salesRes.value.data?.data ?? []) : [];

  const purposes: { _id: string; name?: string }[] =
    purposeRes.status === "fulfilled"
      ? (purposeRes.value.data?.data?.purposes ?? [])
      : [];
  const purposeName = new Map(
    purposes.map((p) => [p._id, (p.name ?? "").trim() || "Uncategorised"]),
  );

  const transactions: {
    kind?: string;
    purposeId?: string;
    amount?: number;
    date?: string;
  }[] = expenseResults.flatMap((r) =>
    r.status === "fulfilled" ? (r.value.data?.data?.transactions ?? []) : [],
  );

  const byPurpose = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const day = String(t.date ?? "").slice(0, 10);
    // The spending window, which may run past the last day traded.
    if (day < spend.start || day > spend.end) continue;
    const label = purposeName.get(String(t.purposeId)) ?? "Uncategorised";
    byPurpose.set(label, (byPurpose.get(label) ?? 0) + (Number(t.amount) || 0));
  }

  // Income keeps the trading window. A cost dated ahead is a commitment
  // already made; income dated ahead has not arrived, and counting it would
  // credit the month with money against sales that stop at today.
  const miscIncome = sumMiscIncome(transactions, start, end);

  return {
    // Folded in rather than kept apart: the costs come out of both, and a
    // month where a rebate landed genuinely had more to work with.
    revenue: (report?.totalRevenue ?? 0) + miscIncome,
    miscIncome,
    cogs: items.reduce(
      (sum, i) => sum + (i.costPrice ?? 0) * (i.count ?? 0),
      0,
    ),
    tax: salesTax(items),
    byPurpose,
    ok: Boolean(report) && salesRes.status === "fulfilled",
  };
}

/** Named cost causes before the tail is folded into "Other costs". */
const MAX_VARIANCE_CAUSES = 4;

/**
 * This calendar month against the last one.
 *
 * Deliberately not wired to the page's date range. A variance needs two
 * comparable periods, and the natural pair a business already thinks in is
 * whole months — rent, wages and subscriptions all fall on a monthly cycle, so
 * an arbitrary window would cut some of them in half and read as a saving.
 *
 * The current month runs to today, not to its last day: the report endpoint
 * rejects an end date in the future, so asking for all of September on the 9th
 * fails the request outright rather than returning the nine days that exist.
 * That makes the comparison uneven until the month closes, which `inProgress`
 * exists to say on the card.
 */
export async function getProfitVariance(): Promise<ProfitVariance> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Built from local parts, never `toISOString`, which converts to UTC and in
  // any positive offset turns local midnight on the 1st into the last day of
  // the month before.
  const iso = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const current = { start: iso(new Date(year, month, 1)), end: iso(today) };

  // Day 0 of a month is the last day of the one before, so February and the
  // leap years take care of themselves. Last month is always whole — it is in
  // the past, so there is no future date to trip the API on.
  const previous = {
    start: iso(new Date(year, month - 1, 1)),
    end: iso(new Date(year, month, 0)),
  };

  const monthEnd = iso(new Date(year, month + 1, 0));
  const inProgress = current.end < monthEnd;

  const headers = await authHeaders();
  const [now, before] = await Promise.all([
    // Spending is counted to the end of the month even though trading stops at
    // today, so an expense dated the 12th is in this month's figures on the
    // 9th. Last month needs no widening — it is already whole.
    periodFigures(current.start, current.end, headers, {
      start: current.start,
      end: monthEnd,
    }),
    periodFigures(previous.start, previous.end, headers),
  ]);

  const missing: string[] = [];
  if (!now.ok) missing.push("this month's figures");
  if (!before.ok) missing.push("last month's figures");

  const expensesOf = (f: PeriodFigures) =>
    Array.from(f.byPurpose.values()).reduce((sum, v) => sum + v, 0);

  // Tax is deducted alongside cost of goods: it sits inside `revenue`, which
  // this report gives tax-inclusive, and it is owed onwards rather than kept.
  const prevNet =
    before.revenue - before.cogs - before.tax - expensesOf(before);
  const currNet = now.revenue - now.cogs - now.tax - expensesOf(now);

  /** One cause, carrying both months' figures and its effect on profit. */
  type Cause = {
    label: string;
    current: number;
    previous: number;
    impact: number;
    /**
     * Money coming in rather than going out. Flagged here rather than matched
     * on the label in the component, where a business that happens to name an
     * expense purpose "Revenue" would collide with it.
     */
    isRevenue?: boolean;
  };

  const cause = (
    label: string,
    curr: number,
    prev: number,
    isCost: boolean,
  ): Cause => ({
    label,
    current: curr,
    previous: prev,
    // A cost rising hurts profit, so its impact is the negative of its change.
    impact: isCost ? prev - curr : curr - prev,
    ...(isCost ? {} : { isRevenue: true }),
  });

  // Anything that did not move is not a cause and gets no bar — a flat column
  // in a chart of causes reads as one, and crowds out the ones that matter.
  // Named for the combined figure when either month carried side income —
  // otherwise a bar that quietly includes a rebate would be labelled as though
  // it were sales alone.
  const causes: Cause[] = [
    cause(
      revenueLabel(now.miscIncome + before.miscIncome),
      now.revenue,
      before.revenue,
      false,
    ),
    cause("Cost of goods", now.cogs, before.cogs, true),
    cause("Tax", now.tax, before.tax, true),
  ].filter((c) => c.impact !== 0);

  const purposeLabels = new Set([
    ...before.byPurpose.keys(),
    ...now.byPurpose.keys(),
  ]);
  const purposeCauses = Array.from(purposeLabels)
    .map((label) =>
      cause(
        label,
        now.byPurpose.get(label) ?? 0,
        before.byPurpose.get(label) ?? 0,
        true,
      ),
    )
    .filter((c) => c.impact !== 0)
    // Biggest mover first, in either direction — the question is "what moved
    // profit most", and a small rise matters as little as a small fall.
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  causes.push(...purposeCauses.slice(0, MAX_VARIANCE_CAUSES));

  // Everything past the cap collapses into one bar. Both months' amounts are
  // carried across, not just the difference, so its tooltip reads like every
  // other one rather than showing a variance with nothing behind it.
  const rest = purposeCauses.slice(MAX_VARIANCE_CAUSES);
  if (rest.length > 0) {
    causes.push(
      cause(
        "Other costs",
        rest.reduce((sum, c) => sum + c.current, 0),
        rest.reduce((sum, c) => sum + c.previous, 0),
        true,
      ),
    );
  }

  let running = prevNet;

  // The two end bars are figures rather than causes, so they carry a zero
  // impact — the running total must not count them — but still report both
  // months, which for them is net profit itself.
  const bars: VarianceBar[] = [
    {
      label: "Last month net",
      value: running,
      current: currNet,
      previous: prevNet,
      impact: 0,
      type: "base",
    },
  ];

  for (const c of causes) {
    running += c.impact;
    bars.push({
      label: c.label,
      value: running,
      current: c.current,
      previous: c.previous,
      impact: c.impact,
      // Revenue keeps its own identity rather than turning green or red. It is
      // the one line that is not a cost, and reading it at a glance matters
      // more than being told again which way it went.
      type: c.isRevenue ? "revenue" : c.impact >= 0 ? "positive" : "negative",
    });
  }

  // Derived, so the bars always land on the real figure. Every cost purpose is
  // represented — the top few by name, the rest folded into one tail bar — so
  // the deltas cancel and this equals current revenue minus current costs.
  // Reading it from elsewhere would let the chain visibly fail to add up.
  bars.push({
    label: "This month net",
    value: running,
    current: currNet,
    previous: prevNet,
    impact: 0,
    type: "result",
  });

  return { bars, current, previous, inProgress, missing };
}
