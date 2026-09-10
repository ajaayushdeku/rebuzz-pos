"use client";

import { useMemo, useState, createElement } from "react";
import type { CostHealthStatus } from "@/lib/mockData/mock-expense-data";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { useMonthlySalesRevenue } from "@/hooks/useMonthlySalesRevenue";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ComponentHeader } from "../ComponentHeader";
import { isFixedCost } from "@/lib/costClassification";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  PieChart,
  Wallet,
  Target,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

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
  /** Share of revenue, or null when revenue for the month is unknown. */
  pct: number | null;
  target: number;
  status: CostHealthStatus | null;
  iconKey: string;
  iconColor: string;
};

type SpendOverview = {
  totalSpend: number;
  /** Sales for the month plus miscellaneous income. Null when unknown. */
  revenue: number | null;
  miscIncome: number;
  /** Tracker income minus tracker expenses — not the shop's net profit. */
  netProfit: number;
  netProfitMarginPct: number;
  fixedPct: number;
  variablePct: number;
  fixedAmount: number;
  variableAmount: number;
};

/* ─────────────────────────────────────────────────────────────
   Cost Health Card (radial ring style)
───────────────────────────────────────────────────────────── */

function CostHealthCard({ card }: { card: CostCard }) {
  const { currency } = useCurrency();
  const s = card.status ? STATUS_STYLES[card.status] : null;
  const barPct =
    card.pct === null ? 0 : Math.min((card.pct / card.target) * 100, 100);
  const barColor = card.status ? getBarColor(card.status) : "#cbd5e1";
  const Icon = getPurposeIcon(card.iconKey, card.label);

  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const dash = (barPct / 100) * circumference;

  const formatMoney = (value: number) =>
    formatCurrencySymbol(value, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {createElement(Icon, {
            size: 15,
            style: { color: card.iconColor },
          })}
          <p className="text-sm font-semibold text-gray-900">{card.label}</p>
        </div>

        {s && (
          <span
            className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}
          >
            {card.status}
          </span>
        )}
      </div>

      {/* Main metric */}
      <div className="flex items-center gap-4">
        {/* Radial */}
        <div className="relative w-[70px] h-[70px] shrink-0">
          <svg
            width="70"
            height="70"
            viewBox="0 0 70 70"
            className="-rotate-90"
          >
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="none"
              stroke="#eef2f7"
              strokeWidth="7"
            />
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="none"
              stroke={barColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {createElement(Icon, {
              size: 18,
              style: { color: card.iconColor },
            })}
          </div>
        </div>

        {/* Percentage + amount */}
        <div className="flex flex-col tracking-wide">
          <span className="text-3xl font-bold tracking-tight text-gray-950">
            {card.pct === null ? "—" : `${card.pct.toFixed(1)}%`}
          </span>
          <span className="text-xs text-gray-400 font-medium mt-0.5">
            {formatMoney(card.amount)}
          </span>
        </div>
      </div>

      {/* Progress bar with target marker */}
      <div className="mt-5">
        <div className="relative h-2 bg-gray-100 rounded-full overflow-visible">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, backgroundColor: barColor }}
          />
          {/* Target marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-slate-400"
            style={{ left: "100%" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">
          {card.pct === null ? "revenue unavailable" : "of revenue"}
        </p>
        <p className="text-xs text-gray-400">target ≤ {card.target}%</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Spend Overview — Fixed vs Variable donut
───────────────────────────────────────────────────────────── */

function FixedVariableDonut({
  fixedPct,
  fixedAmount,
  variablePct,
  variableAmount,
}: {
  fixedPct: number;
  fixedAmount: number;
  variablePct: number;
  variableAmount: number;
}) {
  const { currency } = useCurrency();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const fixedDash = (fixedPct / 100) * circumference;

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative w-[90px] h-[90px] shrink-0">
        <svg
          width="90"
          height="90"
          viewBox="0 0 110 110"
          className="-rotate-90"
        >
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#4a9afc"
            strokeWidth="14"
          />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="14"
            // strokeLinecap="round"
            strokeDasharray={`${fixedDash} ${circumference}`}
          />
        </svg>
        {/* <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">
            {Math.round(fixedPct)}%
          </span>
          <span className="text-[9px] text-gray-400">fixed</span>
        </div> */}
      </div>

      {/* Legend */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />
            <span className="text-xs font-semibold text-gray-800 flex flex-row items-center gap-2">
              <span className="tracking-wide">
                {" "}
                Fixed costs {fixedPct.toFixed(2)}%
              </span>
              <span className="font-semibold text-gray-500 tracking-wide">
                {fmtRs(fixedAmount)}
              </span>
            </span>
          </div>
          <p className="text-xs text-gray-400 ml-4 mt-0.5">
            Rent, utilities, insurance, ...
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-xs font-semibold text-gray-800 flex flex-row items-center gap-2">
              <span>Variable costs {variablePct.toFixed(2)}%</span>
              <span className="font-semibold text-gray-500">
                {fmtRs(variableAmount)}
              </span>
            </span>
          </div>
          <p className="text-xs text-gray-400 ml-4 mt-0.5">
            Food, transportation, marketing, ...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CostHealth() {
  const { currency } = useCurrency();
  const { transactions, expensePurposes, summary, isLoading, month, year } =
    useTracker();

  // The tracker's own income total is miscellaneous income — rebates, scrap
  // sales, the odd refund — and never the shop's takings. Dividing a cost by
  // it answered a question nobody asked: with no misc income logged every
  // category read 0% and "Healthy", and with a little logged they read in the
  // hundreds. Sales come from the report API, the same figure Profit & Cost
  // uses, so the two pages agree.
  const {
    salesRevenue,
    isLoading: isRevenueLoading,
    hasRevenue,
  } = useMonthlySalesRevenue(month, year);

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
    const miscIncome = summary.incomeTotal || 0;
    const totalSpend = summary.expenseTotal || 0;

    // Matches the rest of the app: misc income helps pay the bills, so it
    // belongs in revenue, but it is an addition to sales and never a stand-in.
    const revenue = hasRevenue ? salesRevenue + miscIncome : null;

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
          revenue !== null && revenue > 0
            ? Math.round((amount / revenue) * 1000) / 10
            : null;
        const target = DEFAULT_TARGET;
        // No verdict without a denominator. A card that says "Healthy" because
        // it could not read revenue is worse than one that says nothing.
        const status = pct === null ? null : getStatus(pct, target);
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

    // The Spend overview tile stays on tracker figures, as its own caption
    // says. Feeding sales into it would print takings minus a few logged
    // expenses and call that net profit, with no cost of goods and no tax.
    const netProfit = miscIncome - totalSpend;
    const netProfitMarginPct =
      miscIncome > 0 ? Math.round((netProfit / miscIncome) * 1000) / 10 : 0;
    const total = fixedAmount + variableAmount;
    const fixedPct =
      total > 0 ? Math.round((fixedAmount / total) * 1000) / 10 : 0;
    const variablePct = total > 0 ? Math.round((100 - fixedPct) * 10) / 10 : 0;

    const overview: SpendOverview = {
      totalSpend,
      revenue,
      miscIncome,
      netProfit,
      netProfitMarginPct,
      fixedPct,
      variablePct,
      fixedAmount,
      variableAmount,
    };

    return { cards, overview };
  }, [transactions, purposeLookup, summary, salesRevenue, hasRevenue]);

  const fmtRs = (v: number) => {
    return `${formatCurrencySymbol(v, currency.symbol, currency.locale)}`;
  };

  const hasData = cards.length > 0 || overview.totalSpend > 0;

  // Misc income is named only when it is actually in the denominator, the same
  // rule the Profit & Cost cards follow.
  const revenueLabel =
    overview.miscIncome > 0 ? "revenue + misc. income" : "revenue";

  // Visible card count — initially 4, expand/collapse in batches of 4
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleCards = cards.slice(0, visibleCount);
  const canLoadMore = visibleCount < cards.length;
  const canHide = visibleCount > 4;

  if (isLoading || isRevenueLoading)
    return (
      <>
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
      </>
    );

  return (
    <div className="flex flex-col gap-8 mt-4">
      {/* ======================================================
          COST HEALTH
      ====================================================== */}

      <section>
        {/* Section header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <Activity size={15} className="text-rose-600" />
            </div>
            <ComponentHeader
              title="Cost health"
              subHeader={`Each cost as a share of ${revenueLabel}, against a target`}
            />
            <RangeBadge scope="month" />
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Activity size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No expense data yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cost health cards will appear once you record expenses
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {visibleCards.map((card) => (
                <CostHealthCard key={card.purposeId} card={card} />
              ))}
            </div>

            {/* Load More / Hide buttons */}
            {cards.length > 4 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {canLoadMore && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 4, cards.length),
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <ChevronDown size={14} /> Load More
                    <span className="text-xs text-gray-400">
                      ( {cards.length - visibleCount} more )
                    </span>
                  </button>
                )}
                {canHide && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) => Math.max(prev - 4, 4))
                    }
                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700  transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center gap-1 cursor-pointer"
                  >
                    <ChevronUp size={14} /> Hide
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* ======================================================
          SPEND OVERVIEW
      ====================================================== */}

      <section>
        {/* Section header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <PieChart size={15} className="text-blue-600" />
            </div>
            <ComponentHeader
              title="Spend overview"
              subHeader="How your money was split this month"
            />
            <RangeBadge scope="month" />
          </div>
        </div>

        {!hasData ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <PieChart size={24} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No spend overview data
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Has no spend data for this period
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                {/* Total spend */}
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-2">
                    Total spend
                  </p>
                  <p className="text-3xl font-bold tracking-wide text-gray-950">
                    {fmtRs(overview.totalSpend)}
                  </p>
                  {/* Reads against the same revenue the cards use. Keyed to
                      the tracker's own net it said "Over revenue" on every
                      profitable month where no misc income happened to be
                      logged. */}
                  {overview.revenue !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {overview.totalSpend > overview.revenue ? (
                        <>
                          <TrendingUp size={13} className="text-red-500" />
                          <span className="text-xs font-semibold text-red-500">
                            Over revenue
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown
                            size={13}
                            className="text-emerald-500"
                          />
                          <span className="text-xs font-semibold text-emerald-500">
                            Within revenue
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Net profit */}
                <div>
                  <div className="text-gray-500 font-medium mb-2 flex flex-col mf:flex-row items-start gap-0 md:gap-2">
                    <span className="text-sm">Net profit</span>
                    <span className="text-xs text-gray-400">
                      (Miscellaneous Income − Miscellaneous Expenses)
                    </span>
                  </div>
                  <p
                    className={`text-3xl font-bold tracking-wide ${
                      overview.netProfit >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {fmtRs(overview.netProfit)}
                  </p>

                  {/* Named base. The figure above is tracker-only, so its
                      margin is against misc income and can read in the
                      hundreds — a bare "% margin" invited it to be read as the
                      shop's. Hidden entirely when there is no base to divide
                      by, rather than printed as a flat 0%. */}
                  {overview.miscIncome > 0 && (
                    <p className="text-sm font-medium text-gray-500 tracking-wide mt-1">
                      {overview.netProfitMarginPct}% of misc. income
                    </p>
                  )}
                </div>
              </div>
              {/* Fixed vs variable breakdown */}
              <div className="lg:min-w-[300px]">
                <p className="text-sm text-gray-500 font-medium mb-2">
                  Fixed vs variable
                </p>

                <FixedVariableDonut
                  fixedPct={overview.fixedPct}
                  fixedAmount={overview.fixedAmount}
                  variablePct={overview.variablePct}
                  variableAmount={overview.variableAmount}
                />
              </div>
            </div>

            {/* Bottom summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Wallet size={15} className="text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Total spend
                  </p>
                  <p className="text-sm font-bold text-gray-800 tracking-wide">
                    {fmtRs(overview.totalSpend)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Target size={15} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Fixed costs
                  </p>
                  <p className="text-sm font-bold text-gray-800 tracking-wide">
                    {fmtRs(overview.fixedAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign size={15} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Variable costs
                  </p>
                  <p className="text-sm font-bold text-gray-800 tracking-wide">
                    {fmtRs(overview.variableAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    overview.netProfit < 0 ? "bg-red-50" : "bg-emerald-50"
                  }`}
                >
                  <AlertTriangle
                    size={15}
                    className={
                      overview.netProfit < 0
                        ? "text-red-500"
                        : "text-emerald-500"
                    }
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Net profit
                  </p>
                  <p className="text-sm font-bold text-gray-800 tracking-wide">
                    {fmtRs(overview.netProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
