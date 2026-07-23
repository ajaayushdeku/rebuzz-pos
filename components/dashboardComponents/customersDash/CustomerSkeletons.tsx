/**
 * Loading skeletons for the Customers dashboard. Each mirrors the layout of the
 * component it stands in for, so the page doesn't shift when the server-awaited
 * data arrives.
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

const BAR_HEIGHTS = [58, 82, 46, 90, 68, 74, 52, 86];

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

/** Matches <LoyaltyTierChart /> — header then a bar chart. */
export function LoyaltyTierChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full min-w-0 animate-pulse">
      <div className="mb-4">
        <HeaderSkeleton titleWidth="w-40" subWidth="w-56" />
      </div>
      <div className="h-44 sm:h-56 md:h-64">
        <BarsSkeleton />
      </div>
    </div>
  );
}

/** Matches <CustomerSegmentationChart /> — donut above a 2-column legend. */
export function CustomerSegmentationSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full min-w-0 animate-pulse">
      <div className="mb-4">
        <HeaderSkeleton titleWidth="w-44" subWidth="w-52" />
      </div>

      <div className="flex flex-col">
        <div className="h-40 sm:h-60 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full border-[26px] border-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-1 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 w-20 sm:w-24 md:w-28 lg:w-32"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches <CustomerTrendChart /> — header then a 240px trend chart. */
export function CustomerTrendChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full animate-pulse">
      <div className="mb-4">
        <HeaderSkeleton titleWidth="w-48" subWidth="w-72" />
      </div>
      <div className="h-[240px]">
        <BarsSkeleton />
      </div>
    </div>
  );
}

/**
 * Shared table-card skeleton for <TopCustomer /> and <AtRiskCustomer /> —
 * both render a 3-column table at min-w-[600px].
 */
export function CustomerTableSkeleton({
  rows = 5,
  titleWidth = "w-40",
  withBadge = false,
}: {
  rows?: number;
  titleWidth?: string;
  withBadge?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full overflow-hidden animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-4">
        <HeaderSkeleton titleWidth={titleWidth} subWidth="w-64" />
        {withBadge && (
          <div className="h-6 w-20 bg-gray-100 rounded-2xl shrink-0" />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              {["w-8", "w-24", "w-20"].map((w, i) => (
                <th key={i} className="pb-3 pt-3 px-4">
                  <div
                    className={`h-3 ${w} bg-gray-100 rounded ${
                      i === 2 ? "mx-auto" : ""
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-gray-200 rounded" />
                      <div className="h-2.5 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>
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
