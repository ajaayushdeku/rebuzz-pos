"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface LegendCategory {
  name: string;
  color: string;
}

/** Above this many categories the legend collapses instead of filling the card. */
const COLLAPSE_ABOVE = 8;

/** Roughly two rows of chips. */
const COLLAPSED_MAX_HEIGHT = "5rem";

/**
 * Legend for a many-series chart.
 *
 * A plain wrapping list is fine for four or five purposes and unreadable at
 * fifteen — it grows taller than the chart it labels. Past a threshold this
 * clamps to about two rows, scrolls inside that box, fades the cut-off edge so
 * it reads as "more below", and offers a toggle to open it fully.
 */
export default function CategoryLegend({
  categories,
}: {
  categories: LegendCategory[];
}) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = categories.length > COLLAPSE_ABOVE;
  const clamped = collapsible && !expanded;

  return (
    <div className="mt-3">
      <div
        className={`relative ${
          clamped
            ? "overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : ""
        }`}
        style={
          clamped
            ? {
                maxHeight: COLLAPSED_MAX_HEIGHT,
                // Fades the last few pixels so a clipped row reads as "there
                // is more" rather than as a row that happens to end there.
                maskImage:
                  "linear-gradient(to bottom, black calc(100% - 1.25rem), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black calc(100% - 1.25rem), transparent)",
              }
            : undefined
        }
      >
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
          {categories.map((cat) => (
            <span
              key={cat.name}
              title={cat.name}
              className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50/70 px-2 py-0.5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: cat.color }}
              />
              {/* Grey, not the series colour: pale swatches like amber or
                  cyan are legible as a block and not as 11px text. */}
              <span className="truncate text-xs text-gray-600">{cat.name}</span>
            </span>
          ))}
        </div>
      </div>

      {collapsible && (
        <div className="mt-1.5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Show all {categories.length}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
