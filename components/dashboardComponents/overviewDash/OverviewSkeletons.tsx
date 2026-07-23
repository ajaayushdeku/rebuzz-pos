/**
 * Loading skeletons for the Overview dashboard. Each mirrors the layout of the
 * component it replaces so the page doesn't shift when data arrives.
 */

/** Title + subtitle stack, matching <ComponentHeader />. */
function HeaderSkeleton({
  titleWidth = "w-40",
  subWidth = "w-56",
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

/** Faux bar-chart body. */
function BarsSkeleton({ heights }: { heights: number[] }) {
  return (
    <div className="w-full h-full flex items-end gap-2 pt-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-100 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

const WEEK_BARS = [58, 82, 46, 90, 68, 74, 52];
const HOUR_BARS = [30, 45, 62, 80, 95, 72, 58, 84, 66, 48, 38, 55];

/** Matches <WeeklyRevenueChart /> — "Daily Sales Trend" card with a bar chart. */
export function WeeklyRevenueChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6 animate-pulse">
      <HeaderSkeleton titleWidth="w-40" subWidth="w-56" />
      <div className="h-56 md:h-72">
        <BarsSkeleton heights={WEEK_BARS} />
      </div>
    </div>
  );
}

/**
 * Matches <HourlySalesTrend /> — header plus the hour-range controls
 * (preset select, divider, from/to inputs) and a 280px chart.
 */
export function HourlySalesTrendSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm p-5 w-full animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-72" />

        {/* Hour range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-7 w-44 bg-gray-100 rounded-lg" />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <div className="h-3 w-8 bg-gray-100 rounded" />
          <div className="h-7 w-14 bg-gray-100 rounded-lg" />
          <div className="h-3 w-6 bg-gray-100 rounded" />
          <div className="h-7 w-14 bg-gray-100 rounded-lg" />
        </div>
      </div>

      <div className="h-[280px]">
        <BarsSkeleton heights={HOUR_BARS} />
      </div>
    </div>
  );
}

/**
 * Matches <TopItems /> — header with an icon tile, a divider, then ranked rows
 * of "rank badge + product name/sales" with revenue on the right.
 */
export function TopItemsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex-1 bg-surface-card rounded-2xl border border-surface-border shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <HeaderSkeleton titleWidth="w-36" subWidth="w-52" />
        <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
      </div>

      <div className="h-px bg-gray-100 mb-1" />

      <div className="mt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-16 bg-gray-200 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Matches <RecentTransactions /> — header with a "View all" link and a
 * 4-column table (Order / Customer / Amount / Status).
 */
export function RecentTransactionsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex-1 bg-surface-card rounded-2xl border border-surface-border shadow-sm p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-60" />
        <div className="h-8 w-24 bg-gray-100 rounded-xl shrink-0" />
      </div>

      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["w-14", "w-20", "w-16", "w-14"].map((w, i) => (
                <th key={i} className="pb-3 pt-3 px-4">
                  <div
                    className={`h-3 ${w} bg-gray-100 rounded ${
                      i === 2 ? "ml-auto" : i === 3 ? "mx-auto" : ""
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
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
