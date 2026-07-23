/**
 * Loading skeleton for the Employee Detail page.
 *
 * That page is a client page that gates once on its own `loading` flag (no
 * Suspense), so this mirrors the real card stack rather than replacing the whole
 * screen with a spinner.
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

const BAR_HEIGHTS = [58, 82, 46, 90, 68, 74, 52];

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

/** Matches <StatsCardGrid /> — a 6-up grid of small metric tiles. */
export function StatsCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="w-6 h-6 rounded-lg bg-gray-200 shrink-0" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-14 bg-gray-100 rounded mt-1.5" />
        </div>
      ))}
    </div>
  );
}

/** Generic list/table card used for the shifts, bills and invoice sections. */
export function StaffDetailListSkeleton({
  rows = 4,
  titleWidth = "w-40",
  rounded = "rounded-xl",
}: {
  rows?: number;
  titleWidth?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`bg-white ${rounded} border border-gray-200 shadow-sm p-5 animate-pulse`}
    >
      <div className="mb-4">
        <HeaderSkeleton titleWidth={titleWidth} />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        {["w-10", "w-24", "w-20", "w-20", "w-16"].map((w, i) => (
          <div
            key={i}
            className={`h-3 ${w} bg-gray-100 rounded ${i === 0 ? "" : "flex-1"}`}
          />
        ))}
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
          >
            <div className="h-3 w-10 bg-gray-100 rounded" />
            <div className="h-3 flex-1 max-w-[8rem] bg-gray-200 rounded" />
            <div className="h-3 flex-1 max-w-[6rem] bg-gray-100 rounded" />
            <div className="h-3 flex-1 max-w-[6rem] bg-gray-100 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full content skeleton for the Employee Detail page (header excluded). */
export function StaffDetailSkeleton() {
  return (
    <>
      <StatsCardGridSkeleton />

      <div className="flex flex-col gap-6">
        {/* Weekly sales + performance radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 animate-pulse">
            <div className="mb-4">
              <HeaderSkeleton titleWidth="w-36" subWidth="w-52" />
            </div>
            <div className="h-56">
              <BarsSkeleton />
            </div>
          </div>

          <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-44 animate-pulse">
            <div className="mb-4">
              <HeaderSkeleton titleWidth="w-40" subWidth="w-48" />
            </div>
            <div className="h-56 flex items-center justify-center">
              <div className="w-44 h-44 rounded-full border-[18px] border-gray-100" />
            </div>
          </div>
        </div>

        {/* Top items */}
        <StaffDetailListSkeleton rows={5} titleWidth="w-36" />

        {/* Shifts */}
        <StaffDetailListSkeleton
          rows={4}
          titleWidth="w-32"
          rounded="rounded-2xl"
        />

        {/* Bills */}
        <StaffDetailListSkeleton rows={4} titleWidth="w-28" />
      </div>

      {/* Invoices */}
      <div className="mt-6">
        <StaffDetailListSkeleton rows={4} titleWidth="w-36" />
      </div>
    </>
  );
}
