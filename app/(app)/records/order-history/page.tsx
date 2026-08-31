"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import Transactions from "@/components/dashboardComponents/orderHistory/Transactions";
import OrderHistoryStats from "@/components/dashboardComponents/orderHistory/OrderHistoryStats";
import SampleDataBadge from "@/components/ui/sampledatabadge";
// import { mockTransactions } from "@/lib/mockData/mock-transactions";
import type { Transaction } from "@/components/dashboardComponents/orderHistory/transaction-columns";
import type { OrderHistoryStats as StatsData } from "@/components/dashboardComponents/orderHistory/OrderHistoryStats";

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const end = `${y}-${m}-${d}`;

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 29);
  const sy = startDate.getFullYear();
  const sm = String(startDate.getMonth() + 1).padStart(2, "0");
  const sd = String(startDate.getDate()).padStart(2, "0");
  const start = `${sy}-${sm}-${sd}`;

  return { startDate: start, endDate: end };
}

/**
 * Both requests for one date range.
 *
 * Returns the data rather than writing it, so the effect below and the refresh
 * the table triggers can share it without also sharing a loading flag — the
 * refresh has to be silent, since the row it follows has already updated and
 * blanking the cards would read as a step backwards.
 *
 * `no-store` on both: the routes no longer cache, but the browser would still
 * reuse its own copy of an identical GET, which is the same staleness one
 * layer up.
 */
async function loadOrderHistory(range: DateRangeValue): Promise<{
  transactions: Transaction[];
  stats: StatsData | null;
}> {
  const query = `startDate=${range.startDate}&endDate=${range.endDate}`;

  const [transRes, statsRes] = await Promise.all([
    fetch(`/api/order-history/transactions?${query}`, { cache: "no-store" }),
    fetch(`/api/order-history/stats?${query}`, { cache: "no-store" }),
  ]);

  return {
    transactions: transRes.ok ? ((await transRes.json())?.data ?? []) : [],
    stats: statsRes.ok ? ((await statsRes.json())?.data ?? null) : null,
  };
}

export default function OrderHistoryPage() {
  const defaults = getDefaultDateRange();
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  // Destructured so both the effect and `refresh` depend on the two strings
  // rather than the object, which is a fresh reference on every render.
  const { startDate, endDate } = dateRange;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await loadOrderHistory({ startDate, endDate });
        if (cancelled) return;
        setTransactions(data.transactions);
        setStats(data.stats);
      } catch {
        if (!cancelled) {
          setTransactions([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  /**
   * Re-read the figures without a loading state.
   *
   * Called after a refund: the table has already flipped that row itself, so
   * what is left to correct is the revenue, refund total and refund rate,
   * which the server computes from the whole bill list. A failure leaves what
   * is on screen alone rather than blanking a page that is still broadly
   * right.
   */
  const refresh = useCallback(async () => {
    try {
      const data = await loadOrderHistory({ startDate, endDate });
      setTransactions(data.transactions);
      setStats(data.stats);
    } catch {
      // Keep what is showing.
    }
  }, [startDate, endDate]);

  const isEmpty = !transactions || transactions.length === 0;
  // const displayData = isEmpty ? mockTransactions : transactions;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        {isEmpty && !loading && <SampleDataBadge />}

        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Order History
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Browse and search all transactions
          </p>
        </div>

        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          storageKey="rebuzz-order-history-date-filter"
        />
      </div>

      {/* ── Stats ── */}
      <div className="mt-2">
        <OrderHistoryStats stats={stats} isLoading={loading} />
      </div>

      {/* A refund re-reads the figures without a loading flash — the row
          flips optimistically inside the table, so blanking the cards would
          be a step backwards. */}
      <Transactions
        transactions={transactions}
        isLoading={loading}
        onRefunded={refresh}
      />
    </div>
  );
}
