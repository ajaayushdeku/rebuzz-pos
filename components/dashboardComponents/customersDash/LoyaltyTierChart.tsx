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
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartPager,
  ChartTooltipBox,
} from "../chartCard";

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
      <ChartTooltipBox
        label={label}
        rows={[
          {
            name: members === 1 ? "member" : "members",
            color,
            value: members.toLocaleString(),
          },
          { name: "Share of members", color, value: `${share.toFixed(1)}%` },
        ]}
      />
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
    <ChartCard
      icon={Award}
      // Amber, as before: Tailwind's amber-600 / amber-200 / amber-50.
      iconColor="#d97706"
      iconBorder="#fde68a"
      iconBg="#fffbeb"
      title="Loyalty Tier Breakdown"
      info={{
        heading: "Reading this chart",
        // Bars are scaled against every tier, not just the page on screen.
        body: "How many enrolled customers sit in each loyalty tier. Bars are measured against the largest tier in the whole ladder, so they stay comparable as you page through, and each tier keeps the colour it was given in loyalty settings. Enrolled counts every tier, not just this page.",
      }}
      subtitle="Members by loyalty status"
      controls={
        !isEmpty && (
          <div className="relative flex flex-row items-center gap-2 mb-4">
            <div className="flex items-center gap-1 rounded-xl bg-[#e4f2fe] p-1">
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
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
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

            <div
              className="mx-1 h-6 w-px"
              style={{ backgroundColor: CHART_PALETTE.control }}
            />

            {/* Enrolled total — the chart shows the split but never the size
                of the programme it is splitting. */}
            <div className="flex flex-col items-end">
              <span
                className="text-[11px]"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                Enrolled
              </span>
              <p
                className="mt-0.5 text-base font-semibold leading-tight tracking-tight tabular-nums"
                style={{ color: CHART_PALETTE.title }}
              >
                {totalMembers.toLocaleString()}
              </p>
            </div>

            <div className="absolute right-0 bottom-[-30px]">
              {totalPages > 1 && (
                <ChartPager
                  first={safePage * PAGE_SIZE + 1}
                  last={Math.min((safePage + 1) * PAGE_SIZE, ordered.length)}
                  total={ordered.length}
                  onPrev={() => setPage(Math.max(0, safePage - 1))}
                  onNext={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                  itemLabel="tiers"
                />
              )}
            </div>
          </div>
        )
      }
      className="min-w-0"
    >
      {/* Chart */}
      {isEmpty ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center sm:h-56 md:h-64">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: CHART_PALETTE.hover }}
          >
            <Award size={24} style={{ color: CHART_PALETTE.subtitle }} />
          </div>
          <p className="text-sm" style={{ color: CHART_PALETTE.title }}>
            No loyalty tier data
          </p>
          <p
            className="max-w-[15rem] text-xs"
            style={{ color: CHART_PALETTE.subtitle }}
          >
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
              <CartesianGrid horizontal={false} stroke={CHART_PALETTE.grid} />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                ticks={xTicks}
                domain={[0, xDomain]}
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="tier"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={yAxisWidth}
              />

              <Tooltip
                content={<CustomTooltip total={totalMembers} />}
                cursor={{ fill: CHART_PALETTE.hover }}
              />

              <Bar dataKey="members" shape={CustomBar}>
                <LabelList
                  dataKey="members"
                  position="right"
                  style={{
                    fill: CHART_PALETTE.title,
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
