/**
 * Collect the dashboard's analytics into a `BriefingData` for the AI briefing.
 *
 * Server-side only: every source here reads the session cookie, so this cannot
 * run in the browser. It reuses the exact services the dashboard wrappers use —
 * the insight card and the charts above it are therefore built from the same
 * numbers and cannot disagree (the property the AI service's README calls out).
 *
 * Resilience: only the headline stats are load-bearing — if those fail there is
 * nothing honest to analyse, so the error propagates. Every other section is
 * optional in the contract and settles independently: one failing endpoint
 * drops its section from the briefing rather than killing the card.
 */

import {
  getHourlySalesData,
  getRecentTransactions,
  getSalesByCategory,
  getStatsData,
  getTopProducts,
  getWeeklyRevenueData,
  getWinningStats,
} from "@/services/dashboardServices/apiOverview";
import { getCustomerStats } from "@/services/dashboardServices/apiCustomerDash";
import { fetchInventoryProducts } from "@/services/apiInventory";
import { formatVariantName } from "@/utils/helper";
import type { BriefingData } from "@/lib/ai-insights/contract";

/** Format a Date as YYYY-MM-DD in local time (not UTC). */
function fmtLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Unwrap a settled promise, falling back when that source failed. */
const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
  r.status === "fulfilled" ? r.value : fallback;

export async function collectBriefingData(): Promise<BriefingData> {
  // ── Windows ────────────────────────────────────────────────────────────────
  // The dashboard itself mixes windows (headline = 30 days, hourly/top items =
  // today, weekly = 7 days, customers = month to date), so the briefing uses
  // the same ones and says so in periodLabel rather than pretending one range
  // covers everything.
  const now = new Date();
  const periodEnd = fmtLocalDate(now);
  const periodStart = fmtLocalDate(daysAgo(29));
  const prevStart = fmtLocalDate(daysAgo(59));
  const prevEnd = fmtLocalDate(daysAgo(30));

  // Headline stats: current and previous 30 days, for the comparison section.
  // A failure here is fatal — see the file comment.
  const [stats, previous] = await Promise.all([
    getStatsData(periodStart, periodEnd),
    getStatsData(prevStart, prevEnd),
  ]);

  // Everything else is optional: settle independently, drop what fails.
  const [winning, topProducts, hourly, daily, categories, inventory, customers] =
    await Promise.allSettled([
      getWinningStats(),
      getTopProducts(),
      getHourlySalesData(),
      getWeeklyRevenueData(),
      getSalesByCategory(),
      fetchInventoryProducts(),
      getCustomerStats(),
    ]);

  // ── Winning stats ──
  const w = ok(winning, null);
  const winningStats = {
    topSellingProduct: w?.topSellingProduct.value ?? "No sales yet",
    peakHour: w?.peakHour.value ?? "No data",
    bestDay: w?.bestDay.value ?? "No data",
    salesStreak: w?.salesStreak.value ?? "No streak data",
  };

  // ── Top products (today). The endpoint has no category or profit figures;
  // the contract marks both optional, so they are simply omitted per product.
  const topProductsList = ok(topProducts, []).map((p) => ({
    name: p.productName,
    unitsSold: p.noOfSale,
    revenue: p.totalRevenue,
  }));

  // ── Recent transactions. getRecentTransactions throws on failure; run it
  // through allSettled so the section drops instead of killing the card.
  const [recentSettled] = await Promise.allSettled([getRecentTransactions()]);
  const transactions = ok(recentSettled, []);

  // ── Low stock: same per-variant rule as the LowStockAlerts card ──
  const products = ok(inventory, []);
  const lowStockAlerts: NonNullable<BriefingData["lowStockAlerts"]> = [];
  for (const p of products) {
    if (!p.usesStocks) continue;
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        // Critical or worse only — "running low" halves the briefing's signal.
        if (v.inStock > v.lowStock) continue;
        lowStockAlerts.push({
          name: formatVariantName(p.name, v.optionValues),
          currentStock: v.inStock,
          threshold: v.lowStock,
          ...(p.categories ? { category: p.categories } : {}),
        });
      }
      continue;
    }
    if (p.inStock <= p.lowStock) {
      lowStockAlerts.push({
        name: p.name,
        currentStock: p.inStock,
        threshold: p.lowStock,
        ...(p.categories ? { category: p.categories } : {}),
      });
    }
  }
  // Cap it: twenty out-of-stock lines would swamp the briefing without
  // changing what the model should say about the worst ones. Worst first.
  lowStockAlerts.sort((a, b) => a.currentStock - b.currentStock);
  lowStockAlerts.length = Math.min(lowStockAlerts.length, 8);

  // ── Category performance (last 365 days, per getSalesByCategory) ──
  const categorySales = ok(categories, []);
  const categoryTotal = categorySales.reduce(
    (sum, c) => sum + c.totalRevenue,
    0,
  );
  const categoryPerformance =
    categoryTotal > 0
      ? categorySales.map((c) => ({
          category: c.name,
          revenue: c.totalRevenue,
          percentOfTotal: (c.totalRevenue / categoryTotal) * 100,
          // `totalSales` on this endpoint is a count of sales, not money.
          orders: c.totalSales,
        }))
      : undefined;

  // ── Customers (month to date). The endpoint reports members and active
  // customers only; new/repeat are contract-optional and omitted.
  const cs = ok(customers, null);
  const customerInsights = cs
    ? {
        totalMembers: cs.totalMembers.value,
        activeThisPeriod: cs.activeCustomers.value,
      }
    : undefined;

  return {
    periodStart,
    periodEnd,
    periodLabel:
      "Headline stats: last 30 days · hourly pattern and top products: today · daily trend: last 7 days · categories: last 365 days · customers: month to date",
    viewMode: "live",
    stats: {
      totalSales: stats.totalSales.value,
      totalOrders: stats.totalOrders.value,
      productsSold: stats.productsSold.value,
      netProfit: stats.netProfit.value,
      previousSales: previous.totalSales.value,
      previousOrders: previous.totalOrders.value,
      previousProfit: previous.netProfit.value,
    },
    winningStats,
    topProducts: topProductsList,
    hourlySales: ok(hourly, []).map((h) => ({
      hour: h.hour,
      revenue: h.revenue,
    })),
    dailySales: ok(daily, []).map((d) => ({ day: d.day, revenue: d.revenue })),
    recentTransactions: transactions.map((tx) => ({
      id: tx.id,
      invoiceName: tx.invoiceName,
      amount: tx.amount,
      paymentMethod: String(tx.paymentMethod),
      items: tx.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      status: tx.status,
      timestamp: tx.timestamp,
    })),
    customerInsights,
    lowStockAlerts: lowStockAlerts.length > 0 ? lowStockAlerts : undefined,
    categoryPerformance,
  };
}

