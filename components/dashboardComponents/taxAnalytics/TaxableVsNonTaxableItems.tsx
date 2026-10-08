"use client";

import { useRef, useState } from "react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import {
  Scale,
  Sparkles,
  Box,
  Receipt,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import RangeBadge from "@/components/ui/RangeBadge";
import { ChartCard, ChartTooltipBox } from "../chartCard";
import { TaxableSplitSkeleton } from "./TaxAnalyticsSkeletons";
import type {
  TaxableBreakdown,
  TaxBreakdownItem,
} from "@/hooks/useTaxableBreakdown";
import { STAT_ROW_ITEM } from "../overviewDash/statRow";
import { cn } from "@/lib/utils";

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

  // How many of the hidden rows a single click brings in.
  const STEP = 4;
  const [revealed, setRevealed] = useState(0);
  const hasMore = items.length > ITEMS_PER_PAGE;
  const head = items.slice(0, ITEMS_PER_PAGE);

  // The remainder in groups of four. Each group animates on its own, so a click
  // moves only the rows it brings in.
  const chunks: TaxBreakdownItem[][] = [];
  for (let i = ITEMS_PER_PAGE; i < items.length; i += STEP) {
    chunks.push(items.slice(i, i + STEP));
  }
  const allShown = revealed >= chunks.length;
  const nextCount = allShown
    ? 0
    : Math.min(STEP, items.length - ITEMS_PER_PAGE - revealed * STEP);

  /** One line of the list. A component so both halves stay identical. */
  const Row = ({
    item,
    isFirst = false,
  }: {
    item: TaxBreakdownItem;
    isFirst?: boolean;
  }) => (
    <div
      className={`flex items-start justify-between gap-2 border-b px-3 py-2.5 text-xs transition-colors last:border-0 hover:bg-[#f8f9fa] dark:hover:bg-white/10 ${
        isFirst
          ? "border-t border-[#e8eaed] dark:border-white/10"
          : "border-[#e8eaed] dark:border-white/10"
      }`}
    >
      <div className="min-w-0">
        <p
          className="truncate text-[13px] text-[#3c4043] dark:text-[#e8ecf4]"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          <span className="tabular-nums tracking-wide">
            {item.count.toLocaleString()} {item.count === 1 ? "unit" : "units"}
          </span>

          {showTaxableTag && (
            <span
              className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${
                item.taxable
                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                  : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-[#9aa6bd]"
              }`}
            >
              {item.taxable ? "Taxable" : "Non-taxable"}
            </span>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right tracking-wide">
        <p className="text-[13px] font-medium tabular-nums" style={{ color }}>
          {fmt(item.revenue)}
        </p>
        {/* Tax generated — only meaningful where tax was charged. */}
        {showTax && item.taxable && (
          <p className="mt-0.5 text-[11px] tabular-nums text-[#1e8e3e] dark:text-[#10b981]">
            Tax: {fmt(item.tax)}
          </p>
        )}
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <p className="border-t py-10 text-center text-xs border-[#e8eaed] dark:border-white/10 text-[#9aa0a6] dark:text-[#9aa6bd]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="border-t border-[#e8eaed] dark:border-white/10">
      {head.map((item) => (
        <Row key={item.name} item={item} />
      ))}

      {hasMore && (
        <>
          {/* A grid track per group rather than a height: a group's height is
              not known in advance, and `0fr` → `1fr` is the one way to
              transition to `auto`. The rows stay mounted so there is something
              to reveal; `inert` keeps the closed ones out of tab order. */}
          {chunks.map((chunk, index) => (
            <div
              key={index}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                index < revealed ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden" inert={index >= revealed}>
                {chunk.map((item) => (
                  <Row key={item.name} item={item} />
                ))}
              </div>
            </div>
          ))}

          {/* The rate breakdown's control: a centred pill rather than a full
              bleed row. The chevron turns with the rows it opens. */}
          <div className="flex items-center justify-center gap-2 border-t border-[#e8eaed] py-2 dark:border-white/10">
            {/* Show more */}
            {!allShown && (
              <button
                type="button"
                onClick={() => setRevealed((prev) => prev + 1)}
                aria-expanded={revealed > 0}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:hover:bg-white/10"
              >
                Show {nextCount} more
                <ChevronDown size={12} className="shrink-0" />
              </button>
            )}

            {/* Hide */}
            {revealed > 0 && (
              <button
                type="button"
                onClick={() => setRevealed(0)}
                aria-expanded={revealed > 0}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-400/10 dark:border-rose-400/25 dark:text-rose-300"
              >
                Hide
                <ChevronDown size={12} className="rotate-180 shrink-0" />
              </button>
            )}
          </div>
        </>
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
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-[#7ba2e3]",
    },
    {
      label: "Non-Taxable Item's Revenue",
      value: fmt(data.nonTaxableRevenue),
      sub: `Catalogue · ${pct(data.nonTaxableRevenue).toFixed(1)}% of revenue`,
      icon: Box,
      iconClass:
        "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400",
    },
    {
      label: "Tax Collected",
      value: fmt(data.taxableTaxAmount),
      sub: `Catalogue · effective rate ${effectiveRate.toFixed(1)}%`,
      icon: Receipt,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
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
            iconClass:
              "bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400",
          },
          {
            label: "Custom Non-Taxable Item's Revenue",
            value: fmt(data.customNonTaxableRevenue ?? 0),
            sub: `${customNonTaxableCount} ${
              customNonTaxableCount === 1 ? "item" : "items"
            } · ${pct(data.customNonTaxableRevenue ?? 0).toFixed(1)}% of revenue`,
            icon: Sparkles,
            iconClass:
              "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400",
          },
          {
            label: "Custom Tax Collected",
            value: fmt(data.customTaxableTaxAmount ?? 0),
            sub: `Custom items · effective rate ${customEffectiveRate.toFixed(
              1,
            )}%`,
            icon: Receipt,
            iconClass:
              "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
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
      buttons={<RangeBadge variant="pill" />}
    >
      {isLoading ? (
        <TaxableSplitSkeleton />
      ) : isError ? (
        <p className="py-16 text-center text-sm text-[#d93025] dark:text-[#f87171]">
          Failed to load taxable & non-taxable items
        </p>
      ) : totalRevenue === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-white/10">
            <Scale size={24} className="text-[#9aa0a6] dark:text-[#9aa6bd]" />
          </div>
          <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
            No taxable & non-taxable items revenue data
          </p>
          <p className="mt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
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
                <span className="text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                  Taxable
                </span>
                <span className="text-xl font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                  {taxablePct.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Stat tiles — label above the icon-and-figure row, so the
                figure sits on the tile's baseline and the labels line up
                across the grid regardless of icon size. */}
            <div className="flex items-start gap-3 -mx-4 snap-x snap-mandatory overflow-x-auto scroll-pl-6 px-6  scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-2 sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0 md:gap-3 lg:grid-cols-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className={cn(
                      "relative overflow-hidden rounded-xl border px-5 py-4 border-[#e3e3e3] dark:border-white/10",
                      STAT_ROW_ITEM,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
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

                    <p className="mt-2 truncate text-lg font-semibold tracking-tight tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
                      {s.value}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
                className="flex w-full sm:w-fit items-center gap-1 rounded-xl bg-[#e4f2fe] p-1 dark:bg-white/10"
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
                      className={`w-full sm:w-fit flex flex-row sm:flex-row cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                        selected
                          ? "bg-white font-bold text-blue-950 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                          : "font-semibold text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white"
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tab.color }}
                      />
                      <span className="hidden sm:block"> {tab.label}</span>
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e4f2fe] px-1.5 py-px text-[10px] font-bold tabular-nums tracking-wide text-blue-950 ring-1 ring-blue-900/40 dark:bg-white/10 dark:text-[#e8ecf4]">
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
              <p className="mb-2 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
