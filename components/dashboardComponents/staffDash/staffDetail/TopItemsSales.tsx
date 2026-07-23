"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Package } from "lucide-react";
import type { DateRangeValue } from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { ComponentHeader } from "@/components/ComponentHeader";

interface TopItem {
  itemId: string;
  itemName: string;
  totalQuantity: number;
}

interface TopItemsSalesProps {
  employeeId: string;
  dateRange: DateRangeValue;
}

const MAX_ITEMS = 8;

function getBarColor(index: number, count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 0.6) return "#22c55e"; // fast — green
  if (ratio >= 0.3) return "#3b82f6"; // normal — blue
  return "#f59e0b"; // slow — amber
}

export default function TopItemsSales({
  employeeId,
  dateRange,
}: TopItemsSalesProps) {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBillsAnalyzed, setTotalBillsAnalyzed] = useState(0);

  useEffect(() => {
    if (!employeeId) return;

    const fetchTopItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/staff/${employeeId}/top-items?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch top items");
        }

        const data = await res.json();
        if (data?.status === "success") {
          setItems(data.data.items ?? []);
          setTotalBillsAnalyzed(data.data.totalBillsAnalyzed ?? 0);
        } else {
          throw new Error(data?.error || "Failed to fetch top items");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load top items",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopItems();
  }, [employeeId, dateRange.startDate, dateRange.endDate]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>

          <ComponentHeader
            title="Top Items Sold"
            subHeader=" Loading top selling items..."
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>

          <ComponentHeader
            title="Top Items Sold"
            subHeader="Unable to load data"
          />
        </div>

        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              const fetchAgain = async () => {
                try {
                  const res = await fetch(
                    `/api/staff/${employeeId}/top-items?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
                  );
                  if (!res.ok) throw new Error("Failed");
                  const data = await res.json();
                  if (data?.status === "success") {
                    setItems(data.data.items ?? []);
                    setTotalBillsAnalyzed(data.data.totalBillsAnalyzed ?? 0);
                  } else {
                    throw new Error(data?.error || "Failed");
                  }
                } catch {
                  setError("Failed to load top items");
                } finally {
                  setLoading(false);
                }
              };
              fetchAgain();
            }}
            className="mt-3 px-4 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>

          <ComponentHeader
            title=" Top Items Sold"
            subHeader=" Units sold per item – fast vs slow movers"
          />
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No sales data available
          </p>
          <p className="text-xs text-gray-400 mt-1">
            No top items sold data for this period
          </p>
        </div>
      </div>
    );
  }

  // ── Render chart ──────────────────────────────────────────────────────────

  const chartItems = items.slice(0, MAX_ITEMS);
  const max = Math.max(...chartItems.map((i) => i.totalQuantity), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 ">
      <div className="flex items-center gap-3 mb-0.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <TrendingUp size={16} className="text-emerald-500" />
        </div>

        <ComponentHeader
          title="Top Items Sold"
          subHeader="Units sold per item by the employee"
        />
      </div>

      <div className="space-y-3 mt-6">
        {chartItems.map((item, idx) => {
          const pct = (item.totalQuantity / max) * 100;
          return (
            <div key={item.itemId} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-15 text-right shrink-0 leading-tight truncate">
                {item.itemName}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getBarColor(idx, item.totalQuantity, max),
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                {item.totalQuantity}
              </span>
            </div>
          );
        })}
      </div>

      {/* X-axis */}
      <div className="flex items-center gap-3 mt-4">
        <div className="w-24 shrink-0" />

        <div className="flex-1 flex justify-between">
          {[
            0,
            Math.round(max * 0.25),
            Math.round(max * 0.5),
            Math.round(max * 0.75),
            max,
          ].map((v) => (
            <span key={v} className="text-xs text-gray-400">
              {v}
            </span>
          ))}
        </div>

        <div className="w-8 shrink-0" />
      </div>
    </div>
  );
}
