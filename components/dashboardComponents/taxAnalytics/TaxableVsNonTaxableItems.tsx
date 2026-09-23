"use client";

import { useRef, useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { Scale, Sparkles, Box, Receipt, type LucideIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import RangeBadge from "@/components/ui/RangeBadge";
import { CHART_PALETTE, ChartCard, ChartTooltipBox } from "../chartCard";
import { TaxableSplitSkeleton } from "./TaxAnalyticsSkeletons";
import type {
  TaxableBreakdown,
  TaxBreakdownItem,
} from "@/hooks/useTaxableBreakdown";

const ITEMS_PER_PAGE = 5;
const TAXABLE_COLOR = "#0ba2c0";
const NON_TAXABLE_COLOR = "#ea1f5c";
const CUSTOM_COLOR = "#ae8bff";

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
          name: "Revenue",
          color: (p.payload as { color?: string })?.color ?? TAXABLE_COLOR,
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

/**
 * One breakdown list. Taxable rows carry the tax they generated beneath the
 * revenue — previously tax was only ever visible as a single business-wide
 * total, so there was no way to see which items produced it.
 *
 * The heading lives in the tab bar above, so the list itself is just rows.
 */
function ItemList({
  color,
  items,
  emptyLabel,
  showTax,
  showTaxableTag = false,
}: {
  color: string;
  items: TaxBreakdownItem[];
  emptyLabel: string;
  showTax: boolean;
  showTaxableTag?: boolean;
}) {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > ITEMS_PER_PAGE;
  const visible = expanded ? items : items.slice(0, ITEMS_PER_PAGE);

  if (visible.length === 0) {
    return (
      <p
        className="border-t py-10 text-center text-xs"
        style={{
          borderColor: CHART_PALETTE.grid,
          color: CHART_PALETTE.subtitle,
        }}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="border-t" style={{ borderColor: CHART_PALETTE.grid }}>
      {visible.map((item) => (
        <div
          key={item.name}
          className="flex items-start justify-between gap-2 border-b px-3 py-2.5 text-xs transition-colors last:border-0 hover:bg-[#f8f9fa]"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
          <div className="min-w-0">
            <p
              className="truncate text-[13px]"
              style={{ color: CHART_PALETTE.title }}
              title={item.name}
            >
              {item.name}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1.5 text-[11px]"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              <span className="tabular-nums tracking-wide">
                {item.count.toLocaleString()}{" "}
                {item.count === 1 ? "unit" : "units"}
              </span>
              {showTaxableTag && (
                <span
                  className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
                    item.taxable
                      ? "bg-cyan-50 text-cyan-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.taxable ? "Taxable" : "Non-taxable"}
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right tracking-wide">
            <p
              className="text-[13px] font-medium tabular-nums"
              style={{ color }}
            >
              {fmt(item.revenue)}
            </p>
            {/* Tax generated — only meaningful where tax was charged. */}
            {showTax && item.taxable && (
              <p
                className="mt-0.5 text-[11px] tabular-nums"
                style={{ color: CHART_PALETTE.good }}
              >
                Tax: {fmt(item.tax)}
              </p>
            )}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full cursor-pointer py-2 text-xs transition-colors hover:bg-[#f8f9fa]"
          style={{ color: CHART_PALETTE.axis }}
        >
          {expanded
            ? "Show less"
            : `Show ${items.length - ITEMS_PER_PAGE} more`}
        </button>
      )}
    </div>
  );
}

type ListTab = "taxable" | "nonTaxable" | "custom";

const TaxableVsNonTaxableItems = ({
  data,
  isLoading,
  isError,
}: {
  data: TaxableBreakdown;
  isLoading: boolean;
  isError: boolean;
}) => {
  const { currency } = useCurrency();
  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  // The headline figures are catalogue-only, so the whole-business total has
  // to add the custom side back on — otherwise a business selling nothing but
  // custom items would read as having no revenue at all.
  const catalogueRevenue = data.taxableRevenue + data.nonTaxableRevenue;
  const customRevenue =
    (data.customTaxableRevenue ?? 0) + (data.customNonTaxableRevenue ?? 0);
  const totalRevenue = catalogueRevenue + customRevenue;

  // Percentages are of the whole business, so the four revenue tiles sum to
  // 100% between them.
  const pct = (value: number) =>
    totalRevenue > 0 ? (value / totalRevenue) * 100 : 0;

  // Split the donut across everything — taxable vs non-taxable is the question
  // the card is named for; the tiles below break it down by source.
  const allTaxableRevenue =
    data.taxableRevenue + (data.customTaxableRevenue ?? 0);
  const allNonTaxableRevenue =
    data.nonTaxableRevenue + (data.customNonTaxableRevenue ?? 0);
  const taxablePct = pct(allTaxableRevenue);

  const effectiveRate =
    data.taxableRevenue > 0
      ? (data.taxableTaxAmount / data.taxableRevenue) * 100
      : 0;
  const customEffectiveRate =
    (data.customTaxableRevenue ?? 0) > 0
      ? ((data.customTaxableTaxAmount ?? 0) /
          (data.customTaxableRevenue ?? 1)) *
        100
      : 0;

  const customItems = data.customItems ?? [];
  const customTaxableCount =
    data.customTaxableCount ?? customItems.filter((i) => i.taxable).length;
  const customNonTaxableCount =
    data.customNonTaxableCount ?? customItems.length - customTaxableCount;

  const [activeTab, setActiveTab] = useState<ListTab>("taxable");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs: Array<{
    key: ListTab;
    label: string;
    count: number;
    color: string;
  }> = [
    {
      key: "taxable",
      label: "Taxable Items",
      count: data.taxableItems?.length ?? 0,
      color: TAXABLE_COLOR,
    },
    {
      key: "nonTaxable",
      label: "Non-Taxable Items",
      count: data.nonTaxableItems?.length ?? 0,
      color: NON_TAXABLE_COLOR,
    },
    // The custom tab only exists when there is something in it.
    ...(customItems.length > 0
      ? [
          {
            key: "custom" as ListTab,
            label: "Custom Items",
            count: customItems.length,
            color: CUSTOM_COLOR,
          },
        ]
      : []),
  ];

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === activeTab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    setActiveTab(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const activeList =
    activeTab === "taxable"
      ? {
          items: data.taxableItems ?? [],
          total: data.taxableRevenue,
          color: TAXABLE_COLOR,
          empty: "No taxable items",
          showTax: true,
          showTag: false,
        }
      : activeTab === "nonTaxable"
        ? {
            items: data.nonTaxableItems ?? [],
            total: data.nonTaxableRevenue,
            color: NON_TAXABLE_COLOR,
            empty: "No non-taxable items",
            showTax: false,
            showTag: false,
          }
        : {
            items: customItems,
            total: customRevenue,
            color: CUSTOM_COLOR,
            empty: "No custom items",
            showTax: true,
            showTag: true,
          };

  const pieData = [
    { name: "Taxable", value: allTaxableRevenue, color: TAXABLE_COLOR },
    {
      name: "Non-Taxable",
      value: allNonTaxableRevenue,
      color: NON_TAXABLE_COLOR,
    },
  ].filter((d) => d.value > 0);

  // Custom tiles sit in the same grid as the headline three rather than in
  // their own block, so all six read as one set of figures.
  const stats: Array<{
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    /** Icon tile colours; the tile's border takes the icon's own hue. */
    iconClass: string;
  }> = [
    {
      label: "Taxable Item's Revenue",
      value: fmt(data.taxableRevenue),
      sub: `Catalogue · ${pct(data.taxableRevenue).toFixed(1)}% of revenue`,
      icon: Box,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Non-Taxable Item's Revenue",
      value: fmt(data.nonTaxableRevenue),
      sub: `Catalogue · ${pct(data.nonTaxableRevenue).toFixed(1)}% of revenue`,
      icon: Box,
      iconClass: "bg-rose-50 text-rose-600",
    },
    {
      label: "Tax Collected",
      value: fmt(data.taxableTaxAmount),
      sub: `Catalogue · effective rate ${effectiveRate.toFixed(1)}%`,
      icon: Receipt,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    // Only shown once the range actually contains custom items. Kept apart
    // from the catalogue figures above: a custom item's taxability comes from
    // whether tax was charged on the invoice, not from a product setting.
    ...(customItems.length > 0
      ? [
          {
            label: "Custom Taxable Item's Revenue",
            value: fmt(data.customTaxableRevenue ?? 0),
            sub: `${customTaxableCount} ${
              customTaxableCount === 1 ? "item" : "items"
            } · ${pct(data.customTaxableRevenue ?? 0).toFixed(1)}% of revenue`,
            icon: Sparkles,
            iconClass: "bg-cyan-50 text-cyan-600",
          },
          {
            label: "Custom Non-Taxable Item's Revenue",
            value: fmt(data.customNonTaxableRevenue ?? 0),
            sub: `${customNonTaxableCount} ${
              customNonTaxableCount === 1 ? "item" : "items"
            } · ${pct(data.customNonTaxableRevenue ?? 0).toFixed(1)}% of revenue`,
            icon: Sparkles,
            iconClass: "bg-rose-50 text-rose-600",
          },
          {
            label: "Custom Tax Collected",
            value: fmt(data.customTaxableTaxAmount ?? 0),
            sub: `Custom items · effective rate ${customEffectiveRate.toFixed(
              1,
            )}%`,
            icon: Receipt,
            iconClass: "bg-violet-50 text-violet-600",
          },
        ]
      : []),
  ];

  return (
    <ChartCard
      icon={Scale}
      title="Taxable & Non-Taxable Items"
      info={{
        heading: "Reading this card",
        // From useTaxableBreakdown: catalogue items follow the product's tax
        // setting, custom items follow the invoice.
        body: "Covers the date range at the top of the page. A catalogue item counts as taxable when its product is set up that way; an item typed straight onto an invoice counts as taxable when tax was actually charged on it. The percentages are of all revenue in the range, catalogue and custom together.",
      }}
      subtitle="Revenue and tax generated by taxable vs non-taxable items"
      controls={<RangeBadge variant="pill" />}
    >
      {isLoading ? (
        <TaxableSplitSkeleton />
      ) : isError ? (
        <p
          className="py-16 text-center text-sm"
          style={{ color: CHART_PALETTE.bad }}
        >
          Failed to load taxable & non-taxable items
        </p>
      ) : totalRevenue === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Scale size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No taxable & non-taxable items revenue data
          </p>
          <p className="mt-1 text-xs" style={{ color: CHART_PALETTE.subtitle }}>
            Taxable & Non-Taxable Items will appear here
          </p>
        </div>
      ) : (
        <>
          {/* Chart + stats */}
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[220px_1fr]">
            {/* Donut */}
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="none" />
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
                  Taxable
                </span>
                <span
                  className="text-xl font-semibold tracking-tight tabular-nums"
                  style={{ color: CHART_PALETTE.title }}
                >
                  {taxablePct.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Stat tiles — label above the icon-and-figure row, so the
                figure sits on the tile's baseline and the labels line up
                across the grid regardless of icon size. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="relative overflow-hidden rounded-xl border px-5 py-4"
                    style={{ borderColor: CHART_PALETTE.border }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="min-w-0 truncate text-[11px]"
                        style={{ color: CHART_PALETTE.axis }}
                      >
                        {s.label}
                      </span>
                      {/* The tile takes the icon's colour, so `border-current/20`
                          gives a frame in the same hue as the card's own icon. */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/20 ${s.iconClass}`}
                      >
                        <Icon size={15} />
                      </div>
                    </div>

                    <p
                      className="mt-2 truncate text-lg font-semibold tracking-tight tabular-nums"
                      style={{ color: CHART_PALETTE.title }}
                    >
                      {s.value}
                    </p>
                    <p
                      className="mt-0.5 truncate text-[11px]"
                      style={{ color: CHART_PALETTE.subtitle }}
                    >
                      {s.sub}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item lists — one at a time, so the visible list gets the full
              width instead of two cramped columns. */}
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Item tax classification"
                onKeyDown={handleTabKeyDown}
                className="flex items-center gap-1 rounded-xl bg-[#e4f2fe] p-1"
              >
                {tabs.map((tab, i) => {
                  const selected = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`tax-items-tab-${tab.key}`}
                      aria-selected={selected}
                      aria-controls="tax-items-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                        selected
                          ? "bg-white font-bold text-blue-950 shadow-sm"
                          : "font-semibold text-blue-800 hover:text-blue-950"
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tab.color }}
                      />
                      {tab.label}
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e4f2fe] px-1.5 py-px text-[10px] font-bold tabular-nums tracking-wide text-blue-950 ring-1 ring-blue-900/40">
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span
                className="text-sm font-semibold tracking-wide tabular-nums"
                style={{ color: activeList.color }}
              >
                {fmt(activeList.total)}
              </span>
            </div>

            {activeTab === "custom" && (
              <p
                className="mb-2 text-[11px]"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Added on an invoice rather than from the product catalogue —
                classified by whether tax was charged.
              </p>
            )}

            <div
              id="tax-items-panel"
              role="tabpanel"
              aria-labelledby={`tax-items-tab-${activeTab}`}
              tabIndex={0}
              className="focus-visible:outline-none"
            >
              <ItemList
                color={activeList.color}
                items={activeList.items}
                emptyLabel={activeList.empty}
                showTax={activeList.showTax}
                showTaxableTag={activeList.showTag}
              />
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
};

export default TaxableVsNonTaxableItems;
