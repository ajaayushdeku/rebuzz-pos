"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Info, type LucideIcon } from "lucide-react";

import {
  Tooltip as HintTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RangeBadge from "../ui/RangeBadge";
import ExpenseBadge from "../ui/ExpenseBadge";

/**
 * The refreshed dashboard card, shared by the cards that have moved to it
 * (Revenue vs Profit, Sales Trends) so the next one only has to supply its
 * chart.
 *
 * A flat white card with a hairline border and no shadow; an outlined icon on
 * a pale fill; a plain title with reading notes behind an info icon and a
 * lighter subtitle; controls as small outlined pills on the right; square
 * bars on light horizontal gridlines with round-number steps; the legend
 * under the chart on the right.
 */
export const CHART_PALETTE = {
  border: "#e3e3e3",
  control: "#dadce0",
  grid: "#e8eaed",
  title: "#3c4043",
  /** Lighter than the title, so the subtitle reads as secondary. */
  subtitle: "#9aa0a6",
  axis: "#5f6368",
  hover: "#f1f3f4",
  blue: "#1a73e8",
  darkBlue: "#4D78CE",
  teal: "#12a4af",
  /** A third series, when there is one: the reference design's magenta. */
  magenta: "#c5197d",
  /** Good / warning / bad, for figures that carry a verdict. */
  good: "#1e8e3e",
  warn: "#e37400",
  bad: "#d93025",
} as const;

/**
 * The icon tile's default frame and fill: Tailwind's blue-100 and blue-50 at
 * 60%, the shades the cards used before these could be set per card.
 */
const ICON_TILE = {
  border: "#dbeafe",
  bg: "rgb(239 246 255 / 0.6)",
} as const;

/**
 * Bar corners: soft at the top, square where the bar meets the axis, the same
 * on every bar chart. Recharts' order is top-left, top-right, bottom-right,
 * bottom-left.
 */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/** Axis tick text, shared so every card's numbers read the same. */
export const AXIS_TICK = { fill: CHART_PALETTE.axis, fontSize: 12 } as const;

/**
 * Round-number axis steps: 0, 150k, 300k, 450k rather than 149k, 299k, 449k.
 * A step of 1, 2, 2.5 or 5 times a power of ten, about four steps tall, always
 * including zero so a loss reads below the line.
 */
export function niceTicks(min: number, max: number, steps = 4): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max, lo + 1);
  const raw = (hi - lo) / steps;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;

  // The smallest round step that is big enough — then, if rounding both ends
  // outward takes more steps than the target, the next round size up. A range
  // from −237k to 481k in 200k steps runs −400k…600k and leaves a whole empty
  // step at the bottom; in 250k steps it is −250k…500k.
  const sizes = [1, 2, 2.5, 5, 10, 20];
  let i = sizes.findIndex((s) => norm <= s);
  let step = sizes[i] * magnitude;
  const span = (s: number) =>
    Math.round((Math.ceil(hi / s) * s - Math.floor(lo / s) * s) / s);
  while (span(step) > steps && i < sizes.length - 1) {
    i += 1;
    step = sizes[i] * magnitude;
  }

  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(v);
  return ticks;
}

/** The "Amount" style axis title, placed the way Recharts' YAxis expects. */
export const yAxisTitle = (value: string) => ({
  value,
  angle: -90,
  position: "insideLeft" as const,
  offset: 0,
  style: {
    fill: CHART_PALETTE.axis,
    fontSize: 12,
    textAnchor: "middle" as const,
  },
});

/**
 * The card: border, padding, and the header row. Any content goes inside —
 * a chart, a table, a list — so every dashboard card can share the frame.
 */
export function ChartCard({
  icon: Icon,
  iconColor = CHART_PALETTE.blue,
  iconBorder = ICON_TILE.border,
  iconBg = ICON_TILE.bg,
  title,
  info,
  subtitle,
  controls,
  className = "",
  children,
  rangeBadge = false,
  expenseBadge = false,
}: {
  icon: LucideIcon;
  /**
   * The icon tile's colours, any CSS colour. Left out, the tile is the
   * default blue: blue icon, pale blue frame, paler blue fill.
   */
  iconColor?: string;
  iconBorder?: string;
  iconBg?: string;
  title: string;
  /** What the ⓘ beside the title explains: how to read the card. */
  info?: { heading: string; body: ReactNode };
  subtitle: ReactNode;
  /** Pills on the right of the header: range, pager, view switch, badges. */
  controls?: ReactNode;
  /**
   * Extra classes on the card, e.g. `h-full` for cards sharing a grid row, or
   * `overflow-hidden` when something (a lock overlay) must be clipped to the
   * rounded corners. The card is always `relative`, so an overlay can fill it.
   */
  className?: string;
  children: ReactNode;
  rangeBadge?: boolean;
  expenseBadge?: boolean;
}) {
  return (
    <div
      className={`relative w-full rounded-2xl border bg-white px-6 pb-5 pt-5 ${className}`}
      style={{ borderColor: CHART_PALETTE.border }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* A pale frame on a paler fill, kept light so the icon's own
              colour carries it. Blue unless the card says otherwise. */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: iconBorder, backgroundColor: iconBg }}
          >
            <Icon size={16} style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <h3
              className="flex items-center gap-1.5 text-[15px] font-normal"
              style={{ color: CHART_PALETTE.title }}
            >
              <span className="truncate">{title}</span>
              {info && (
                <HintTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`How to read ${title}`}
                      className="flex cursor-help items-center rounded-full font-normal text-gray-400 outline-none transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Info size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={6}
                    className="max-w-64"
                  >
                    <p className="font-semibold">{info.heading}</p>
                    <p className="mt-1 leading-relaxed opacity-80">
                      {info.body}
                    </p>
                  </TooltipContent>
                </HintTooltip>
              )}
            </h3>
            <p
              className="mt-0.5 text-xs tracking-wide"
              style={{ color: CHART_PALETTE.subtitle }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {rangeBadge && (
          <div className="block md:hidden">
            <RangeBadge variant="pill" />
          </div>
        )}

        {expenseBadge && (
          <div className="block md:hidden">
            <ExpenseBadge variant="pill" />
          </div>
        )}

        {controls && <div className="flex items-center gap-2">{controls}</div>}
      </div>

      {children}
    </div>
  );
}

/** Under the chart, on the right. Dot or square per series. */
/**
 * A legend swatch. `dot` and `square` for bars and points; `line` for a
 * solid line series and `dashed` for a reference line, drawn as a short
 * stroke so they read as lines rather than as more bars.
 */
export type LegendShape = "dot" | "square" | "line" | "dashed";

function LegendSwatch({ color, shape }: { color: string; shape: LegendShape }) {
  if (shape === "line" || shape === "dashed") {
    return (
      <svg width="18" height="10" className="shrink-0" aria-hidden>
        <line
          x1="1"
          y1="5"
          x2="17"
          y2="5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={shape === "dashed" ? "4 3" : undefined}
        />
      </svg>
    );
  }
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 ${shape === "dot" ? "rounded-full" : "rounded-[2px]"}`}
      style={{ backgroundColor: color }}
    />
  );
}

export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; shape: LegendShape }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-x-5 gap-y-1 pr-2">
      {items.map(({ label, color, shape }) => (
        <span key={label} className="flex items-center gap-1.5">
          <LegendSwatch color={color} shape={shape} />
          <span className="text-[13px]" style={{ color: CHART_PALETTE.title }}>
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * "‹ 1–6 of 14 ›": a small outlined pager for the header's controls, for a
 * chart that shows its items a page at a time.
 */
export function ChartPager({
  first,
  last,
  total,
  onPrev,
  onNext,
  itemLabel,
}: {
  first: number;
  last: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  /** What is being paged, for the buttons' labels: "products", "categories". */
  itemLabel: string;
}) {
  const button =
    "flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border bg-white px-0.5 py-px"
      style={{ borderColor: CHART_PALETTE.control }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={first <= 1}
        aria-label={`Previous ${itemLabel}`}
        className={button}
        style={{ color: CHART_PALETTE.axis }}
      >
        <ChevronLeft size={13} />
      </button>
      <span
        className="px-0.5 text-[11px] tabular-nums"
        style={{ color: CHART_PALETTE.title }}
      >
        {first}–{last} of {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={last >= total}
        aria-label={`Next ${itemLabel}`}
        className={button}
        style={{ color: CHART_PALETTE.axis }}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

/**
 * The box a hovered bar shows: its label, then one row per series, and an
 * optional footer under a hairline for figures derived from them.
 */
export function ChartTooltipBox({
  label,
  rows,
  footer,
}: {
  label: ReactNode;
  rows: { name: string; color: string; value: ReactNode }[];
  footer?: ReactNode;
}) {
  return (
    <div
      className="min-w-40 rounded-lg border bg-white px-3 py-2.5 shadow-sm"
      style={{ borderColor: CHART_PALETTE.control }}
    >
      <p className="mb-1.5 text-xs" style={{ color: CHART_PALETTE.axis }}>
        {label}
      </p>
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center justify-between gap-4 py-0.5"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-xs" style={{ color: CHART_PALETTE.title }}>
              {row.name}
            </span>
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: CHART_PALETTE.title }}
          >
            {row.value}
          </span>
        </div>
      ))}
      {footer && (
        <div
          className="mt-2 space-y-0.5 border-t pt-2"
          style={{ borderColor: CHART_PALETTE.grid }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * The two looks of the tab switch, both with the selected tab raised in white:
 * - `gray`: the dashboard's grey track (Sales Trends).
 * - `blue`: the Records → Invoices page's tabs — a pale blue rounded track,
 *   bold dark-blue selected tab (Target Tracker).
 */
const SWITCH_STYLE = {
  gray: {
    track: "rounded-lg bg-gray-100",
    tab: "rounded-md font-medium",
    selected: "bg-white text-gray-900 shadow-sm",
    idle: "text-gray-400 hover:text-gray-600",
  },
  blue: {
    track: "rounded-xl bg-[#e4f2fe]",
    tab: "rounded-lg",
    selected: "bg-white font-bold text-blue-950 shadow-sm",
    idle: "font-semibold text-blue-800 hover:text-blue-950",
  },
} as const;

/**
 * A tab switch, one option selected: a view or period switch (Daily / Weekly /
 * Monthly).
 *
 * `compact` sits beside the header's pills (Sales Trends). `full` spans the
 * card's width with larger tabs, for a card whose whole body follows the
 * switch (Target Tracker).
 */
export function PillSwitch<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = "gray",
  size = "compact",
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers. */
  label: string;
  variant?: keyof typeof SWITCH_STYLE;
  size?: "compact" | "full";
}) {
  const style = SWITCH_STYLE[variant];
  const full = size === "full";
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex items-center ${full ? "w-full gap-1 p-1" : "gap-0.5 p-0.5"} ${style.track}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              full ? "flex-1 py-2.5 text-[12px]" : "px-2.5 py-1 text-[11px]"
            } ${style.tab} ${selected ? style.selected : style.idle}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
