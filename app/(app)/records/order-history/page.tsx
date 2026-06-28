"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

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

export default function OrderHistoryPage() {
  const defaults = getDefaultDateRange();
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: defaults.startDate,
    endDate: defaults.endDate,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [transRes, statsRes] = await Promise.all([
          fetch(
            `/api/order-history/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          ),
          fetch(
            `/api/order-history/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
          ),
        ]);

        if (cancelled) return;

        if (transRes.ok) {
          const transJson = await transRes.json();
          setTransactions(transJson?.data ?? []);
        } else {
          setTransactions([]);
        }

        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson?.data ?? null);
        } else {
          setStats(null);
        }
      } catch {
        if (!cancelled) {
          setTransactions([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate]);

  const isEmpty = !transactions || transactions.length === 0;
  // const displayData = isEmpty ? mockTransactions : transactions;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      {/* ── Header ── */}
      <div className="max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        {isEmpty && !loading && <SampleDataBadge />}

        <div>
          <h1 className="font-bold text-xl md:text-2xl truncate">
            Order History
          </h1>

          <p className="text-xs text-gray-400 mt-0.5">
            Browse and search all transactions
          </p>
        </div>

        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* ── Stats ── */}
      <div className="mt-3">
        <OrderHistoryStats stats={stats} isLoading={loading} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-gray-500">
            Loading transactions...
          </span>
        </div>
      ) : (
        // ) : isEmpty ? (
        //   <Transactions transactions={displayData} />
        // ) : (
        <Transactions transactions={transactions} />
      )}
    </div>
  );
}
