/**
 * Build a plain-text briefing from structured dashboard data for the Gemini API.
 *
 * The briefing is the `contents` (user message) of the Gemini call. It must be:
 * - Self-contained: Gemini cannot see the database, so every figure it may refer
 *   to must appear in the text.
 * - Short: the route caps it at 16,000 chars. A well-formed briefing for a normal
 *   day is well under 4,000 chars.
 * - Deterministic: the same data must produce the same briefing, because the card
 *   above the chart is built from the same numbers and they must not disagree.
 *
 * Sections are delimited with a header in square brackets so the model can tell
 * them apart. Numbers are written out in full (no abbreviations Gemini might misread).
 *
 * IMPORTANT: This file is the briefing builder only. It does NOT call the AI
 * backend. That is the job of `services/apiAiInsights.client.ts` (or a Next.js
 * Server Component). This module assembles the text; the caller sends it.
 */

import type { BriefingData } from "@/lib/ai-insights/contract";
import { BRIEFING_SECTIONS } from "@/lib/ai-insights/contract";
import { formatCurrencySymbolOnly } from "@/utils/helper";

// ── Configuration ───────────────────────────

/** Printed wherever a figure cannot be computed, so the model reads a word
 * rather than an empty clause. */
const NOT_AVAILABLE = "N/A";

/** Separator between the named fragments that make up a single briefing line. */
const FIELD_SEPARATOR = " | ";

/** `localStorage` key that opts a developer build into console tracing. */
const DEBUG_FLAG = "ai-insights-debug";

// ── Formatting helpers (pure) ───────────────────────────────────────────────────────────────────────────────

/** Format a number as a plain "1,234.56" string. Symbol-free by design: the
 * symbol is added by `money()` inside `buildBriefing`, which knows whether the
 * session carried a currency. */
function formatCurrency(value: number): string {
  if (!isFinite(value)) return "0.00";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Count how many section headers appear in the briefing. Used for debugging. */
function countSections(text: string): number {
  const matches = text.match(/^\[.*\]$/gm);
  return matches ? matches.length : 0;
}

/** JSON schema reminder appended to the briefing to remind the model of the
 * exact output shape. This is a plain string so it appears in the user message
 * alongside the data. */
export function schemaReminder(): string {
  return (
    "JSON SCHEMA (fill this in exactly):\n\n" +
    JSON.stringify(
      {
        story: {
          view: "live | yesterday",
          title: "string",
          subtitle: "string",
          vibe: "string",
          segments: [{ text: "string", color: "default | green | red" }],
          priority: { label: "string", text: "string" },
        },
        insights: [{ type: "success | warning | info", text: "string" }],
        alerts: [
          {
            type: "danger | warning | info",
            icon: "alert | package | user",
            title: "string",
            subtitle: "string",
          },
        ],
      },
      null,
      2,
    )
  );
}

// ── Additional Helper Functions ────────────────────────────────────────────

/** Format a number with commas for readability */
function formatNumber(value: number): string {
  if (!isFinite(value)) return "0";
  return value.toLocaleString("en-US");
}

/** Calculate percentage change between two values */
function formatPercentChange(current: number, previous: number): string {
  if (!previous || !isFinite(previous) || previous === 0) return "N/A";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/** Get arrow indicator for trends (up/down/neutral) */
function trendArrow(current: number, previous: number): string {
  if (!isFinite(current) || !isFinite(previous)) return "";
  if (current > previous) return " ▲";
  if (current < previous) return " ▼";
  return "";
}

/** Calculate total revenue from an array of items */
function calcTotalRevenue(items: { revenue: number }[]): number {
  return items.reduce((sum, item) => sum + item.revenue, 0);
}

/** The entry with the greatest / least revenue, or `undefined` when empty. One
 * reduction serves "best day", "slowest day" and "peak hour" alike. */
function extremeByRevenue<T extends { revenue: number }>(
  items: readonly T[],
  direction: "max" | "min",
): T | undefined {
  if (items.length === 0) return undefined;
  return items.reduce((best, item) => {
    const isBetter =
      direction === "max"
        ? item.revenue > best.revenue
        : item.revenue < best.revenue;
    return isBetter ? item : best;
  });
}

/** Find the peak hour from hourly sales data */
function findPeakHour(hourlySales: BriefingData["hourlySales"]): string {
  return extremeByRevenue(hourlySales, "max")?.hour ?? NOT_AVAILABLE;
}

/** Find the best day from daily sales data */
function findBestDay(dailySales: BriefingData["dailySales"]): string {
  return extremeByRevenue(dailySales, "max")?.day ?? NOT_AVAILABLE;
}

/** Find the slowest day from daily sales data */
function findSlowestDay(dailySales: BriefingData["dailySales"]): string {
  return extremeByRevenue(dailySales, "min")?.day ?? NOT_AVAILABLE;
}

/** Calculate average daily revenue */
function calcAvgDailyRevenue(dailySales: BriefingData["dailySales"]): number {
  if (dailySales.length === 0) return 0;
  return calcTotalRevenue(dailySales) / dailySales.length;
}

/** "48.00 to 52.50 (+9.4% ▲)" — the shape every comparison line shares. */
function formatComparison(
  current: number,
  previous: number,
  format: (value: number) => string,
): string {
  return `${format(previous)} to ${format(current)} (${formatPercentChange(
    current,
    previous,
  )}${trendArrow(current, previous)})`;
}

/** Spaces are meaningful: joined fragments never produce double separators, so
 * an unknown figure removes its clause instead of leaving " |  | " behind. */
function joinFields(...fields: Array<string | undefined>): string {
  return fields
    .filter((field): field is string => Boolean(field))
    .join(FIELD_SEPARATOR);
}

/** " from 12 orders", or "" when the endpoint reports no per-slot count. */
function ordersClause(orders: number | undefined): string {
  return orders === undefined ? "" : ` from ${formatNumber(orders)} orders`;
}

// ── Main builder ────────────────────────────────────────────────────────────

/**
 * Turn the structured dashboard data into the plain-text briefing that is sent
 * as the `contents` (user message) of the Gemini request.
 *
 * Every section is prefixed with a `[SECTION]` header. Optional sections are
 * skipped entirely when their data is absent, so the model never sees an empty
 * heading it might hallucinate around.
 */
export function buildBriefing(data: BriefingData): string {
  const lines: string[] = [];

  // The model mirrors the formatting it reads far more reliably than it follows
  // instructions, so the symbol is prefixed onto every figure in the briefing
  // directly; the Currency line in [PERIOD] only reinforces what the text
  // already shows. Empty when the session carried no currency — bare numbers
  // are then correct, and a guessed symbol would be worse than none.
  const currencySymbol = data.currency
    ? formatCurrencySymbolOnly(data.currency.symbol)
    : "";
  const money = (value: number): string =>
    `${currencySymbol}${formatCurrency(value)}`;

  // ── Period ──
  lines.push(`[${BRIEFING_SECTIONS.PERIOD}]`);
  lines.push(`Label: ${data.periodLabel}`);
  lines.push(`Range: ${data.periodStart} to ${data.periodEnd}`);
  lines.push(
    `View: ${data.viewMode === "live" ? "Live (today so far)" : "Yesterday's completed day"}`,
  );
  // The cards print the model's words, so the currency symbol only reaches the
  // merchant through this instruction. Only sent when the session carried one:
  // "use the symbol" with no symbol known would invite the model to invent it.
  if (data.currency) {
    lines.push(
      `Currency: every money figure in this briefing is in ${data.currency.code} ` +
        `and already carries its symbol "${data.currency.symbol}". ` +
        `Echo money amounts exactly as written (for example: ${data.currency.symbol}1,234.56), never as a bare number.`,
    );
  }
  lines.push("");

  // ── Headline stats ──
  lines.push(`[${BRIEFING_SECTIONS.HEADLINE_STATS}]`);
  lines.push(`Total sales:  ${money(data.stats.totalSales)}`);
  lines.push(`Total orders: ${formatNumber(data.stats.totalOrders)}`);
  lines.push(`Products sold: ${formatNumber(data.stats.productsSold)}`);
  lines.push(`Net profit: ${money(data.stats.netProfit)}`);
  lines.push("");

  // ── Comparison (only when a previous-period figure exists) ──
  const { previousSales, previousOrders, previousProfit } = data.stats;
  const hasComparison =
    previousSales !== undefined ||
    previousOrders !== undefined ||
    previousProfit !== undefined;

  if (hasComparison) {
    lines.push(`[${BRIEFING_SECTIONS.COMPARISON}]`);
    if (previousSales !== undefined) {
      lines.push(
        `Sales: ${money(previousSales)} to ${money(
          data.stats.totalSales,
        )} (${formatPercentChange(data.stats.totalSales, previousSales)}${trendArrow(
          data.stats.totalSales,
          previousSales,
        )})`,
      );
    }
    if (previousOrders !== undefined) {
      lines.push(
        `Orders: ${formatNumber(previousOrders)} to ${formatNumber(
          data.stats.totalOrders,
        )} (${formatPercentChange(
          data.stats.totalOrders,
          previousOrders,
        )}${trendArrow(data.stats.totalOrders, previousOrders)})`,
      );
    }
    if (previousProfit !== undefined) {
      lines.push(
        `Net profit: ${money(previousProfit)} to ${money(
          data.stats.netProfit,
        )} (${formatPercentChange(
          data.stats.netProfit,
          previousProfit,
        )}${trendArrow(data.stats.netProfit, previousProfit)})`,
      );
    }
    lines.push("");
  }

  // ── Winning stats ──
  lines.push(`[${BRIEFING_SECTIONS.WINNING_STATS}]`);
  lines.push(`Top selling product: ${data.winningStats.topSellingProduct}`);
  lines.push(`Peak hour: ${data.winningStats.peakHour}`);
  lines.push(`Best day: ${data.winningStats.bestDay}`);
  lines.push(`Sales streak: ${data.winningStats.salesStreak}`);
  lines.push("");

  // ── Top products ──
  if (data.topProducts.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.TOP_PRODUCTS}]`);
    data.topProducts.forEach((product, i) => {
      const parts = [
        `${i + 1}. ${product.name}`,
        `units sold: ${formatNumber(product.unitsSold)}`,
        `revenue: ${money(product.revenue)}`,
      ];
      // Absent figures are skipped, not printed: this text is read by the model
      // as fact, and "category: undefined" is a claim it could repeat.
      if (product.category) parts.push(`category: ${product.category}`);
      if (product.profit !== undefined) {
        parts.push(`profit: ${money(product.profit)}`);
      }
      lines.push(parts.join(" | "));
    });
    lines.push("");
  }

  // ── Hourly pattern ──
  if (data.hourlySales.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.HOURLY_PATTERN}]`);
    lines.push(`Peak hour by revenue: ${findPeakHour(data.hourlySales)}`);
    data.hourlySales.forEach((hour) => {
      const orders =
        hour.orders === undefined
          ? ""
          : ` from ${formatNumber(hour.orders)} orders`;
      lines.push(
        `${hour.hour}: ${money(hour.revenue)} revenue${orders}`,
      );
    });
    lines.push("");
  }

  // ── Daily pattern ──
  if (data.dailySales.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.DAILY_PATTERN}]`);
    lines.push(`Best day by revenue: ${findBestDay(data.dailySales)}`);
    lines.push(`Slowest day by revenue: ${findSlowestDay(data.dailySales)}`);
    lines.push(
      `Average daily revenue: ${money(calcAvgDailyRevenue(data.dailySales))}`,
    );
    data.dailySales.forEach((day) => {
      const orders =
        day.orders === undefined
          ? ""
          : ` from ${formatNumber(day.orders)} orders`;
      lines.push(`${day.day}: ${money(day.revenue)} revenue${orders}`);
    });
    lines.push("");
  }

  // ── Recent transactions ─
  if (data.recentTransactions.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.RECENT_TRANSACTIONS}]`);
    data.recentTransactions.forEach((tx) => {
      const items = tx.items.length
        ? tx.items
            .map(
              (item) =>
                `${item.name} x${item.quantity} @ ${money(item.unitPrice)}`,
            )
            .join(", ")
        : "no line items";
      lines.push(
        `${tx.timestamp} | ${tx.invoiceName} | ${money(Number(tx.amount))} | ${tx.paymentMethod} | ${tx.status} | ${items}`,
      );
    });
    lines.push("");
  }

  // ── Customer insights (optional) ─
  if (data.customerInsights) {
    const c = data.customerInsights;
    lines.push(`[${BRIEFING_SECTIONS.CUSTOMER_INSIGHTS}]`);
    lines.push(`Total loyalty members: ${formatNumber(c.totalMembers)}`);
    lines.push(`Active this period: ${formatNumber(c.activeThisPeriod)}`);
    // newCustomers / repeatCustomers are optional in the contract: the POS
    // customer-stats endpoint does not report them, so omitting the line is
    // honest while printing 0 would invent a figure for Gemini to quote.
    if (c.newCustomers !== undefined) {
      lines.push(`New customers: ${formatNumber(c.newCustomers)}`);
    }
    if (c.repeatCustomers !== undefined) {
      lines.push(`Repeat customers: ${formatNumber(c.repeatCustomers)}`);
    }
    c.topCustomers?.forEach((customer) => {
      lines.push(
        `Top customer: ${customer.name} | visits: ${formatNumber(
          customer.visits,
        )} | spent: ${money(customer.totalSpent)}${
          customer.loyaltyTier ? ` | tier: ${customer.loyaltyTier}` : ""
        }`,
      );
    });
    c.atRiskCustomers?.forEach((customer) => {
      // lastVisit / totalSpent are optional: the endpoint reports a spending
      // band instead. Each known fragment becomes its own clause so the line
      // never reads "last visit: undefined".
      const visitClause =
        customer.lastVisit !== undefined
          ? ` | last visit: ${customer.lastVisit}`
          : "";
      const spentClause =
        customer.totalSpent !== undefined
          ? ` | spent: ${money(customer.totalSpent)}`
          : "";
      const bandClause =
        customer.spendLevel !== undefined
          ? ` | spend band: ${customer.spendLevel}`
          : "";
      lines.push(
        `At-risk customer: ${customer.name}${visitClause}${spentClause}${bandClause}`,
      );
    });
    lines.push("");
  }

  // ── Low stock alerts (optional) ──
  if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.LOW_STOCK_ALERTS}]`);
    data.lowStockAlerts.forEach((item) => {
      // category is optional: a product with none assigned reports no category,
      // and "category: undefined" would read as a category named undefined.
      const categoryClause =
        item.category !== undefined ? ` | category: ${item.category}` : "";
      lines.push(
        `${item.name}${categoryClause} | current stock: ${formatNumber(
          item.currentStock,
        )} | threshold: ${formatNumber(item.threshold)}`,
      );
    });
    lines.push("");
  }

  // ── Category performance (optional) ──
  if (data.categoryPerformance && data.categoryPerformance.length > 0) {
    lines.push(`[${BRIEFING_SECTIONS.CATEGORY_PERFORMANCE}]`);
    data.categoryPerformance.forEach((category) => {
      // unitsSold is optional (the endpoint reports sales counts, not units).
      // Reading "units sold: 0" as no units moved, so unknown figures omit the
      // clause. `orders` carries the endpoint's `totalSales` sales count.
      const ordersClause =
        category.orders !== undefined
          ? ` | sales: ${formatNumber(category.orders)}`
          : "";
      const unitsClause =
        category.unitsSold !== undefined
          ? ` | units sold: ${formatNumber(category.unitsSold)}`
          : "";
      lines.push(
        `${category.category} | revenue: ${money(
          category.revenue,
        )} | ${(category.percentOfTotal ?? 0).toFixed(
          1,
        )}% of total${ordersClause}${unitsClause}`,
      );
    });
    lines.push("");
  }

  // ── Instruction (schema reminder) ──
  lines.push(`[${BRIEFING_SECTIONS.INSTRUCTION}]`);
  lines.push(schemaReminder());

  const briefing = lines.join("\n");

  // ── Browser-console debugging ──
  // Prints the raw input and the assembled text so the payload shape can be
  // eyeballed in dev. Enabled only when the merchant opts in locally via
  // `localStorage.setItem("ai-insights-debug", "1")`: a briefing prints sales
  // figures, which do not belong in a console a screenshare or extension can
  // read. Delete entirely once the briefing format settles.
  if (
    typeof console !== "undefined" &&
    typeof localStorage !== "undefined" &&
    localStorage.getItem("ai-insights-debug") === "1" &&
    process.env.NODE_ENV !== "production"
  ) {
    console.groupCollapsed(
      `[AI Insights] buildBriefing -> ${briefing.length} chars, ${countSections(
        briefing,
      )} sections`,
    );
    console.log("input BriefingData:", data);
    console.log("assembled briefing:\n" + briefing);
    console.groupEnd();
  }

  return briefing;
}
