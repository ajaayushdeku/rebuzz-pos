"use client";

export interface BreakEvenData {
  revenue: number;
  breakEvenPoint: number;
  fixedCosts: number;
  variableCosts: number;
}

export const breakEvenMock: BreakEvenData = {
  revenue: 142000,
  breakEvenPoint: 98000,
  fixedCosts: 42000,
  variableCosts: 52000,
};

function format(n: number) {
  return new Intl.NumberFormat().format(n);
}

export default function BreakEvenMarginSafety() {
  const { revenue, breakEvenPoint, fixedCosts, variableCosts } = breakEvenMock;

  const marginOfSafety =
    revenue > 0 ? ((revenue - breakEvenPoint) / revenue) * 100 : 0;

  const isSafe = revenue >= breakEvenPoint;

  const maxScale = Math.max(revenue, breakEvenPoint) * 1.2;

  const revenuePos = (revenue / maxScale) * 100;
  const breakEvenPos = (breakEvenPoint / maxScale) * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Break-even & Margin of Safety
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          How much revenue is required to cover all costs
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Break-even Point</p>
          <p className="text-2xl font-bold text-gray-900">
            ${format(breakEvenPoint)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Margin of Safety</p>
          <p
            className={`text-2xl font-bold ${
              isSafe ? "text-green-600" : "text-red-600"
            }`}
          >
            {marginOfSafety.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Break-even marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gray-400 z-10"
          style={{ left: `${breakEvenPos}%` }}
        />

        {/* Revenue fill */}
        <div
          className={`absolute top-0 bottom-0 ${
            isSafe ? "bg-green-500" : "bg-red-500"
          }`}
          style={{
            left: `${breakEvenPos}%`,
            width: `${revenuePos - breakEvenPos}%`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>$0</span>
        <span className="text-gray-400">Current: ${format(revenue)}</span>
        <span>${format(Math.round(maxScale / 1.2))}</span>
      </div>

      {/* Break-even label above marker */}
      <div className="relative mt-1" style={{ marginLeft: `${breakEvenPos}%` }}>
        <div className="absolute -translate-x-1/2 -top-5">
          <span className="text-[10px] font-semibold text-gray-600 bg-white px-1">
            BREAK-EVEN
          </span>
        </div>
      </div>
    </div>
  );
}
