/**
 * Loading skeletons for the Employee Performance dashboard. Each mirrors the
 * layout of the component it stands in for, so the page doesn't shift when the
 * server-awaited data arrives.
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

const BAR_HEIGHTS = [58, 82, 46, 90, 68, 74, 52, 86, 62, 48];

function BarsSkeleton() {
  return (
    <div className="w-full h-full flex items-end gap-2 pt-4">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-100 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Matches <StaffBoxContainer /> — a search + role-filter row above staff cards
 * laid out 3-up on large screens.
 */
export function StaffStatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-4 -mx-2 sm:mx-0 animate-pulse">
      {/* Search + role filter */}
      <div className="flex flex-row items-start sm:items-center justify-between gap-3 mb-4 px-2 sm:px-0">
        <div className="h-9 w-full sm:w-64 bg-gray-100 rounded-lg" />
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 shrink-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-white rounded-md" />
          ))}
        </div>
      </div>

      {/* Staff cards */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-3 flex gap-3 px-2 sm:px-0">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[85vw] sm:w-[360px] lg:w-auto lg:shrink bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Metric rows */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-3.5 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Matches <StaffSalesChart /> — header with an action button, a row of staff
 * chips, then the chart.
 */
export function StaffSalesChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 w-full animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <HeaderSkeleton titleWidth="w-48" subWidth="w-72" />
        <div className="h-7 w-28 bg-gray-100 rounded-xl shrink-0" />
      </div>

      {/* Staff chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>

      <div className="h-55 md:h-75">
        <BarsSkeleton />
      </div>
    </div>
  );
}

/** Matches <RevenueStaffChart /> — header then the revenue chart. */
export function StaffRevenueSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 w-full animate-pulse">
      <div className="mb-6">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-64" />
      </div>

      <div className="h-55 md:h-75">
        <BarsSkeleton />
      </div>
    </div>
  );
}

/**
 * Matches <LatestShifts /> — header with a segmented filter, then a 5-column
 * shifts table.
 */
export function LatestShiftsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 w-full animate-pulse">
      <div className="mb-6 flex items-center justify-between gap-3">
        <HeaderSkeleton titleWidth="w-36" subWidth="w-56" />
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-white rounded-lg" />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["w-10", "w-24", "w-20", "w-20", "w-16"].map((w, i) => (
                <th key={i} className="pb-3 px-3 first:pl-0">
                  <div className={`h-3 ${w} bg-gray-100 rounded`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3 pl-0 pr-3">
                  <div className="h-3 w-6 bg-gray-100 rounded" />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </td>
                <td className="py-3 px-3">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </td>
                <td className="py-3 px-3">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
