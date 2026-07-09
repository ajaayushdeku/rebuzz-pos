"use client";

import {
  CostHealthStatus,
  mockCostHealthData,
} from "@/lib/mockData/mock-expense-data";
import LockDimFeactureOverlay from "../LockDimFeactureOverlay";

function fmtRs(v: number) {
  return `Rs ${v.toLocaleString("en-IN")}`;
}

const STATUS_STYLES: Record<
  CostHealthStatus,
  { bg: string; text: string; border: string }
> = {
  Healthy: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  High: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  "At limit": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

function getBarColor(status: CostHealthStatus): string {
  return status === "Healthy"
    ? "#22c55e"
    : status === "At limit"
      ? "#f59e0b"
      : "#ef4444";
}

export default function CostHealth() {
  const { cards, overview } = mockCostHealthData;

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div>
        <h2 className="text-sm font-bold text-gray-900">Cost health</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Each cost as a share of revenue, against a target
        </p>
      </div>

      {/* ── Cost health cards ── */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
        <LockDimFeactureOverlay component_name="Cost Health" />

        {cards.map((card) => {
          const s = STATUS_STYLES[card.status];
          const barPct = Math.min((card.pct / card.target) * 100, 100);
          const barColor = getBarColor(card.status);
          const isUp = card.changeDir === "up";

          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
            >
              {/* Label + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{card.emoji}</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {card.label}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
                >
                  {card.status}
                </span>
              </div>

              {/* Big % + change */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {card.pct}%
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isUp ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isUp ? "↑" : "↓"} {card.changePt}pt
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: barColor }}
                />
                {/* Target tick mark */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
                  style={{ left: "100%" }}
                />
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>of revenue</span>
                <span>target ≤ {card.target}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Spend overview ── */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">
          Spend overview
        </h3>
        <p className="text-xs text-green-500 mb-3">
          How your money was split this month
        </p>

        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <LockDimFeactureOverlay component_name="Spend Overview" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Total spend */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Total spend</p>
              <p className="text-2xl font-bold text-gray-900">
                {fmtRs(overview.totalSpend)}
              </p>
              <p className="text-xs text-red-500 font-semibold mt-1">
                ↑ {overview.totalSpendChangePct}%{" "}
                <span className="text-gray-400 font-normal">vs last month</span>
              </p>
            </div>

            {/* Net profit */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Net profit</p>
              <p className="text-2xl font-bold text-green-600">
                {fmtRs(overview.netProfit)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {overview.netProfitMarginPct}% margin
              </p>
            </div>

            {/* Fixed vs variable */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Fixed vs variable</p>

              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gray-800 transition-all duration-500"
                  style={{ width: `${overview.fixedPct}%` }}
                />
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${overview.variablePct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-gray-800 shrink-0" />
                    <span className="text-[11px] font-bold text-gray-700">
                      Fixed {overview.fixedPct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {fmtRs(overview.fixedAmount)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {overview.fixedLabel}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-[11px] font-bold text-gray-700">
                      Variable {overview.variablePct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {fmtRs(overview.variableAmount)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {overview.variableLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
