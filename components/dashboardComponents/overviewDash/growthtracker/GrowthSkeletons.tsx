/**
 * Loading skeletons for the Growth Tracker page. Each one mirrors the layout of
 * the component it stands in for, so the page doesn't shift when data arrives.
 */

/** Title + subtitle stack, matching <ComponentHeader />. */
function HeaderSkeleton({
  titleWidth = "w-40",
  subWidth = "w-60",
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

/** Faux bar chart body used by the chart-based skeletons. */
const BAR_HEIGHTS = [62, 88, 45, 92, 70, 55, 80, 60, 75, 50, 85, 65];

function ChartBodySkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className={`${height} w-full flex items-end gap-2 pt-4`}>
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

/** Centered legend chips. */
function LegendSkeleton({ items = 2 }: { items?: number }) {
  return (
    <div className="flex items-center justify-center gap-6 mt-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Matches the GrowthStatsWrapper grid of <GrowthTrackCard /> tiles:
 * label + icon tile, then a big value with "prev:" and a % badge.
 */
export function GrowthStatsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 md:p-6 w-full border rounded-2xl shadow-sm border-gray-100 bg-white"
        >
          {/* Label + icon */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
          </div>

          {/* Value + prev/badge row */}
          <div className="mt-4 md:mt-6">
            <div className="h-7 w-32 bg-gray-200 rounded" />
            <div className="flex items-center justify-between mt-1.5">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-5 w-14 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Matches <TargetVsActualChart /> — header with a target icon and a
 * "Set Targets" button, a 300px composed chart, and a legend.
 */
export function TargetVsActualSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
          <HeaderSkeleton titleWidth="w-44" subWidth="w-56" />
        </div>
        {/* "Set Targets" button */}
        <div className="h-7 w-24 bg-gray-200 rounded-xl shrink-0" />
      </div>

      <ChartBodySkeleton />
      <LegendSkeleton items={2} />
    </div>
  );
}

/** Matches <YearOverYearChart /> — header, 300px bar chart, legend. */
export function YearOverYearSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full animate-pulse">
      <div className="mb-2">
        <HeaderSkeleton titleWidth="w-48" subWidth="w-64" />
      </div>

      <ChartBodySkeleton />
      <LegendSkeleton items={2} />
    </div>
  );
}

/**
 * Matches <GrowthByCategory /> — header, then rows of
 * "category name + growth badge" over a progress bar, plus a Load More button.
 */
export function GrowthByCategorySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6 animate-pulse">
      <HeaderSkeleton titleWidth="w-44" subWidth="w-72" />

      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3 w-28 bg-gray-200 rounded" />
              <div className="h-5 w-16 bg-gray-200 rounded-full shrink-0" />
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Load More button */}
      <div className="h-8 w-32 bg-gray-100 rounded-lg mx-auto" />
    </div>
  );
}
