"use client";

import { CHART_PALETTE } from "../dashboardComponents/chartCard";

export interface LegendCategory {
  name: string;
  color: string;
}

/**
 * Legend for a many-series chart: the same swatch-and-label pair as the shared
 * ChartLegend, laid out to the right of the chart it labels.
 *
 * Every category is listed, however many there are — the list wraps onto as
 * many rows as it needs.
 */
export default function CategoryLegend({
  categories,
}: {
  categories: LegendCategory[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-x-5 gap-y-1.5 pr-2">
      {categories.map((cat) => (
        <span
          key={cat.name}
          title={cat.name}
          className="inline-flex max-w-[11rem] items-center gap-1.5"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: cat.color }}
          />
          {/* Grey, not the series colour: pale swatches like amber or cyan are
              legible as a block and not as small text. */}
          <span
            className="truncate text-[13px]"
            style={{ color: CHART_PALETTE.title }}
          >
            {cat.name}
          </span>
        </span>
      ))}
    </div>
  );
}
