const HOUR_COUNT = 24;
const DAY_COUNT = 7;

/**
 * Loading skeleton for <Heatmap />. Mirrors its default "Current Week" layout:
 * header + legend, view/colour controls, a 7×24 cell grid, and the 3-up stats
 * footer — so the page doesn't shift once the real data arrives.
 */
export default function HeatmapSkeleton() {
  return (
    <div className="bg-white w-full animate-pulse">
      {/* ── Header + legend ── */}
      <div className="flex flex-row items-start justify-between mb-5 gap-3">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-72 bg-gray-100 rounded" />
        </div>

        {/* Low ▭▭▭ High */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-3 w-6 bg-gray-100 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-6 bg-gray-100 rounded" />
        </div>
      </div>

      {/* ── Controls: view toggle + colour picker ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
          <div className="h-6 flex-1 sm:flex-none sm:w-28 bg-white rounded-lg" />
          <div className="h-6 flex-1 sm:flex-none sm:w-28 bg-gray-200/60 rounded-lg" />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-10 bg-gray-100 rounded" />
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid (current-week view) ── */}
      <div className="overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: 1000 }}>
          {/* Hour headers */}
          <div className="flex mb-1 ml-14">
            {Array.from({ length: HOUR_COUNT }).map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className="h-3 w-5 bg-gray-100 rounded" />
              </div>
            ))}
          </div>

          {/* Day rows */}
          {Array.from({ length: DAY_COUNT }).map((_, row) => (
            <div key={row} className="flex items-center mb-1">
              {/* Day label + date */}
              <div className="w-14 shrink-0 pr-1 space-y-1">
                <div className="h-3 w-8 bg-gray-200 rounded" />
                <div className="h-2 w-10 bg-gray-100 rounded" />
              </div>

              {/* Hour cells */}
              <div className="flex flex-1 gap-0.5 sm:gap-1">
                {Array.from({ length: HOUR_COUNT }).map((_, col) => (
                  <div
                    key={col}
                    className="flex-1 h-8 sm:h-10 bg-gray-100 rounded-md sm:rounded-sm"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats footer ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between sm:flex-col sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0 last:border-b-0 last:pb-0"
          >
            <div className="h-3 w-20 bg-gray-100 rounded sm:mb-1" />
            <div className="flex flex-col items-end sm:items-center gap-1.5">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
