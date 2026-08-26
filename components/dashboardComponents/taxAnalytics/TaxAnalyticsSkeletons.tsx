/**
 * Loading skeletons for the Tax Analytics dashboard.
 *
 * The tax page is a client page with no `async` wrappers, so nothing suspends —
 * loading is handled inside each component. These are body-only skeletons
 * (the card + <ComponentHeader /> already render above the loading branch).
 */

/** Summary strip: a left label/value pair, divider, then two right pairs. */
function SummaryStripSkeleton() {
  return (
    <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="min-w-0 space-y-1.5">
          <div className="h-2.5 w-20 bg-gray-100 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="h-7 w-px bg-gray-100" />

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right space-y-1.5">
          <div className="h-2.5 w-16 bg-gray-100 rounded ml-auto" />
          <div className="h-3.5 w-14 bg-gray-200 rounded ml-auto" />
        </div>
        <div className="hidden sm:block h-7 w-px bg-gray-100" />
        <div className="hidden sm:block text-right space-y-1.5">
          <div className="h-2.5 w-16 bg-gray-100 rounded ml-auto" />
          <div className="h-3.5 w-14 bg-gray-200 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

const RANKED_BAR_WIDTHS = ["92%", "74%", "58%", "44%", "30%"];

/**
 * Body skeleton for the ranked horizontal bar cards — <HighestTaxGenerated />
 * and <TaxByCategory />: a summary strip above ~40px-per-row bars.
 */
export function TaxRankedChartSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <SummaryStripSkeleton />

      <div className="mt-2 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 flex items-center gap-3">
            <div className="h-3 w-24 bg-gray-200 rounded shrink-0" />
            <div className="flex-1 h-6 bg-gray-100 rounded-r-md">
              <div
                className="h-6 bg-gray-200 rounded-r-md"
                style={{
                  width: RANKED_BAR_WIDTHS[i % RANKED_BAR_WIDTHS.length],
                }}
              />
            </div>
            <div className="h-3 w-14 bg-gray-100 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Body skeleton for <TaxOnRefundedBills /> — a 3-up grid of stat tiles. */
export function TaxRefundStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded mt-1.5" />
        </div>
      ))}
    </div>
  );
}

/**
 * Body skeleton for <TaxableVsNonTaxableItems /> — a donut on the left, content
 * on the right, then a 3-up stats row.
 */
export function TaxableSplitSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-center">
        {/* Donut */}
        <div className="flex justify-center">
          <div className="w-[180px] h-[180px] rounded-full border-[26px] border-gray-100" />
        </div>

        {/* Legend rows */}
        <div className="space-y-3 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
              <div className="h-3 w-12 bg-gray-100 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The grouped bars a month gets in the trend chart, at a plausible spread. */
const TREND_BAR_HEIGHTS = [
  [55, 38],
  [72, 44],
  [48, 30],
  [86, 60],
  [64, 41],
  [78, 52],
];

/**
 * Body skeleton for <MonthlyTaxTrendChart /> — six months of grouped bars
 * sitting on an axis, so the shape is recognisable before the data lands.
 */
export function TaxTrendChartSkeleton() {
  return (
    <div className="h-[280px] flex flex-col animate-pulse">
      <div className="flex-1 flex items-end justify-between gap-3 px-2">
        {TREND_BAR_HEIGHTS.map(([a, b], i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1">
            <div
              className="w-1/3 bg-gray-200 rounded-t"
              style={{ height: `${a}%` }}
            />
            <div
              className="w-1/3 bg-gray-100 rounded-t"
              style={{ height: `${b}%` }}
            />
          </div>
        ))}
      </div>

      {/* Axis + legend */}
      <div className="h-px bg-gray-100 mt-2" />
      <div className="flex justify-between px-2 mt-2">
        {TREND_BAR_HEIGHTS.map((_, i) => (
          <div key={i} className="h-2.5 w-8 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-200" />
            <div className="h-2.5 w-14 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Body skeleton for <TaxRateBreakdown /> — two side-by-side donut-and-list
 * groups, matching the regular / grouped split the card renders.
 */
export function TaxRateBreakdownSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group}>
          <div className="h-2.5 w-32 bg-gray-100 rounded mb-4" />

          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <div className="absolute inset-0 rounded-full bg-gray-200" />
              <div className="absolute inset-[22%] rounded-full bg-white" />
            </div>

            {/* Legend rows */}
            <div className="flex-1 space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-200 shrink-0" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-14 bg-gray-200 rounded ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Body skeleton for <WhatChangedAndWhy /> — a headline figure over the
 * this-month / last-month comparison rows.
 */
export function TaxComparisonSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-baseline gap-3">
        <div className="h-7 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2.5 last:border-0"
          >
            <div className="h-3 w-36 bg-gray-100 rounded" />
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-3.5 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Body skeleton for figure cards — <IncomeTaxProvision /> and the like: a
 * headline amount over a short list of contributing lines.
 */
export function TaxFigureCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-2.5 w-28 bg-gray-100 rounded" />
        <div className="h-8 w-40 bg-gray-200 rounded" />
      </div>

      <div className="space-y-2.5 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="h-3 w-32 bg-gray-100 rounded" />
            <div className="h-3.5 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
