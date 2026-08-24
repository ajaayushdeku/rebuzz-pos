"use client";

import { useTrailingMonthsTransactions } from "./useTrailingMonthsTransactions";

export interface CashFlowPoint {
  /** Short month label, e.g. "Aug". */
  month: string;
  /** "YYYY-MM", for keys and debugging. */
  key: string;
  inflow: number;
  outflow: number;
}

/**
 * Inflow / outflow per month over a fixed six-month window.
 *
 * A thin aggregation over useTrailingMonthsTransactions — that hook owns the
 * window, the fetching and the cache sharing; this one only decides that
 * income is inflow and everything else is outflow.
 */
export function useCashFlowTrend() {
  const { months, isLoading, isError, failedMonths } =
    useTrailingMonthsTransactions(6);

  const data: CashFlowPoint[] = months.map((m) => {
    // Each request is already scoped to its month, so the rows are summed as
    // returned rather than re-filtered by date — re-filtering would silently
    // zero the chart if the API's date format ever changed.
    let inflow = 0;
    let outflow = 0;
    for (const t of m.transactions) {
      if (t.kind === "income") inflow += t.amount ?? 0;
      else outflow += t.amount ?? 0;
    }

    return { month: m.label, key: m.key, inflow, outflow };
  });

  return { data, isLoading, isError, failedMonths };
}
