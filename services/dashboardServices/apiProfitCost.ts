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
import { RawReportResponse } from "@/lib/types/report";
import { DayTimeProfitData } from "@/components/dashboardComponents/profitcostDash/DayTimeProfitHeatmap";
import { formatDayTimeProfitAverages } from "@/utils/formatHourReportToday";

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
