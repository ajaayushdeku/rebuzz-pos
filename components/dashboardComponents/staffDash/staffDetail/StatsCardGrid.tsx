"use client";

import {
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type { StaffOverview } from "./staffDetailHelpers";

interface StatsCardGridProps {
  overview: StaffOverview | null;
  totalPayIn: number;
  totalPayOut: number;
  showOnlyOrders?: boolean;
}

export default function StatsCardGrid({
  overview,
  totalPayIn,
  totalPayOut,
  showOnlyOrders = false,
}: StatsCardGridProps) {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {showOnlyOrders ? (
        /* Staff role: only show Orders */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-blue-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Total Orders
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">
            {String(overview?.totalOrders ?? 0)}
          </p>
        </div>
      ) : (
        <>
          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart size={16} className="text-blue-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Total Orders (All Time)
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {String(overview?.totalOrders ?? 0)}
            </p>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-indigo-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Total Sales
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {String(overview?.totalSales ?? 0)}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign size={16} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Total Revenue
              </span>
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Clock size={16} className="text-indigo-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Avg Time
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {overview?.avgTime ?? "—"}
            </p>
          </div>

          {/* Total Pay In */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ArrowDownLeft size={16} className="text-emerald-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Total Pay In
              </span>
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <ArrowUpRight size={16} className="text-red-500" />
              </div>
              <span className="text-xs text-gray-400 font-medium">
                Total Pay Out
              </span>
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
