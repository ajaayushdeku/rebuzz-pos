/**
 * Loading skeletons for the Expense Analytics dashboard.
 *
 * That page is a client page with no `async` wrappers — every card reads the
 * same IndexedDB-backed tracker store, so the page gates once on the store's
 * `isLoading`. These skeletons mirror the real card stack so the layout doesn't
 * pop in after a blank spinner.
 */

/**
 * The card frame of the shared ChartCard (components/dashboardComponents/
 * chartCard): hairline border, no shadow, the same padding. Written out rather
 * than imported so these stay plain markup — keep the two in step.
 */
export const CARD_FRAME =
  "relative w-full rounded-2xl border border-[#e3e3e3] bg-white px-6 pb-5 pt-5 animate-pulse";

/** ChartCard's header: icon tile, title and subtitle, a pill on the right. */
export function CardHeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-72",
}: {
  titleWidth?: string;
  subWidth?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl border border-gray-100 bg-gray-50" />
        <div className="space-y-2">
          <div className={`h-4 ${titleWidth} rounded bg-gray-200`} />
          <div className={`h-3 ${subWidth} rounded bg-gray-100`} />
        </div>
      </div>
      <div className="h-6 w-28 rounded-full border border-[#dadce0]" />
    </div>
  );
}

/** Title + subtitle stack, matching <ComponentHeader />. */
export function HeaderSkeleton({
  titleWidth = "w-44",
  subWidth = "w-72",
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
export function BarsSkeleton({ heights }: { heights: number[] }) {
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

export function LegendSkeleton({ items = 2 }: { items?: number }) {
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

const MONTH_BARS = [55, 72, 48, 88, 64, 80];

/** Matches <ExpenseBudgetGauges /> — gauges card plus the 5 stat cards. */
export function ExpenseBudgetGaugesSkeleton() {
  return (
    <div className="relative flex flex-col gap-4 animate-pulse">
      {/* Gauges card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="mb-4">
          <HeaderSkeleton titleWidth="w-52" subWidth="w-80" />
        </div>

        <div className="flex flex-wrap justify-around gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="w-24 h-24 rounded-full border-8 border-gray-100" />
              <div className="space-y-1.5 flex flex-col items-center">
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="w-4 h-4 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Matches <ExpensesByCategory /> — donut on the left, legend rows right. */
export function ExpensesByCategorySkeleton() {
  return (
    <div className={CARD_FRAME}>
      <CardHeaderSkeleton titleWidth="w-44" subWidth="w-64" />

      <div className="flex flex-col sm:flex-row items-start gap-10 sm:gap-16">
        <div className="shrink-0 w-full sm:w-48 flex justify-center">
          <div className="w-[200px] h-[200px] rounded-full border-[32px] border-gray-100" />
        </div>

        <div className="flex-1 w-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-20 bg-gray-200 rounded shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
              <div className="h-3 w-12 bg-gray-100 rounded shrink-0" />
              <div className="h-3 w-24 bg-gray-100 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches <BudgetVsActual /> — 5-column table of budget rows. */
export function BudgetVsActualSkeleton({ rows = 4 }: { rows?: number }) {
  const cols = "grid-cols-[1.4fr_1fr_1fr_1.3fr_1.4fr]";
  return (
    <div className={CARD_FRAME}>
      <CardHeaderSkeleton titleWidth="w-36" subWidth="w-72" />

      <div className="overflow-x-auto">
        <div
          className={`grid ${cols} gap-3 pb-2.5 border-b border-[#e8eaed] min-w-[520px]`}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-16 bg-gray-100 rounded ${i > 0 ? "ml-auto" : ""}`}
            />
          ))}
        </div>

        <div className="min-w-[520px]">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={`grid ${cols} gap-3 items-center py-3 border-b border-[#e8eaed] last:border-0`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
              <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
              <div className="h-5 w-24 bg-gray-100 rounded-full ml-auto" />
              <div className="flex items-center justify-end gap-2">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full" />
                <div className="h-4 w-10 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches <MonthlyExpenseTrend /> — stacked bar chart with a legend. */
export function MonthlyExpenseTrendSkeleton() {
  return (
    <div className={CARD_FRAME}>
      <CardHeaderSkeleton titleWidth="w-60" subWidth="w-72" />
      <div className="h-[300px]">
        <BarsSkeleton heights={MONTH_BARS} />
      </div>
      {/* Category chips, centred as on the real card. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-28 rounded-full bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

/** Matches <CashFlowTrend /> — inflow/outflow line chart with a legend. */
export function CashFlowTrendSkeleton() {
  return (
    <div className={CARD_FRAME}>
      <CardHeaderSkeleton titleWidth="w-40" subWidth="w-72" />
      <div className="h-[280px]">
        <BarsSkeleton heights={MONTH_BARS} />
      </div>
      {/* The legend sits on the right on the real card. */}
      <div className="mt-3 flex items-center justify-end gap-5 pr-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic card block used for the remaining (mock-driven) sections. */
export function ExpenseCardSkeleton({
  rows = 3,
  titleWidth = "w-40",
}: {
  rows?: number;
  titleWidth?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 animate-pulse">
      <HeaderSkeleton titleWidth={titleWidth} subWidth="w-64" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
            <div className="h-3 w-16 bg-gray-100 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page skeleton mirroring the Expense Analytics card stack. */
export function ExpenseAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* <CashFlowTrendSkeleton />
      <ExpensesByCategorySkeleton />
      <MonthlyExpenseTrendSkeleton /> */}
      <BudgetVsActualSkeleton />
      <ExpenseBudgetGaugesSkeleton />

      {/* CostHealth — 4-up stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="w-4 h-4 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* WhereMoneyGoes — section header + 2 cards */}
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-72 bg-gray-100 rounded mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExpenseCardSkeleton rows={4} titleWidth="w-36" />
          <ExpenseCardSkeleton rows={4} titleWidth="w-32" />
        </div>
      </div>

      {/* HiddenCostLeaks — 3-up cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExpenseCardSkeleton rows={3} titleWidth="w-32" />
        <ExpenseCardSkeleton rows={3} titleWidth="w-32" />
        <ExpenseCardSkeleton rows={3} titleWidth="w-32" />
      </div>
    </div>
  );
}
