"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  fetchTransactions,
  type TransactionItem,
} from "@/services/apiExpense.client";

export interface TrailingMonth {
  /** 1-12. */
  month: number;
  year: number;
  /** Short label for a chart axis, e.g. "Aug". */
  label: string;
  /** "YYYY-MM". */
  key: string;
  /** That month's transactions, empty until loaded (or if it failed). */
  transactions: TransactionItem[];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The `count` calendar months ending with the one containing `reference`. */
function trailingMonths(reference: Date, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(
      reference.getFullYear(),
      reference.getMonth() - (count - 1 - i),
      1,
    );
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return {
      month,
      year,
      label: MONTHS[d.getMonth()],
      key: `${year}-${String(month).padStart(2, "0")}`,
    };
  });
}

/**
 * Expense transactions for the last N calendar months, **independent of the
 * expense page's month/year filter**.
 *
 * This is the shared base for every "last 6 months" card. It returns the raw
 * rows per month; each chart aggregates them its own way — cash flow sums
 * income vs expense, the monthly trend buckets by purpose.
 *
 * The per-month query keys are deliberately the same ones ExpenseContext uses
 * (`["expense-transactions", month, year]`), which buys three things:
 *
 *  - the filtered month and the previous month come straight from cache, so
 *    only the older months are new requests;
 *  - a mutation invalidating `["expense-transactions"]` refreshes these charts
 *    too, with no extra plumbing;
 *  - there is one cached copy of "March 2026", not one per component.
 *
 * A single range-keyed query (as `fetchTransactionsRange` does) shares none of
 * that and re-fetches the whole window every time.
 */
export function useTrailingMonthsTransactions(count = 6) {
  // Anchored once per mount. The window only needs to be right for this
  // session; a month boundary crossed mid-session is not worth re-fetching
  // everything for.
  const months = useMemo(() => trailingMonths(new Date(), count), [count]);

  const results = useQueries({
    queries: months.map(({ month, year }) => ({
      queryKey: ["expense-transactions", month, year],
      queryFn: () => fetchTransactions(month, year),
      staleTime: 2 * 60 * 1000,
    })),
  });

  const data: TrailingMonth[] = months.map((m, i) => ({
    ...m,
    transactions: results[i]?.data?.transactions ?? [],
  }));

  return {
    /** One entry per month, oldest first. Always `count` long. */
    months: data,
    /** True until every month has resolved at least once. */
    isLoading: results.some((r) => r.isLoading),
    /** Only when the whole window failed — one bad month still renders. */
    isError: results.length > 0 && results.every((r) => r.isError),
    /** How many months failed, so a partial chart can say so. */
    failedMonths: results.filter((r) => r.isError).length,
  };
}
