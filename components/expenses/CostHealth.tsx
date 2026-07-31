"use client";

import { useMemo, useState } from "react";
import type { CostHealthStatus } from "@/lib/mockData/mock-expense-data";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "../ComponentHeader";
import { Activity } from "lucide-react";
import { createElement } from "react";

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

// Icons that represent fixed costs (don't change much month to month)
const FIXED_ICON_KEYS = new Set([
  "home",
  "lightbulb",
  "school",
  "monitor_heart",
  "smartphone",
  "book",
]);

function isFixedCost(icon: string, name: string): boolean {
  const iconKey = (icon || "").toLowerCase();
  if (FIXED_ICON_KEYS.has(iconKey)) return true;
  const nameKey = (name || "").toLowerCase();
  if (
    nameKey.includes("rent") ||
    nameKey.includes("housing") ||
    nameKey.includes("utilities") ||
    nameKey.includes("insurance") ||
    nameKey.includes("subscription") ||
    nameKey.includes("phone") ||
    nameKey.includes("internet") ||
    nameKey.includes("education") ||
    nameKey.includes("health") ||
    nameKey.includes("salary")
  ) {
    return true;
  }
  return false;
}

// Default target % for each cost category as share of revenue
const DEFAULT_TARGET = 30;

function getStatus(pct: number, target: number): CostHealthStatus {
  if (pct > target) return "High";
  if (pct >= target * 0.9) return "At limit";
  return "Healthy";
}

type CostCard = {
  purposeId: string;
  label: string;
  amount: number;
  pct: number;
  target: number;
  status: CostHealthStatus;
  iconKey: string;
  iconColor: string;
};

type SpendOverview = {
  totalSpend: number;
  netProfit: number;
  netProfitMarginPct: number;
  fixedPct: number;
  variablePct: number;
  fixedAmount: number;
  variableAmount: number;
};

export default function CostHealth() {
  const { currency } = useCurrency();
  const { transactions, expensePurposes, summary } = useTracker();

  // Build purposeId → { name, icon } lookup
  const purposeLookup = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const p of expensePurposes) {
      map.set(p._id, { name: p.name, icon: p.icon ?? "" });
    }
    return map;
  }, [expensePurposes]);

  // Calculate expense by purpose and revenue (income total)
  const { cards, overview } = useMemo<{
    cards: CostCard[];
    overview: SpendOverview;
  }>(() => {
    const revenue = summary.incomeTotal || 0;
    const totalSpend = summary.expenseTotal || 0;

    // Group expenses by purposeId
    const spendByPurpose = new Map<string, number>();
    let fixedAmount = 0;
    let variableAmount = 0;

    for (const t of transactions) {
      if (t.kind !== "expense") continue;
      const current = spendByPurpose.get(t.purposeId) ?? 0;
      spendByPurpose.set(t.purposeId, current + t.amount);

      const purpose = purposeLookup.get(t.purposeId);
      const purposeName = purpose?.name ?? t.purposeId;
      const purposeIcon = purpose?.icon ?? "";
      if (isFixedCost(purposeIcon, purposeName)) {
        fixedAmount += t.amount;
      } else {
        variableAmount += t.amount;
      }
    }

    // Build cards: all expense purposes by amount (sorted descending)
    const cards: CostCard[] = [...spendByPurpose.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([purposeId, amount]) => {
        const purpose = purposeLookup.get(purposeId);
        const name = purpose?.name ?? purposeId;
        const icon = purpose?.icon ?? "";
        const pct =
          revenue > 0 ? Math.round((amount / revenue) * 1000) / 10 : 0;
        const target = DEFAULT_TARGET;
        const status = getStatus(pct, target);
        return {
          purposeId,
          label: name,
          amount,
          pct,
          target,
          status,
          iconKey: icon,
          iconColor: getPurposeColor(icon, name),
        };
      });

    // Calculate overview
    const netProfit = revenue - totalSpend;
    const netProfitMarginPct =
      revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;
    const total = fixedAmount + variableAmount;
    const fixedPct =
      total > 0 ? Math.round((fixedAmount / total) * 1000) / 10 : 0;
    const variablePct = total > 0 ? Math.round((100 - fixedPct) * 10) / 10 : 0;

    const overview: SpendOverview = {
      totalSpend,
      netProfit,
      netProfitMarginPct,
      fixedPct,
      variablePct,
      fixedAmount,
      variableAmount,
    };

    return { cards, overview };
  }, [transactions, purposeLookup, summary]);

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  const hasData = cards.length > 0 || overview.totalSpend > 0;

  // Visible card count — initially 4, expand/collapse in batches of 4
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleCards = cards.slice(0, visibleCount);
  const canLoadMore = visibleCount < cards.length;
  const canHide = visibleCount > 4;

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
          <Activity size={15} className="text-rose-600" />
        </div>
        <ComponentHeader
          title="Cost health"
          subHeader="Each cost as a share of revenue, against a target"
        />
      </div>

      {/* ── Cost health cards ── */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Activity size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No expense data yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cost health cards will appear once you record expenses
            </p>
          </div>
        ) : (
          visibleCards.map((card) => {
            const s = STATUS_STYLES[card.status];
            const barPct = Math.min((card.pct / card.target) * 100, 100);
            const barColor = getBarColor(card.status);
            const Icon = getPurposeIcon(card.iconKey, card.label);

            return (
              <div
                key={card.purposeId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
              >
                {/* Label + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {createElement(Icon, {
                      size: 16,
                      style: { color: card.iconColor },
                    })}
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

                {/* Big % + amount */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {card.pct.toFixed(2)}%
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {fmtRs(card.amount)}
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
          })
        )}
      </div>

      {/* ── Load More / Hide buttons ── */}
      {cards.length > 4 && (
        <div className="flex items-center justify-center gap-3">
          {canLoadMore && (
            <button
              onClick={() =>
                setVisibleCount((prev) => Math.min(prev + 4, cards.length))
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 transition-colors"
            >
              Load More
              <span className="text-[10px] text-blue-400">
                ( {cards.length - visibleCount} more )
              </span>
            </button>
          )}
          {canHide && (
            <button
              onClick={() => setVisibleCount((prev) => Math.max(prev - 4, 4))}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 transition-colors"
            >
              Hide
              {/* <span className="text-[10px] text-gray-400">
                ( last {Math.min(4, visibleCount - 4)} )
              </span> */}
            </button>
          )}
        </div>
      )}

      {/* ── Spend overview ── */}
      <div>
        <ComponentHeader
          title="Spend overview"
          subHeader="How your money was split this month"
        />

        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-3">
          {!hasData && (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-gray-400">
                No spend data for this period
              </p>
            </div>
          )}

          {hasData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Total spend */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Total spend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fmtRs(overview.totalSpend)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Total expenses this period
                </p>
              </div>

              {/* Net profit */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Net profit</p>
                <p
                  className={`text-2xl font-bold ${
                    overview.netProfit >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {fmtRs(overview.netProfit)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {overview.netProfitMarginPct}% margin (income − expense)
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
                      Rent, utilities, insurance, ...
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
                      Food, transportation, marketing, ...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
