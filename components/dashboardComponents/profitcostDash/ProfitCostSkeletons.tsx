import StatSkeleton from "@/components/ui/statskeleton";

/**
 * Loading skeletons for the Profit & Cost dashboard.
 *
 * Only the wrappers that `await` on the server suspend — Profit Stats,
 * Profit per Product and the Day × Time heatmap. The rest of the page's
 * components either fetch client-side (and render their own loading state) or
 * are mock-driven, so they don't get a Suspense skeleton.
 */

/** Title + subtitle stack, matching <ComponentHeader />. */
function HeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-72",
}: {
  titleWidth?: string;
  subWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-4 ${titleWidth} bg-gray-200 rounded`} />
      <div className={`h-3 ${subWidth} bg-gray-100 rounded`} />
    </div>
  );
}

/** Matches ProfitStatsWrapper's grid of stat tiles. */
export function ProfitStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Matches <ProfitPerProduct /> — header, a search box, a 6-column table
 * (S.No / Product / Revenue / COGS / Profit / Margin) and a pagination footer.
 */
export function ProfitPerProductSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full overflow-hidden animate-pulse">
      <div className="min-w-0 mb-4">
        <HeaderSkeleton titleWidth="w-40" subWidth="w-72" />
      </div>

      {/* Search */}
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="h-9 w-full sm:w-64 bg-gray-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["w-8", "w-20", "w-16", "w-14", "w-14", "w-14"].map((w, i) => (
                <th key={i} className="pb-3 pt-3 px-4">
                  <div
                    className={`h-3 ${w} bg-gray-100 rounded ${
                      i >= 2 ? "ml-auto" : ""
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3 px-4">
                  <div className="h-3 w-4 bg-gray-100 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </td>
                {Array.from({ length: 3 }).map((_, j) => (
                  <td key={j} className="py-3 px-4">
                    <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
                  </td>
                ))}
                <td className="py-3 px-4">
                  <div className="h-5 w-14 bg-gray-100 rounded-full ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="h-6 w-24 bg-gray-100 rounded-lg" />
        <div className="h-3 w-40 bg-gray-100 rounded" />
        <div className="h-6 w-24 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

const HEATMAP_DAYS = 7;
const HEATMAP_HOURS = 24;

/**
 * Matches <DayTimeProfitHeatmap /> — header, a sticky day-label column beside a
 * 7×24 hour grid, and the Loss → High Profit legend.
 */
export function DayTimeProfitHeatmapSkeleton() {
  const columns = `repeat(${HEATMAP_HOURS}, minmax(60px, 1fr))`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none animate-pulse">
      <div className="mb-4">
        <HeaderSkeleton titleWidth="w-52" subWidth="w-80" />
      </div>

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex">
            {/* Sticky day-label column */}
            <div className="sticky left-0 z-10 bg-white shrink-0">
              <div className="h-6 mb-1 w-12" />
              {Array.from({ length: HEATMAP_DAYS }).map((_, i) => (
                <div key={i} className="h-10 flex gap-1 items-center mb-1">
                  <div className="w-12 pl-1">
                    <div className="h-3 w-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="min-w-0">
              {/* Hour headers */}
              <div
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: columns }}
              >
                {Array.from({ length: HEATMAP_HOURS }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 flex items-center justify-center"
                  >
                    <div className="h-3 w-8 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {Array.from({ length: HEATMAP_DAYS }).map((_, row) => (
                <div
                  key={row}
                  className="grid gap-1 mb-1"
                  style={{ gridTemplateColumns: columns }}
                >
                  {Array.from({ length: HEATMAP_HOURS }).map((_, col) => (
                    <div key={col} className="h-10 rounded bg-gray-100" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <div className="h-3 w-8 bg-gray-100 rounded" />
        <div className="w-4 h-4 rounded bg-gray-200" />
        <div className="h-3 w-2 bg-gray-100 rounded" />
        <div className="h-3 w-6 bg-gray-100 rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded bg-gray-200" />
          ))}
        </div>
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
