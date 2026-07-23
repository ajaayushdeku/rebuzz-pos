"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useMonthlyTaxTrend, type TaxTotal } from "@/hooks/useMonthlyTaxTrend";
import { RefreshCcw } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";

const GREEN_COLORS = [
  "#059669",
  "#10B981",
  "#34D399",
  "#6EE7B7",
  "#A7F3D0",
  "#047857",
  "#65A30D",
  "#84CC16",
];

const PURPLE_COLORS = [
  "#7C3AED",
  "#8B5CF6",
  "#A78BFA",
  "#C4B5FD",
  "#DDD6FE",
  "#6D28D9",
  "#9333EA",
  "#A855F7",
];

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Payload<ValueType, NameType>[];
}) => {
  const { currency } = useCurrency();
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-100 text-xs">
      <span className="text-gray-600">{p.name}: </span>
      <span className="font-bold text-gray-800">
        {formatCurrencySymbol(
          Number(p.value) || 0,
          currency.symbol,
          currency.locale,
        )}
      </span>
    </div>
  );
};

const ITEMS_PER_PAGE = 3;

function BreakdownSection({
  title,
  items,
  emptyLabel,
  colors,
}: {
  title: string;
  items: TaxTotal[];
  emptyLabel: string;
  colors: string[];
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const colored = items.map((t, i) => ({
    ...t,
    color: colors[i % colors.length],
  }));
  const total = colored.reduce((s, t) => s + t.collected, 0);
  const pieData = colored.map((t) => ({ name: t.label, amount: t.collected }));

  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? colored : colored.slice(0, ITEMS_PER_PAGE);
  const hasMore = colored.length > ITEMS_PER_PAGE;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>

      {colored.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <RefreshCcw size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">{emptyLabel}</p>
          <p className="text-xs text-gray-400 mt-1">
            Relevent data will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Donut */}
          <div className="relative h-48 mx-auto w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={74}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="name"
                >
                  {colored.map((t, i) => (
                    <Cell key={i} fill={t.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                Total
              </span>
              <span className="text-xs font-bold text-gray-900">
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                <span>Tax</span>
                <span className="text-right">Taxable Base</span>
                <span className="text-right">Tax Collected</span>
                <span className="text-right">% of Total</span>
              </div>

              <div className="divide-y divide-gray-50">
                {displayedItems.map((t) => {
                  const pct = total > 0 ? (t.collected / total) * 100 : 0;
                  return (
                    <div
                      key={t.key}
                      className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-2 items-center py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-xs text-gray-800 font-medium truncate">
                          {t.label}
                        </span>
                      </div>

                      <span className="text-xs text-indigo-500 font-semibold text-right">
                        {fmt(t.base)}
                      </span>

                      <span className="text-xs font-bold text-green-600 text-right">
                        {fmt(t.collected)}
                      </span>

                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: t.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-10 text-right shrink-0">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-2 items-center pt-2.5 mt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span />
                <span className="text-xs font-bold text-gray-900 text-right">
                  {fmt(total)}
                </span>
                <span className="text-xs font-semibold text-gray-500 text-right">
                  100%
                </span>
              </div>
            </div>
          </div>

          {/* Load More / Hide */}
          {hasMore && (
            <div className="flex items-center justify-center gap-3 pt-1">
              {!showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Load More ({colored.length - ITEMS_PER_PAGE} more)
                </button>
              ) : (
                <button
                  onClick={() => setShowAll(false)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Hide
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaxRateBreakdown() {
  const { data, isLoading, isError } = useMonthlyTaxTrend();

  const totals = data?.totals ?? [];
  const isUnknown = (t: (typeof totals)[number]) => t.name === "Unknown Tax";
  const regular = totals.filter((t) => !t.group);
  // Grouped taxes + the "Unknown Tax" series (shown in both charts).
  const grouped = [
    ...totals.filter((t) => !t.group && isUnknown(t)),
    ...totals.filter((t) => t.group),
  ];

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-6">
      <ComponentHeader
        title="Tax Breakdown"
        subHeader="Tax collected by applied rate over the last 6 months"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400 text-center py-16">
          Failed to load tax breakdown
        </p>
      ) : totals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <RefreshCcw size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No tax data available
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Tax Breakdown data will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 relative">
          <div className="lg:pr-6">
            <BreakdownSection
              title="Taxes"
              items={regular}
              emptyLabel="No tax data"
              colors={GREEN_COLORS}
            />
          </div>
          {/* Vertical divider between columns */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-px w-px bg-gray-200" />
          <div className="lg:pl-6">
            <BreakdownSection
              title="Grouped Taxes"
              items={grouped}
              emptyLabel="No grouped tax data"
              colors={PURPLE_COLORS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
