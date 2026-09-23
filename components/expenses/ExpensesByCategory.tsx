"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import RangeBadge from "@/components/ui/RangeBadge";
import {
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
} from "../dashboardComponents/chartCard";
import { ChartPie, ChevronDown } from "lucide-react";
import { ExpensesByCategorySkeleton } from "./ExpenseAnalyticsSkeletons";

interface SliceData {
  purpose: string;
  amount: number;
  color: string;
  pct: number;
}

interface CurrencyType {
  symbol: string;
  locale?: string;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
  currency: CurrencyType;
}) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload as SliceData;
  return (
    <ChartTooltipBox
      label={entry.purpose}
      rows={[
        {
          name: "Spent",
          color: entry.color,
          value: formatCurrencySymbol(
            entry.amount,
            currency.symbol,
            currency.locale,
          ),
        },
        {
          name: "Share of expenses",
          color: entry.color,
          value: `${entry.pct.toFixed(0)}%`,
        },
      ]}
    />
  );
};

/** Donut breakdown of expenses by category (purpose), from the tracker store. */
export default function ExpensesByCategory() {
  const { transactions, expensePurposes, isLoading } = useTracker();
  const { currency } = useCurrency();

  // ── Legend scroll-aware arrow ──────────────────────────────────────────
  const legendRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const updateLegendScroll = useCallback(() => {
    const el = legendRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setCanScrollMore(hasOverflow && !atEnd);
  }, []);

  // Build purposeId → { name, icon } lookup
  const purposeLookup = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    for (const p of expensePurposes) {
      map.set(p._id, { name: p.name, icon: p.icon ?? "" });
    }
    return map;
  }, [expensePurposes]);

  const getPurposeName = (purposeId: string) =>
    purposeLookup.get(purposeId)?.name ?? purposeId;

  const getPurposeIcon = (purposeId: string) =>
    purposeLookup.get(purposeId)?.icon ?? "";

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.kind === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const expenseByPurpose = useMemo((): SliceData[] => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.kind === "expense")
      .forEach((t) => {
        map.set(t.purposeId, (map.get(t.purposeId) ?? 0) + t.amount);
      });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([purposeId, amount]) => {
        const name = getPurposeName(purposeId);
        return {
          purpose: name,
          amount,
          color: getPurposeColor(getPurposeIcon(purposeId), name),
          pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        };
      });
  }, [transactions, totalExpense, getPurposeName, getPurposeIcon]);

  useEffect(() => {
    updateLegendScroll();
    window.addEventListener("resize", updateLegendScroll);
    return () => window.removeEventListener("resize", updateLegendScroll);
  }, [updateLegendScroll, expenseByPurpose]);

  if (isLoading)
    return (
      <>
        <ExpensesByCategorySkeleton />
      </>
    );

  return (
    <ChartCard
      icon={ChartPie}
      // Rose, as before: Tailwind's rose-600 / rose-200 / rose-50.
      iconColor="#e11d48"
      iconBorder="#fecdd3"
      iconBg="#fff1f2"
      title="Expenses by Category"
      info={{
        heading: "Reading this chart",
        // From the tracker store: expense rows for the selected month.
        body: "Every expense logged in the month picked at the top of the page, grouped by its category and ordered largest first. Income entries are left out, so the percentages are shares of expenses rather than of all money moved.",
      }}
      subtitle="Share of total expenses this month"
      controls={<RangeBadge scope="month" variant="pill" />}
    >
      {/* Hide scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {expenseByPurpose.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <ChartPie size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No expense data
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Expenses by Category data will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:gap-16">
          {/* ── Donut on the left ── */}
          <div className="flex w-full shrink-0 justify-center sm:w-48">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={expenseByPurpose}
                  dataKey="amount"
                  nameKey="purpose"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {expenseByPurpose.map((entry, idx) => (
                    <Cell key={entry.purpose} fill={entry.color} stroke="none">
                      <animate
                        attributeName="opacity"
                        values="0;1"
                        dur="0.6s"
                        begin={`${idx * 0.08}s`}
                        fill="freeze"
                      />
                    </Cell>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
                {/* Center text */}
                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-semibold"
                  fill={CHART_PALETTE.title}
                >
                  {totalExpense > 0
                    ? formatCurrencySymbol(
                        totalExpense,
                        currency.symbol,
                        currency.locale,
                      )
                    : "0"}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs"
                  fill={CHART_PALETTE.axis}
                >
                  Total
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ── Legend with progress bars on the right ── */}
          <div className="w-full flex-1">
            <div
              ref={legendRef}
              onScroll={updateLegendScroll}
              className="scrollbar-hide max-h-56 overflow-y-auto pr-1"
            >
              {expenseByPurpose.map((entry) => (
                <div
                  key={entry.purpose}
                  className="flex items-center gap-2.5 py-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span
                    className="w-20 shrink-0 truncate text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {entry.purpose}
                  </span>
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ backgroundColor: CHART_PALETTE.grid }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${entry.pct}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                  <span
                    className="w-12 shrink-0 text-right text-xs tabular-nums"
                    style={{ color: CHART_PALETTE.axis }}
                  >
                    {entry.pct.toFixed(1)}%
                  </span>
                  <span
                    className="w-24 shrink-0 text-right text-[13px] font-medium tabular-nums"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {formatCurrencySymbol(
                      entry.amount,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Only while there is more list below — an up arrow at the end
                was pointing at nothing to scroll to. */}
            {canScrollMore && (
              <div className="flex animate-bounce justify-center pt-1.5">
                <ChevronDown
                  size={14}
                  style={{ color: CHART_PALETTE.subtitle }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
