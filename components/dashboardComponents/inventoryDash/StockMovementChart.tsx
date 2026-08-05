"use client";

import { useState } from "react";
import { ComponentHeader } from "@/components/ComponentHeader";
import { MergedSalesItem } from "@/services/apiInventory";
import { ChartColumnBig, ChevronLeft, ChevronRight } from "lucide-react";
import { classifySalesVelocity, type Velocity } from "@/lib/salesVelocity";

const PAGE_SIZE = 8;

/** Gutter widths, shared by the bars and the axis so ticks line up. */
const LABEL_W = "w-24";
const VALUE_W = "w-10";

const VELOCITY_COLOR: Record<Velocity, string> = {
  fast: "#22c55e", // green
  normal: "#3b82f6", // blue
  slow: "#f59e0b", // amber
};

/** Axis ticks, deduped — a small max (e.g. 2) would otherwise repeat values. */
function buildTicks(max: number): number[] {
  const raw = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  return Array.from(new Set(raw));
}

export default function StockMovementChart({
  items,
}: {
  items: MergedSalesItem[];
}) {
  const [page, setPage] = useState(0);

  // Velocity comes from the whole catalogue, not just the bars on screen, so
  // the colours agree with the movement analysis and the fast/slow panels.
  const { ranked, byName } = classifySalesVelocity(items);

  // Show ALL products with pagination instead of slicing to a fixed max.
  const totalItems = ranked.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const chartItems = ranked.slice(start, start + PAGE_SIZE);

  // The max value across ALL items, so bar widths are comparable across pages.
  const max = Math.max(...ranked.map((i) => i.count), 1);
  const ticks = buildTicks(max);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ChartColumnBig size={15} className="text-blue-600" />
          </div>
          <ComponentHeader
            title="Stock Movement Chart"
            subHeader=" Units sold per item – fast vs slow movers (Past 30 days)"
          />
        </div>
      </div>

      {chartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <ChartColumnBig size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {" "}
            No stock movement data available
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Stock Movement data will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {chartItems.map((item) => {
              const pct = (item.count / max) * 100;
              const velocity = byName.get(item.name) ?? "normal";

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className={`text-xs text-gray-500 ${LABEL_W} text-right shrink-0 leading-tight truncate`}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                    <div
                      className="h-4 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: VELOCITY_COLOR[velocity],
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs text-gray-400 ${VALUE_W} text-right shrink-0`}
                  >
                    {item.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* X-axis — gutters match the rows above so the ticks align */}
          <div className="flex items-center gap-3 mt-4">
            <div className={`${LABEL_W} shrink-0`} />

            <div className="flex-1 flex justify-between">
              {ticks.map((v) => (
                <span key={v} className="text-xs text-gray-400">
                  {v.toLocaleString()}
                </span>
              ))}
            </div>

            <div className={`${VALUE_W} shrink-0`} />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {(
              [
                ["fast", "Fast"],
                ["normal", "Normal"],
                ["slow", "Slow"],
              ] as const
            ).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: VELOCITY_COLOR[key] }}
                />
                <span className="text-[11px] font-medium text-gray-500">
                  {label}
                </span>
              </span>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                  currentPage === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="text-xs text-gray-400 font-medium">
                Page {currentPage + 1} of {totalPages} · {totalItems} items
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                  currentPage >= totalPages - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
