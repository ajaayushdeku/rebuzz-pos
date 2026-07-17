"use client";

import {
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { StaffOverview } from "./staffDetailHelpers";

interface StatsCardGridProps {
  overview: StaffOverview | null;
  totalPayIn: number;
  totalPayOut: number;
  showOnlyOrders?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function StatsCardGrid({
  overview,
  totalPayIn,
  totalPayOut,
  showOnlyOrders = false,
  loading = false,
  error = null,
  onRetry,
}: StatsCardGridProps) {
  const { currency } = useCurrency();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: showOnlyOrders ? 1 : 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
          >
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 truncate">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!overview) {
    return (
      <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm px-4 py-8 text-center">
        <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <BarChart3 size={20} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">No stats available</p>
        <p className="text-xs text-gray-400 mt-1">
          No activity recorded for this period
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      {showOnlyOrders ? (
        /* Staff role: only show Orders */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">
              Total Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <ShoppingCart size={16} className="text-blue-500" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">
            {String(overview?.totalOrders ?? 0)}
          </p>
        </div>
      ) : (
        <>
          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Total Orders (All Time)
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} className="text-blue-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {String(overview?.totalOrders ?? 0)}
            </p>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Total Sales
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {String(overview?.totalSales ?? 0)}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <DollarSign size={16} className="text-green-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {formatCurrencySymbol(
                overview?.totalRevenue ?? 0,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>

          {/* Avg Time */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Avg Time
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {overview?.avgTime ?? "—"}
            </p>
          </div>

          {/* Total Pay In */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Total Pay In
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={16} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {formatCurrencySymbol(
                totalPayIn,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>

          {/* Total Pay Out */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Total Pay Out
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {formatCurrencySymbol(
                totalPayOut,
                currency.symbol,
                currency.locale,
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
