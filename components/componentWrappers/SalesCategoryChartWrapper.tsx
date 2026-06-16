"use client";

import { useState } from "react";
import SalesCategoryChart from "../dashboardComponents/overviewDash/SalesCategoryChart";
import { useSalesByCategory } from "@/hooks/useSalesByCategory";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "../dashboardComponents/staffDash/DateRangeFilter";

function getDefaultDateRange(): DateRangeValue {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  return { startDate: start, endDate: end };
}

export default function SalesCategoryChartWrapper() {
  const [dateRange, setDateRange] =
    useState<DateRangeValue>(getDefaultDateRange);

  const { data, isLoading, error } = useSalesByCategory(
    dateRange.startDate,
    dateRange.endDate,
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Sales by Category
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Revenue share across product categories
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      ) : error || !data ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Failed to load category data
        </p>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            No category data found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No sales recorded for the selected date range.
          </p>
        </div>
      ) : (
        <SalesCategoryChart data={data} />
      )}
    </div>
  );
}
