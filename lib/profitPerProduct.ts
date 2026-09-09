import type { Product } from "@/components/dashboardComponents/profitcostDash/profit-per-product-column";

/**
 * One row of the sales-by-item report.
 *
 * Every field is optional because the report is transcribed by hand at each
 * call site and has grown fields over time; a missing one must degrade rather
 * than throw.
 */
export interface SalesByItemRow {
  itemName?: string;
  totalRevenue?: number;
  count?: number;
  costPrice?: number;
  /** The report's own profit for the line, after everything the sale did. */
  netProfit?: number;
  /**
   * Tax on the line. Spelled several ways across this API — bills use
   * `taxamt`, tickets and invoices use `taxAmount` — so all of them are read
   * rather than betting on one.
   */
  tax?: number;
  taxAmount?: number;
  taxamt?: number;
  totalTax?: number;
}

/** The tax on one row, or null when the report carries none. */
function rowTax(item: SalesByItemRow): number | null {
  const value = item.tax ?? item.taxAmount ?? item.taxamt ?? item.totalTax;
  return typeof value === "number" ? value : null;
}

/**
 * Sales-by-item rows collapsed into one row per product.
 *
 * Shared by the server render and the client query on purpose: the two used to
 * derive their figures separately, and any difference between them showed up
 * as the table's numbers jumping the moment the query resolved.
 */
export function mergeSalesItems(rows: SalesByItemRow[]): Product[] {
  const merged = new Map<
    string,
    { revenue: number; cogs: number; profit: number; tax: number | null }
  >();

  for (const item of rows) {
    const name = (item.itemName ?? "").trim() || "Unnamed item";
    const revenue = item.totalRevenue ?? 0;

    // Stock cost is unit cost times units, per row: what the business paid for
    // the goods, whatever the line then sold for.
    const cogs = (item.costPrice ?? 0) * (item.count ?? 0);

    // Profit comes from the report rather than from `revenue - cogs`. A
    // customised product's unit cost does not describe what was actually sold
    // — extras, swaps and price overrides all fall outside it — so the
    // subtraction was wrong for exactly the rows that matter most.
    const profit = item.netProfit ?? revenue - cogs;

    const tax = rowTax(item);

    // Merged by name, because one product arrives as several rows when it was
    // sold with different customisations. Each row's cost is summed rather
    // than a single unit cost being multiplied by the combined count.
    const prev = merged.get(name);
    merged.set(name, {
      revenue: (prev?.revenue ?? 0) + revenue,
      cogs: (prev?.cogs ?? 0) + cogs,
      profit: (prev?.profit ?? 0) + profit,
      // Stays null until some row actually reports tax, so a product the
      // report is silent about shows a blank rather than a confident zero.
      tax: tax === null ? (prev?.tax ?? null) : (prev?.tax ?? 0) + tax,
    });
  }

  return Array.from(merged, ([name, { revenue, cogs, profit, tax }]) => ({
    name,
    revenue,
    cogs,
    tax,
    profit,
    margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
  }));
}
