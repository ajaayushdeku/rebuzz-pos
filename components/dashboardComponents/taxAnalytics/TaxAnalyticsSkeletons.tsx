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
