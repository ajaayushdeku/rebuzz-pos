"use client";
import { createElement, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Rectangle,
} from "recharts";
import type { BarShapeProps } from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ArrowUp01, Award, List } from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";
import TablePagination from "@/components/ui/TablePagination";

/**
 * Bars per page.
 *
 * A ladder can run to twenty tiers, and twenty bars in a 16rem plot are
 * hairlines. A handful is about what this height reads comfortably, and a
 * typical ladder is shorter than that, so most businesses never see the pager.
 */
const PAGE_SIZE = 5;

/** How the bars can be ordered. */
const ORDERS = [
  {
    id: "threshold" as const,
    label: "By points",
    icon: ArrowUp01,
    hint: "Order the tiers by the points needed to reach them",
  },
  {
    id: "listed" as const,
    label: "Tiers list",
    icon: List,
    hint: "Order the tiers as the loyalty settings list them",
  },
];

export interface TierData {
  tier: string;
  members: number;
  /**
   * The colour the loyalty settings gave this tier.
   *
   * Supplied by the server, which reads the ladder anyway to count the
   * members — this chart renders inside a server tree and cannot read it.
   */
  color?: string;
  /**
   * The tier's minimum points, for the threshold ordering. Absent on a row
   * that is not a rung of the ladder.
   */
  minPoints?: number;
}
export interface TierDataProps {
  data: TierData[];
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
  total: number;
}

/**
 * For a row with no colour of its own.
 *
 * There is no map of tier names to colours here any more: tier names are the
 * business's, so a built-in Bronze/Silver/Gold/Platinum palette could only
 * ever colour four names it happened to guess right. The colour arrives with
 * the row instead, assigned by the same palette the settings page uses.
 */
const FALLBACK_COLOR = "#a1a1aa";

/**
 * A round step whose multiples cover `max` in roughly four intervals.
 *
 * The previous axis used `step = maxMembers` and then plotted ticks at
 * 0…4×step, so the domain was always four times the largest value and the
 * biggest bar could never fill more than a quarter of the plot.
 */
function niceStep(max: number): number {
  const raw = Math.max(max, 1) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(1, Math.round(nice * magnitude));
}

const CustomTooltip = ({
  active,
  payload,
  label,
  total,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const row = (payload[0] as { payload?: TierData }).payload;
    const color = row?.color ?? FALLBACK_COLOR;
    const members = payload[0].value as number;
    const share = total > 0 ? (members / total) * 100 : 0;

    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs capitalize text-gray-600">{label}</span>
        </div>
        <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">
          {members.toLocaleString()}
          <span className="ml-1 text-xs font-medium text-gray-500">
            {members === 1 ? "member" : "members"}
          </span>
          <span className="ml-1.5 text-xs font-medium text-gray-400">
            {share.toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Rounded right-side corners only for horizontal bars with tier-specific color
const CustomBar = (props: BarShapeProps) => {
  const row = props.payload as TierData | undefined;
  return (
    <Rectangle
      {...props}
      radius={[0, 6, 6, 0]}
      fill={row?.color ?? FALLBACK_COLOR}
    />
  );
};

export default function LoyaltyTierChart({ data }: TierDataProps) {
  const [order, setOrder] = useState<"threshold" | "listed">("threshold");
  const [page, setPage] = useState(0);

  // Empty covers "no tiers returned" and "tiers returned but nobody in them" —
  // both render an unreadable, all-zero chart.
  const isEmpty =
    !data || data.length === 0 || data.every((d) => d.members === 0);
  const displayData = data ?? [];

  const ordered =
    order === "threshold"
      ? [...displayData].sort((a, b) => (b.members ?? 0) - (a.members ?? 0))
      : displayData;

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  // Clamped, so a shorter ladder cannot leave the view on an empty page.
  const safePage = Math.min(page, totalPages - 1);
  const visible = ordered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const totalMembers = displayData.reduce(
    (sum, d) => sum + (d.members ?? 0),
    0,
  );

  // Scaled against every tier, not just this page: a domain that rebased per
  // page would make a bar of 10 on one page look longer than a bar of 12 on
  // the next.
  const maxMembers = Math.max(...displayData.map((d) => d.members), 1);
  const step = niceStep(maxMembers);
  const xDomain = Math.ceil(maxMembers / step) * step;
  const xTicks = Array.from(
    { length: Math.round(xDomain / step) + 1 },
    (_, i) => i * step,
  );

  // Tier names are typed by the business, so the axis gutter is sized to the
  // longest one rather than to the four built-in names it used to assume — and
  // capped, so one long name cannot crowd out the bars. Measured across every
  // tier, like the domain: a gutter that resized per page would shift the
  // whole plot sideways as the reader steps through it.
  const longestLabel = displayData.reduce(
    (longest, d) => Math.max(longest, d.tier.length),
    0,
  );
  const yAxisWidth = Math.min(120, Math.max(62, longestLabel * 7 + 12));

  return (
    <div className=" w-full min-w-0 rounded-2xl  p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <Award size={15} className="text-amber-600" />
          </div>
          <ComponentHeader
            title="Loyalty Tier Breakdown"
            subHeader="Members by loyalty status"
          />
        </div>

        {/* Enrolled total — the chart shows the split but never the size of
            the programme it is splitting. Counts every tier, not just the
            page on screen. */}
        {!isEmpty && (
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Enrolled
              </span>
              <p className="mt-0.5 text-base font-bold leading-tight tabular-nums text-gray-900">
                {totalMembers.toLocaleString()}
              </p>
            </div>

            <div className="h-5 border-1  border-gray-200 mx-2" />

            <div className="flex items-center gap-0.5 rounded-lg bg-[#e4f2fe]  p-0.5 ">
              {ORDERS.map(({ id, label, icon, hint }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setOrder(id);
                    // Page one under the new order: holding page three while
                    // the rows reshuffle lands on tiers nobody asked for.
                    setPage(0);
                  }}
                  aria-pressed={order === id}
                  title={hint}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] cursor-pointer ${
                    order === id
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950"
                  }`}
                >
                  {createElement(icon, { size: 12 })}
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {isEmpty ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center sm:h-56 md:h-64">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Award size={24} className="text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No loyalty tier data
          </p>
          <p className="max-w-[15rem] text-xs text-gray-400">
            Tier breakdown appears once tiers are set up in loyalty settings and
            customers are enrolled.
          </p>
        </div>
      ) : (
        <div className="mt-4 h-44 sm:h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visible}
              layout="vertical"
              margin={{
                top: 0,
                right: 44,
                left: 0,
                bottom: 0,
              }}
              barCategoryGap="15%"
            >
              <CartesianGrid horizontal={false} stroke="#f3f4f6" />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9ca3af",
                  fontSize: 12,
                }}
                ticks={xTicks}
                domain={[0, xDomain]}
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="tier"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#6b7280",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                width={yAxisWidth}
              />

              <Tooltip
                content={<CustomTooltip total={totalMembers} />}
                cursor={{
                  fill: "rgba(96,165,250,0.05)",
                }}
              />

              <Bar dataKey="members" shape={CustomBar}>
                <LabelList
                  dataKey="members"
                  position="right"
                  style={{
                    fill: "#374151",
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Outside the plot's fixed-height box, which the pager would overflow. */}
      {!isEmpty && totalPages > 1 && (
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          total={ordered.length}
          noun="tiers"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
