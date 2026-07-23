/**
 * Loading skeletons for the Sales & Revenue dashboard.
 *
 * Only the wrappers that actually `await` on the server suspend — Peak Hours
 * and Peak Days. The rest of the page's components fetch client-side and render
 * their own loading states, so they don't get (and can't use) a Suspense
 * skeleton.
 */

/** Title + subtitle stack, matching <ComponentHeader />. */
function HeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-80",
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

/** Centered legend chips. */
function LegendSkeleton({ items = 1 }: { items?: number }) {
  return (
    <div className="flex items-center justify-center gap-6 mt-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-200" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// 24 hourly bars, mimicking a daily trade curve.
const HOUR_BARS = [
  8, 6, 5, 4, 4, 6, 14, 26, 42, 58, 70, 86, 95, 88, 72, 64, 58, 66, 78, 84, 62,
  40, 24, 14,
];

/**
 * Matches <PeakHoursAnalysis /> — header plus the hour-range filter
 * (preset select over From/To inputs), then a 280px hourly bar chart.
 */
export function PeakHoursAnalysisSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm p-5 w-full animate-pulse">
      {/* Header + hour range filter */}
      <div className="flex flex-row justify-between gap-3 mb-5">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-80" />

        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-44 bg-gray-100 rounded-lg" />
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-8 bg-gray-100 rounded" />
              <div className="h-7 w-14 bg-gray-100 rounded-lg" />
              <div className="h-3 w-6 bg-gray-100 rounded" />
              <div className="h-7 w-14 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full flex items-end gap-1 pt-4">
        {HOUR_BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <LegendSkeleton items={1} />
    </div>
  );
}

// 7 weekdays × 2 series (orders + sales).
const DAY_BARS: [number, number][] = [
  [55, 40],
  [70, 58],
  [62, 48],
  [88, 74],
  [95, 82],
  [78, 66],
  [46, 34],
];

/**
 * Matches <PeakDaysAnalysis /> — header, then a 300px grouped bar chart with
 * one pair of bars (orders / sales) per weekday.
 */
export function PeakDaysAnalysisSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm p-5 w-full animate-pulse">
      <div className="mb-4 md:mb-6">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-80" />
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full flex items-end justify-between gap-4 pt-4">
        {DAY_BARS.map(([a, b], i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1">
            <div
              className="w-1/3 bg-gray-100 rounded-t-lg"
              style={{ height: `${a}%` }}
            />
            <div
              className="w-1/3 bg-gray-100/70 rounded-t-lg"
              style={{ height: `${b}%` }}
            />
          </div>
        ))}
      </div>

      <LegendSkeleton items={2} />
    </div>
  );
}
