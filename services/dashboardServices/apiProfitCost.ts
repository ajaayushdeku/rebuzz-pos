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
import { RawReportResponse } from "@/lib/types/report";

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

  const [reportRes, salesByItemRes, billsRes] = await Promise.all([
    axios.get(`${BASE}/business/report?${params}`, {
      headers: await authHeaders(),
    }),
    axios.get(
      `${BASE}/business/report/salesByItem?startDate=${start}&endDate=${end}`,
      { headers: await authHeaders() },
    ),
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

  // Net Profit = sum of all netprofit from salesByItem response
  const salesItems = salesByItemRes.data.data ?? [];
  const netProfit: number =
    salesItems.reduce(
      (sum: number, item: ProfitCostSalesItem) => sum + (item.netProfit ?? 0),
      0,
    ) -
    salesByItemRes.data.totalDiscount -
    salesByItemRes.data.totalRedeemPoint;

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

export async function getBudgetData(): Promise<BudgetItem[]> {
  return mockBudgetData;
}

export async function getExpenseStats(): Promise<ProfitCostApiResponse> {
  return mockCostStats;
}

export async function getExpenseByCategoryData(): Promise<ExpenseCategory[]> {
  return mockExpenseByCategoryData;
}
