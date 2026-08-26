/**
 * Loading skeletons for the Live Tables page.
 *
 * Each mirrors the layout it stands in for — the grid's zone headings and
 * four-across cards, the floor plan's header bar and canvas — so the page
 * doesn't reflow when the real content arrives. A centred spinner reserves no
 * shape at all, which is why every panel jumped as it loaded.
 */

/** One table card: status row, name, then the figures footer. */
function TableCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 pt-5 pb-4">
      {/* Status + menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
        <div className="h-4 w-4 rounded bg-gray-100" />
      </div>

      {/* Table name + seats */}
      <div className="space-y-2 mb-4">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-2.5 w-16 rounded bg-gray-100" />
      </div>

      {/* Bill / time footer */}
      <div className="flex items-end justify-between border-t border-gray-50 pt-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-10 rounded bg-gray-100" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-2.5 w-12 rounded bg-gray-100" />
      </div>
    </div>
  );
}

/** One zone — the heading above a four-across run of cards. */
function ZoneSkeleton({ cards }: { cards: number }) {
  return (
    <div>
      <div className="h-2.5 w-32 rounded bg-gray-100 mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <TableCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Matches <GridView />: the status filter pills above indoor and outdoor zones. */
export function GridViewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {[64, 72, 80, 68].map((w, i) => (
          <div
            key={i}
            className="h-7 rounded-full bg-gray-100"
            style={{ width: w }}
          />
        ))}
      </div>

      <ZoneSkeleton cards={4} />
      <ZoneSkeleton cards={4} />
    </div>
  );
}

/** Matches <FloorPlanView />: the live header bar above the plan canvas. */
export function FloorPlanSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex flex-col items-start gap-2 px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-4 w-14 rounded-full bg-gray-100" />
        </div>
        <div className="h-2.5 w-56 rounded bg-gray-100" />
      </div>

      {/* Canvas — scattered table pucks, so the area reads as a floor plan
          rather than an empty box. */}
      <div className="relative h-[420px] bg-gray-50/60">
        {[
          { top: "14%", left: "12%" },
          { top: "12%", left: "38%" },
          { top: "18%", left: "66%" },
          { top: "44%", left: "22%" },
          { top: "48%", left: "52%" },
          { top: "40%", left: "78%" },
          { top: "72%", left: "16%" },
          { top: "70%", left: "44%" },
          { top: "76%", left: "70%" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute h-14 w-14 rounded-xl bg-gray-200"
            style={pos}
          />
        ))}
      </div>
    </div>
  );
}

/** Matches <LiveStatBar />: three figure tiles. */
export function LiveStatBarSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-2.5 w-20 rounded bg-gray-100" />
            <div className="h-7 w-7 rounded-lg bg-gray-100" />
          </div>
          <div className="h-6 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/** Matches <TableTicketCards />: the assigned-ticket cards below the views. */
export function TableTicketCardsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-2.5 w-40 rounded bg-gray-100 mb-3" />
      <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-14 rounded-full bg-gray-100" />
            </div>

            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-3 w-12 rounded bg-gray-100" />
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
              <div className="h-3 w-14 rounded bg-gray-100" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The whole page body while the tables request is in flight.
 *
 * Grid is the default tab, so that is the shape to hold.
 */
export function LiveTablesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <GridViewSkeleton />
      <TableTicketCardsSkeleton />
    </div>
  );
}
