"use client";

import { useState } from "react";
import { MergedSalesItem } from "@/services/apiInventory";
import { ChartColumnBig } from "lucide-react";
import { classifySalesVelocity, type Velocity } from "@/lib/salesVelocity";
import {
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartPager,
} from "../chartCard";

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
  // the colours agree with the movement analysis
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
    <ChartCard
      icon={ChartColumnBig}
      title="Stock Movement Chart"
      info={{
        heading: "Reading this chart",
        // From classifySalesVelocity: colours come from the whole catalogue.
        body: "Units sold per product over the past 30 days, highest first, eight at a time. Bar width is against the busiest product in the whole catalogue, so a bar means the same thing on every page. The colour is how fast that product moves compared with the rest of your range.",
      }}
      subtitle="Units sold per item – fast vs slow movers (Past 30 days)"
      controls={
        totalPages > 1 && (
          <ChartPager
            first={start + 1}
            last={Math.min(start + PAGE_SIZE, totalItems)}
            total={totalItems}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            itemLabel="items"
          />
        )
      }
      className="flex-1"
    >
      {chartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ChartColumnBig
              size={24}
              style={{ color: CHART_PALETTE.subtitle }}
            />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No stock movement data available
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
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
                    className={`text-[13px] ${LABEL_W} shrink-0 truncate text-right leading-tight`}
                    style={{ color: CHART_PALETTE.title }}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <div
                    className="relative h-4 flex-1 overflow-hidden rounded-full"
                    style={{ backgroundColor: CHART_PALETTE.grid }}
                  >
                    <div
                      className="h-4 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: VELOCITY_COLOR[velocity],
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs tabular-nums ${VALUE_W} shrink-0 text-right`}
                    style={{ color: CHART_PALETTE.axis }}
                  >
                    {item.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* X-axis — gutters match the rows above so the ticks align */}
          <div className="mt-4 flex items-center gap-3">
            <div className={`${LABEL_W} shrink-0`} />

            <div className="flex flex-1 justify-between">
              {ticks.map((v) => (
                <span
                  key={v}
                  className="text-xs tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  {v.toLocaleString()}
                </span>
              ))}
            </div>

            <div className={`${VALUE_W} shrink-0`} />
          </div>

          <ChartLegend
            items={[
              { label: "Fast", color: VELOCITY_COLOR.fast, shape: "dot" },
              { label: "Normal", color: VELOCITY_COLOR.normal, shape: "dot" },
              { label: "Slow", color: VELOCITY_COLOR.slow, shape: "dot" },
            ]}
          />
        </>
      )}
    </ChartCard>
  );
}
