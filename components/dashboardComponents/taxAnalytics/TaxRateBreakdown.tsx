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
import { Percent } from "lucide-react";
import { CHART_PALETTE, ChartCard, ChartTooltipBox } from "../chartCard";
import { TaxRateBreakdownSkeleton } from "./TaxAnalyticsSkeletons";

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

/** The four columns, shared by the header row, the rows and the total. */
const COLUMNS = "grid grid-cols-[1.4fr_1fr_1fr_1.2fr] items-center gap-2";

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
    <ChartTooltipBox
      label={p.name}
      rows={[
        {
          name: "Tax collected",
          color: (p.payload as { fill?: string })?.fill ?? CHART_PALETTE.good,
          value: formatCurrencySymbol(
            Number(p.value) || 0,
            currency.symbol,
            currency.locale,
          ),
        },
      ]}
    />
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
      <h4
        className="mb-3 text-[13px] font-medium"
        style={{ color: CHART_PALETTE.title }}
      >
        {title}
      </h4>

      {colored.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-12">
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Percent size={18} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            {emptyLabel}
          </p>
          <p className="text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Relevent data will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Donut */}
          <div className="relative mx-auto h-48 w-full max-w-[200px]">
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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[11px]"
                style={{ color: CHART_PALETTE.axis }}
              >
                Total
              </span>
              <span
                className="text-sm font-semibold tracking-tight tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
                {fmt(total)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[420px]">
              <div
                className={`${COLUMNS} border-b pb-2.5 text-[11px]`}
                style={{
                  borderColor: CHART_PALETTE.grid,
                  color: CHART_PALETTE.axis,
                }}
              >
                <span>Tax</span>
                <span className="text-right">Taxable base</span>
                <span className="text-right">Tax collected</span>
                <span className="text-right">% of total</span>
              </div>

              <div>
                {displayedItems.map((t) => {
                  const pct = total > 0 ? (t.collected / total) * 100 : 0;
                  return (
                    <div
                      key={t.key}
                      className={`${COLUMNS} border-b py-2.5 last:border-0`}
                      style={{ borderColor: CHART_PALETTE.grid }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        <span
                          className="truncate text-[13px]"
                          style={{ color: CHART_PALETTE.title }}
                        >
                          {t.label}
                        </span>
                      </div>

                      <span
                        className="text-right text-[13px] tabular-nums"
                        style={{ color: CHART_PALETTE.axis }}
                      >
                        {fmt(t.base)}
                      </span>

                      <span
                        className="text-right text-[13px] font-medium tabular-nums"
                        style={{ color: CHART_PALETTE.good }}
                      >
                        {fmt(t.collected)}
                      </span>

                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="h-1.5 max-w-[80px] flex-1 overflow-hidden rounded-full"
                          style={{ backgroundColor: CHART_PALETTE.grid }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: t.color,
                            }}
                          />
                        </div>
                        <span
                          className="w-10 shrink-0 text-right text-xs tabular-nums"
                          style={{ color: CHART_PALETTE.axis }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`${COLUMNS} mt-1 border-t pt-2.5`}
                style={{ borderColor: CHART_PALETTE.grid }}
              >
                <span
                  className="text-[13px]"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  Total
                </span>
                <span />
                <span
                  className="text-right text-[13px] font-medium tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {fmt(total)}
                </span>
                <span
                  className="text-right text-xs tabular-nums"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  100%
                </span>
              </div>
            </div>
          </div>

          {/* Load More / Hide */}
          {hasMore && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="cursor-pointer rounded-full border bg-white px-3 py-1 text-[11px] transition-colors hover:bg-[#f8f9fa]"
                style={{
                  borderColor: CHART_PALETTE.control,
                  color: CHART_PALETTE.title,
                }}
              >
                {showAll
                  ? "Show less"
                  : `Show ${colored.length - ITEMS_PER_PAGE} more`}
              </button>
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
    <ChartCard
      icon={Percent}
      // Green, as before: Tailwind's green-600 / green-200 / green-50.
      iconColor="#16a34a"
      iconBorder="#bbf7d0"
      iconBg="#f0fdf4"
      title="Tax Breakdown"
      info={{
        heading: "Reading this card",
        // From useMonthlyTaxTrend: own six-month window, refunds dropped.
        body: "Covers the last six calendar months, so it ignores the date range at the top of the page. Refunded bills are left out. A bill lands under Grouped taxes when its tax came from a tax group rather than a single tax; anything with tax but no named tax shows as Unknown Tax in both columns. Taxable base is the bill's amount before tax.",
      }}
      subtitle="Tax collected by applied rate over the last 6 months"
    >
      {isLoading ? (
        <TaxRateBreakdownSkeleton />
      ) : isError ? (
        <p
          className="py-16 text-center text-sm"
          style={{ color: CHART_PALETTE.bad }}
        >
          Failed to load tax breakdown
        </p>
      ) : totals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Percent size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No tax data available
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Tax Breakdown data will appear here
          </p>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-0">
          <div className="lg:pr-6">
            <BreakdownSection
              title="Taxes"
              items={regular}
              emptyLabel="No tax data"
              colors={GREEN_COLORS}
            />
          </div>
          {/* Vertical divider between columns */}
          <div
            className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-px lg:block"
            style={{ backgroundColor: CHART_PALETTE.grid }}
          />
          <div className="lg:pl-6">
            <BreakdownSection
              title="Grouped taxes"
              items={grouped}
              emptyLabel="No grouped tax data"
              colors={PURPLE_COLORS}
            />
          </div>
        </div>
      )}
    </ChartCard>
  );
}
