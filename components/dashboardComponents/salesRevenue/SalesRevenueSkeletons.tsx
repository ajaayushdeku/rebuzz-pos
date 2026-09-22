/**
 * Loading skeletons for the Sales & Revenue dashboard.
 *
 * Only the wrappers that actually `await` on the server suspend — Peak Hours
 * and Peak Days. The rest of the page's components fetch client-side and render
 * their own loading states, so they don't get (and can't use) a Suspense
 * skeleton.
 *
 * Both cards use the shared <ChartCard /> frame, so the skeletons copy it:
 * hairline border, no shadow, the same radius and padding. The colours are
 * written out rather than read from CHART_PALETTE because this file renders on
 * the server and chartCard.tsx is a client module — its constants do not
 * arrive here as plain values.
 */

/** <ChartCard />'s frame: `border` is CHART_PALETTE.border. */
const CARD_FRAME =
  "relative w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5 animate-pulse";

/**
 * <ChartCard />'s header row: the 36px icon square, title over subtitle, and
 * the "Selected range" pill on the right.
 */
function HeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-80",
}: {
  titleWidth?: string;
  subWidth?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl border border-blue-100 bg-blue-50/60" />
        <div className="min-w-0 space-y-1.5">
          <div className={`h-4 ${titleWidth} max-w-full rounded bg-gray-200`} />
          <div className={`h-3 ${subWidth} max-w-full rounded bg-gray-100`} />
        </div>
      </div>
      <div className="h-5 w-28 rounded-full border border-[#dadce0] bg-white" />
    </div>
  );
}

/** <ChartLegend />: under the chart, on the right. */
function LegendSkeleton({ items = 1 }: { items?: number }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-x-5 pr-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-100" />
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
 * Matches <PeakHoursAnalysis /> — header, the hour-range toolbar (preset
 * select, then From/To inputs), then a 280px hourly bar chart.
 */
export function PeakHoursAnalysisSkeleton() {
  return (
    <div className={CARD_FRAME}>
      <HeaderSkeleton titleWidth="w-44" subWidth="w-80" />

      {/* Hour range toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="h-10 w-[210px] rounded-xl border border-gray-200 bg-white" />
        <div className="mx-1 h-6 w-px bg-[#dadce0]" />
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-8 rounded bg-gray-100" />
          <div className="h-8 w-14 rounded-lg border border-[#dadce0] bg-white" />
          <div className="h-3 w-6 rounded bg-gray-100" />
          <div className="h-8 w-14 rounded-lg border border-[#dadce0] bg-white" />
        </div>
      </div>

      {/* Chart — square bars, like the card's */}
      <div className="flex h-[280px] w-full items-end gap-1 pt-4">
        {HOUR_BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100"
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
    <div className={CARD_FRAME}>
      <HeaderSkeleton titleWidth="w-44" subWidth="w-80" />

      {/* Chart — square bars, like the card's */}
      <div className="flex h-[300px] w-full items-end justify-between gap-4 pt-4">
        {DAY_BARS.map(([a, b], i) => (
          <div key={i} className="flex flex-1 items-end justify-center gap-1">
            <div className="w-1/3 bg-gray-100" style={{ height: `${a}%` }} />
            <div className="w-1/3 bg-gray-100/70" style={{ height: `${b}%` }} />
          </div>
        ))}
      </div>

      <LegendSkeleton items={2} />
    </div>
  );
}
