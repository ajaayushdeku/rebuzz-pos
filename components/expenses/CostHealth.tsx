"use client";

import { useMemo, useState, createElement } from "react";
import type { CostHealthStatus } from "@/lib/mockData/mock-expense-data";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { useMonthlySalesRevenue } from "@/hooks/useMonthlySalesRevenue";
import { getPurposeIcon } from "@/lib/purpose-icons";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CHART_PALETTE, ChartCard } from "../dashboardComponents/chartCard";
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
  type LucideIcon,
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

/** The small outlined "show more / show less" control, as on the other cards. */
const MORE_BUTTON =
  "inline-flex cursor-pointer items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] transition-colors hover:bg-[#f8f9fa]";
const MORE_BUTTON_STYLE = {
  borderColor: CHART_PALETTE.control,
  color: CHART_PALETTE.title,
};

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
    <div
      className="rounded-2xl border bg-white px-5 py-4"
      style={{ borderColor: CHART_PALETTE.border }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {createElement(Icon, {
            size: 15,
            style: { color: card.iconColor },
          })}
          <p
            className="truncate text-[13px]"
            style={{ color: CHART_PALETTE.title }}
          >
            {card.label}
          </p>
        </div>

        {s && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${s.bg} ${s.text} ${s.border}`}
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
              stroke={CHART_PALETTE.grid}
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
        <div className="flex flex-col">
          <span
            className="text-3xl font-semibold tracking-tight tabular-nums"
            style={{ color: CHART_PALETTE.title }}
          >
            {card.pct === null ? "—" : `${card.pct.toFixed(1)}%`}
          </span>
          <span
            className="mt-0.5 text-xs tabular-nums"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            {formatMoney(card.amount)}
          </span>
        </div>
      </div>

      {/* Progress bar with target marker */}
      <div className="mt-5">
        <div
          className="relative h-1.5 overflow-visible rounded-full"
          style={{ backgroundColor: CHART_PALETTE.grid }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, backgroundColor: barColor }}
          />
          {/* Target marker */}
          <div
            className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2"
            style={{ left: "100%", backgroundColor: CHART_PALETTE.axis }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-3 flex items-center justify-between text-[11px]"
        style={{ color: CHART_PALETTE.subtitle }}
      >
        <p>{card.pct === null ? "revenue unavailable" : "of revenue"}</p>
        <p className="tabular-nums">target ≤ {card.target}%</p>
      </div>
    </div>
  );
}

/** One of the four figures along the bottom of the Spend overview. */
function SummaryFigure({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: LucideIcon;
  /** Icon tile colours; its border takes the icon's own hue. */
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 ${iconClass}`}
      >
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px]" style={{ color: CHART_PALETTE.subtitle }}>
          {label}
        </p>
        <p
          className="truncate text-[13px] font-medium tabular-nums"
          style={{ color: CHART_PALETTE.title }}
        >
          {value}
        </p>
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
            <span className="h-2.5 w-2.5 rounded-full bg-gray-800" />
            <span
              className="flex flex-row items-center gap-2 text-[13px]"
              style={{ color: CHART_PALETTE.title }}
            >
              <span className="tabular-nums">
                Fixed costs {fixedPct.toFixed(1)}%
              </span>
              <span
                className="tabular-nums"
                style={{ color: CHART_PALETTE.axis }}
              >
                {fmtRs(fixedAmount)}
              </span>
            </span>
          </div>
          <p
            className="ml-4 mt-0.5 text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
            Rent, utilities, insurance, ...
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            <span
              className="flex flex-row items-center gap-2 text-[13px]"
              style={{ color: CHART_PALETTE.title }}
            >
              <span className="tabular-nums">
                Variable costs {variablePct.toFixed(1)}%
              </span>
              <span
                className="tabular-nums"
                style={{ color: CHART_PALETTE.axis }}
              >
                {fmtRs(variableAmount)}
              </span>
            </span>
          </div>
          <p
            className="ml-4 mt-0.5 text-[11px]"
            style={{ color: CHART_PALETTE.subtitle }}
          >
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
        {/* Section header — the ChartCard header, over a grid of cards
            rather than inside one. */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2" }}
            >
              <Activity size={16} style={{ color: "#e11d48" }} />
            </div>
            <div className="min-w-0">
              <h3
                className="text-[15px] font-normal"
                style={{ color: CHART_PALETTE.title }}
              >
                Cost health
              </h3>
              <p
                className="mt-0.5 text-xs tracking-wide"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                {`Each cost as a share of ${revenueLabel}, against a target`}
              </p>
            </div>
          </div>
          <RangeBadge scope="month" variant="pill" />
        </div>

        {cards.length === 0 ? (
          <div
            className="rounded-2xl border bg-white p-8"
            style={{ borderColor: CHART_PALETTE.border }}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: CHART_PALETTE.hover }}
              >
                <Activity size={24} style={{ color: CHART_PALETTE.subtitle }} />
              </div>
              <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
                No expense data yet
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Cost health cards will appear once you record expenses
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCards.map((card) => (
                <CostHealthCard key={card.purposeId} card={card} />
              ))}
            </div>

            {/* Load More / Hide buttons */}
            {cards.length > 4 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {canLoadMore && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + 4, cards.length),
                      )
                    }
                    className={MORE_BUTTON}
                    style={MORE_BUTTON_STYLE}
                  >
                    <ChevronDown size={12} />
                    Show {cards.length - visibleCount} more
                  </button>
                )}
                {canHide && (
                  <button
                    onClick={() =>
                      setVisibleCount((prev) => Math.max(prev - 4, 4))
                    }
                    className={MORE_BUTTON}
                    style={MORE_BUTTON_STYLE}
                  >
                    <ChevronUp size={12} />
                    Show less
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

      <ChartCard
        icon={PieChart}
        title="Spend overview"
        info={{
          heading: "Reading this card",
          // From the memo above: tracker figures, not the shop's P&L.
          body: "Covers the month picked at the top of the page. Total spend is everything logged as an expense. Net profit here is the tracker's own income less its expenses — miscellaneous money only, with no cost of goods or tax — so it is not the shop's profit. Fixed and variable split those expenses by category.",
        }}
        subtitle="How your money was split this month"
        controls={<RangeBadge scope="month" variant="pill" />}
      >
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: CHART_PALETTE.hover }}
            >
              <PieChart size={24} style={{ color: CHART_PALETTE.subtitle }} />
            </div>
            <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
              No spend overview data
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              Has no spend data for this period
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                {/* Total spend */}
                <div>
                  <p
                    className="mb-2 text-[13px]"
                    style={{ color: CHART_PALETTE.axis }}
                  >
                    Total spend
                  </p>
                  <p
                    className="text-3xl font-semibold tracking-tight tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {fmtRs(overview.totalSpend)}
                  </p>
                  {/* Reads against the same revenue the cards use. Keyed to
                      the tracker's own net it said "Over revenue" on every
                      profitable month where no misc income happened to be
                      logged. */}
                  {overview.revenue !== null && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {overview.totalSpend > overview.revenue ? (
                        <>
                          <TrendingUp
                            size={13}
                            style={{ color: CHART_PALETTE.bad }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: CHART_PALETTE.bad }}
                          >
                            Over revenue
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown
                            size={13}
                            style={{ color: CHART_PALETTE.good }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: CHART_PALETTE.good }}
                          >
                            Within revenue
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Net profit */}
                <div>
                  <div className="mb-2 flex flex-col items-start gap-0 md:flex-row md:gap-2">
                    <span
                      className="text-[13px]"
                      style={{ color: CHART_PALETTE.axis }}
                    >
                      Net profit
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      (Miscellaneous Income − Miscellaneous Expenses)
                    </span>
                  </div>
                  <p
                    className="text-3xl font-semibold tracking-tight tabular-nums"
                    style={{
                      color:
                        overview.netProfit >= 0
                          ? CHART_PALETTE.good
                          : CHART_PALETTE.bad,
                    }}
                  >
                    {fmtRs(overview.netProfit)}
                  </p>

                  {/* Named base. The figure above is tracker-only, so its
                      margin is against misc income and can read in the
                      hundreds — a bare "% margin" invited it to be read as the
                      shop's. Hidden entirely when there is no base to divide
                      by, rather than printed as a flat 0%. */}
                  {overview.miscIncome > 0 && (
                    <p
                      className="mt-1 text-[13px] tabular-nums"
                      style={{ color: CHART_PALETTE.axis }}
                    >
                      {overview.netProfitMarginPct}% of misc. income
                    </p>
                  )}
                </div>
              </div>
              {/* Fixed vs variable breakdown */}
              <div className="lg:min-w-[300px]">
                <p
                  className="mb-2 text-[13px]"
                  style={{ color: CHART_PALETTE.axis }}
                >
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
            <div
              className="mt-2 grid grid-cols-2 gap-4 border-t pt-5 md:grid-cols-4"
              style={{ borderColor: CHART_PALETTE.grid }}
            >
              <SummaryFigure
                icon={Wallet}
                iconClass="bg-red-50 text-red-600"
                label="Total spend"
                value={fmtRs(overview.totalSpend)}
              />
              <SummaryFigure
                icon={Target}
                iconClass="bg-blue-50 text-blue-600"
                label="Fixed costs"
                value={fmtRs(overview.fixedAmount)}
              />
              <SummaryFigure
                icon={DollarSign}
                iconClass="bg-emerald-50 text-emerald-600"
                label="Variable costs"
                value={fmtRs(overview.variableAmount)}
              />
              <SummaryFigure
                icon={AlertTriangle}
                iconClass={
                  overview.netProfit < 0
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600"
                }
                label="Net profit"
                value={fmtRs(overview.netProfit)}
              />
            </div>
          </>
        )}
      </ChartCard>
    </div>
  );
}
