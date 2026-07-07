"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

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
  const { currency } = useCurrency();
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
      <LockDimFeactureOverlay component_name="Break Even Margin Satety" />

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
            {formatCurrencySymbol(
              breakEvenPoint,
              currency.symbol,
              currency.locale,
            )}
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
        <span>{formatCurrencySymbol(0, currency.symbol, currency.locale)}</span>
        <span className="text-gray-400">
          Current:{" "}
          {formatCurrencySymbol(revenue, currency.symbol, currency.locale)}
        </span>
        <span>
          {formatCurrencySymbol(
            Math.round(maxScale / 1.2),
            currency.symbol,
            currency.locale,
          )}
        </span>
      </div>

      {/* Break-even label above marker */}
      <div className="relative mt-6" style={{ marginLeft: `${breakEvenPos}%` }}>
        <div className="absolute -translate-x-1/2 -top-5  ">
          <span className="text-[10px] font-semibold text-gray-600 bg-white px-1">
            BREAK-EVEN
          </span>
        </div>
      </div>
    </div>
  );
}
