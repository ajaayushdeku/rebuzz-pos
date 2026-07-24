/**
 * Loading skeletons for the Customer Detail page (records/customers/[id]).
 *
 * That page is a client page that gates on its own `isLoading` flag (customer
 * list) and a separate `historyLoading` flag (order history), with no Suspense.
 * These mirror the real layout so the page doesn't jump when data arrives.
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
      <div className={`h-3.5 ${titleWidth} bg-gray-200 rounded`} />
      <div className={`h-2.5 ${subWidth} bg-gray-100 rounded`} />
    </div>
  );
}

/** Card header: icon badge + title/subtitle + edit button. */
function CardHeaderSkeleton({
  titleWidth = "w-40",
  subWidth = "w-52",
}: {
  titleWidth?: string;
  subWidth?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
        <HeaderSkeleton titleWidth={titleWidth} subWidth={subWidth} />
      </div>
      <div className="w-6 h-6 rounded-lg bg-gray-100 shrink-0" />
    </div>
  );
}

/** One label/value info row (icon + two text bars). */
function InfoRowSkeleton({ valueWidth = "w-40" }: { valueWidth?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
      <div className="mt-0.5 w-4 h-4 rounded bg-gray-100 shrink-0" />
      <div className="min-w-0 space-y-1.5">
        <div className="h-2 w-16 bg-gray-100 rounded" />
        <div className={`h-3 ${valueWidth} bg-gray-200 rounded`} />
      </div>
    </div>
  );
}

/** Matches the 4-up stats row. */
export function CustomerStatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Matches the Order History table body — the part that replaces the inline
 * spinner while `historyLoading` is true (card header renders outside it).
 */
export function OrderHistoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-sm min-w-[850px]">
        <thead>
          <tr className="border-b border-gray-100">
            {[
              "w-8",
              "w-20",
              "w-24",
              "w-24",
              "w-20",
              "w-16",
              "w-16",
              "w-16",
            ].map((w, i) => (
              <th key={i} className="pb-3 pt-3 px-3">
                <div
                  className={`h-2.5 ${w} bg-gray-100 rounded ${
                    i >= 5 ? "ml-auto" : ""
                  }`}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              <td className="py-3 px-3">
                <div className="h-3 w-5 bg-gray-100 rounded" />
              </td>
              <td className="py-3 px-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </td>
              <td className="py-3 px-3">
                <div className="space-y-1">
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                  <div className="h-2 w-20 bg-gray-100 rounded" />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </td>
              <td className="py-3 px-4">
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </td>
              <td className="py-3 px-3 text-center">
                <div className="h-5 w-16 bg-gray-100 rounded-full mx-auto" />
              </td>
              <td className="py-3 px-3">
                <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
              </td>
              <td className="py-3 px-3 text-center">
                <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full content skeleton for the Customer Detail page. */
export function CustomerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 shadow-sm shrink-0" />
            <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-44 bg-gray-200 rounded" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 bg-gray-100 rounded-full" />
            <div className="h-5 w-[2px] bg-gray-200" />
            <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          </div>
        </div>

        {/* Stats row */}
        <CustomerStatsRowSkeleton />

        {/* Customer Info + Loyalty cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <CardHeaderSkeleton titleWidth="w-44" subWidth="w-32" />
            {/* Photo row */}
            <div className="flex items-center gap-4 pb-4 mb-1 border-b border-gray-50">
              <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-2 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <InfoRowSkeleton key={i} valueWidth={i % 2 ? "w-32" : "w-44"} />
              ))}
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <CardHeaderSkeleton titleWidth="w-36" subWidth="w-56" />
            {/* Loyalty highlight block */}
            <div className="rounded-xl bg-gray-50 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-16 bg-gray-200 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-16 bg-gray-100 rounded" />
                    <div className="h-6 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-2 w-14 bg-gray-100 rounded ml-auto" />
                  <div className="h-5 w-10 bg-gray-200 rounded ml-auto" />
                </div>
              </div>
            </div>
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <InfoRowSkeleton key={i} valueWidth={i % 2 ? "w-24" : "w-32"} />
              ))}
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
              <HeaderSkeleton titleWidth="w-32" subWidth="w-56" />
            </div>
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
          <OrderHistoryTableSkeleton />
        </div>
      </div>
    </div>
  );
}
