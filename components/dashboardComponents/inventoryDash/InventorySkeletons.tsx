/**
 * Loading skeletons for the Inventory dashboard. The inventory wrappers use
 * suspense queries, so these render as Suspense fallbacks and mirror each
 * component's layout to avoid a shift when data arrives.
 */

/** Title + subtitle stack, matching <ComponentHeader />. */
function HeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-64",
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

/** Matches <InventoryAlerts /> — stacked alert banners. */
export function InventoryAlertsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3 mb-6 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
        >
          <div className="w-4 h-4 rounded-full bg-gray-200 mt-0.5 shrink-0" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Matches <ProductCardGrid /> — search/sort toolbar above a card grid. */
export function ProductCardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="animate-pulse">
      {/* Toolbar: search + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="h-9 w-full sm:w-72 bg-gray-100 rounded-lg" />
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-9 w-40 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-2"
          >
            <div className="h-2 rounded-lg bg-gray-200 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Matches <FastSlowMovingItems /> — two side-by-side cards, each listing
 * items as bordered rows.
 */
export function FastSlowMovingItemsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, card) => (
        <div
          key={card}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
        >
          <HeaderSkeleton titleWidth="w-36" subWidth="w-52" />
          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100"
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const MOVEMENT_BAR_WIDTHS = ["88%", "70%", "56%", "42%", "28%"];

/**
 * Matches <StockMovementChart /> — a header above rows of
 * "label + horizontal progress bar".
 */
export function StockMovementChartSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1 animate-pulse">
      <div className="mb-6">
        <HeaderSkeleton titleWidth="w-40" subWidth="w-56" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-15 bg-gray-200 rounded shrink-0" />
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 bg-gray-200 rounded-full"
                style={{
                  width: MOVEMENT_BAR_WIDTHS[i % MOVEMENT_BAR_WIDTHS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Matches <InventoryMovementAnalysis /> — a header above category blocks
 * separated by dividers.
 */
export function InventoryMovementAnalysisSkeleton({
  rows = 4,
}: {
  rows?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1 animate-pulse">
      <div className="mb-6">
        <HeaderSkeleton titleWidth="w-48" subWidth="w-60" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="h-3 w-28 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Matches <PredictiveRestockingSuggestions /> — a header above a 4-column
 * restocking table.
 */
export function PredictiveRestockingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
      <div className="mb-6">
        <HeaderSkeleton titleWidth="w-52" subWidth="w-72" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["w-24", "w-20", "w-20", "w-24"].map((w, i) => (
                <th key={i} className="pb-3 pt-3 px-4">
                  <div
                    className={`h-3 ${w} bg-gray-100 rounded ${
                      i > 0 ? "ml-auto" : ""
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
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-20 bg-gray-100 rounded-full ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
