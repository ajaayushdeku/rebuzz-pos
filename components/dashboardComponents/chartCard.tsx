"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Info, type LucideIcon } from "lucide-react";

import {
  Tooltip as HintTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RangeBadge from "../ui/RangeBadge";
import ExpenseBadge from "../ui/ExpenseBadge";

export interface ChartPalette {
  border: string;
  control: string;
  grid: string;
  title: string;
  tooltip: string;
  subtitle: string;
  axis: string;
  hover: string;
  blue: string;
  darkBlue: string;
  teal: string;
  magenta: string;
  good: string;
  warn: string;
  bad: string;
}

export const CHART_PALETTE: ChartPalette = {
  border: "#e3e3e3",
  control: "#dadce0",
  grid: "#e8eaed",
  title: "#3c4043",
  tooltip: "#9FC2EE",

  subtitle: "#9aa0a6",
  axis: "#5f6368",
  hover: "#f1f3f4",
  blue: "#1a73e8",
  darkBlue: "#4D78CE",
  teal: "#12a4af",

  magenta: "#c5197d",

  good: "#1e8e3e",
  warn: "#e37400",
  bad: "#d93025",
} as const;

export interface IconTile {
  border: string;
  bg: string;
}

const ICON_TILE: IconTile = {
  border: "#dbeafe",
  bg: "rgb(239 246 255 / 0.6)",
} as const;

const CHART_DARK = [
  "dark:[&_.recharts-cartesian-grid_line]:stroke-[#2d3443]",
  "dark:[&_.recharts-cartesian-axis-tick_text]:fill-[#9aa6bd]",
  "dark:[&_.recharts-cartesian-axis-line]:stroke-[#2d3443]",
  "dark:[&_.recharts-cartesian-axis-tick-line]:stroke-[#2d3443]",
  "dark:[&_.recharts-label]:fill-[#9aa6bd]!",
  "dark:[&_.recharts-tooltip-cursor]:fill-[#222838]",
  "dark:[&_.recharts-dot]:stroke-[#161d2e]",
  "dark:[&_.recharts-reference-line_line]:stroke-[#3d4657]",
].join(" ");

export const getAxisTick = (isDark: boolean) =>
  ({
    fill: isDark ? CHART_PALETTE.subtitle : CHART_PALETTE.axis,
    fontSize: 12,
  }) as const;

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

export const AXIS_TICK = {
  fill: CHART_PALETTE.axis,
  fontSize: 12,
} as const;

export function niceTicks(min: number, max: number, steps = 4): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max, lo + 1);
  const raw = (hi - lo) / steps;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;

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

export function CardInfo({
  heading,
  body,
  label,
}: {
  heading: string;
  body: ReactNode;

  label: string;
}) {
  return (
    <HintTooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`How to read ${label}`}
          className="flex cursor-help items-center rounded-full font-normal text-gray-400 outline-none transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#7b869b] dark:hover:text-[#c3ccdc]"
        >
          <Info size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        <p className="font-semibold">{heading}</p>
        <p className="mt-1 leading-relaxed opacity-80">{body}</p>
      </TooltipContent>
    </HintTooltip>
  );
}

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
  buttons,
}: {
  icon: LucideIcon;

  iconColor?: string;
  iconBorder?: string;
  iconBg?: string;
  title: string;

  info?: { heading: string; body: ReactNode };
  subtitle: ReactNode;

  controls?: ReactNode;

  className?: string;
  children: ReactNode;
  rangeBadge?: boolean;
  expenseBadge?: boolean;
  buttons?: ReactNode;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const update = () => {
      setIsTouchDevice(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);
  return (
    <div
      className={`relative w-full rounded-2xl border border-[#e3e3e3] bg-white px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5 dark:border-white/10 dark:bg-[#161d2e] ${CHART_DARK} ${className}`}
    >
      <div className="mb-4 flex flex-col gap-2.5 p-0 sm:mb-5 sm:flex-col lg:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className=" w-full  flex min-w-0 flex-1 items-start  sm:items-center gap-3 sm:justify-between ">
          <div
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:flex dark:border-white/10! dark:bg-white/5!"
            style={{ borderColor: iconBorder, backgroundColor: iconBg }}
          >
            <Icon size={16} style={{ color: iconColor }} />
          </div>
          <div className="ml-1 sm:ml-0 min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-sm font-normal text-[#3c4043] sm:text-[15px] dark:text-[#e8ecf4]">
              <span className="truncate">{title}</span>
              {info && (
                <HintTooltip
                  open={isTouchDevice ? infoOpen : undefined}
                  onOpenChange={isTouchDevice ? setInfoOpen : undefined}
                >
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`How to read ${title}`}
                      onClick={() => {
                        if (isTouchDevice) {
                          setInfoOpen((current) => !current);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          isTouchDevice &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          setInfoOpen((current) => !current);
                        }
                      }}
                      className="flex cursor-help items-center rounded-full font-normal text-gray-400 outline-none transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#7b869b] dark:hover:text-[#c3ccdc]"
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
              {/* {info && (
                <HintTooltip open={infoOpen} onOpenChange={setInfoOpen}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`How to read ${title}`}
                      onClick={() => setInfoOpen((open) => !open)}
                      className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 outline-none transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-[#7b869b] dark:hover:bg-white/10 dark:hover:text-[#c3ccdc]"
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
              )} */}
            </h3>

            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug truncate tracking-wide text-[#9aa0a6] sm:line-clamp-none sm:text-xs dark:text-[#9aa6bd]">
              {subtitle}
            </p>
          </div>

          {(rangeBadge || expenseBadge || buttons) && (
            <>
              <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
                {rangeBadge && <RangeBadge variant="pill" />}
                {expenseBadge && <ExpenseBadge variant="pill" />}
              </div>
              {buttons && (
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {buttons && <div className="flex gap-2">{buttons}</div>}
                </div>
              )}
            </>
          )}
        </div>

        {controls && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
            {controls}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

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
          <span className="text-[13px] text-[#3c4043] dark:text-[#c3ccdc]">
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

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

  itemLabel: string;
}) {
  const button =
    "flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-[#a9b4c7] dark:hover:bg-white/10";
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-[#dadce0] bg-white px-0.5 py-px dark:border-white/15 dark:bg-white/5">
      <button
        type="button"
        onClick={onPrev}
        disabled={first <= 1}
        aria-label={`Previous ${itemLabel}`}
        className={button}
      >
        <ChevronLeft size={13} />
      </button>
      <span className="px-0.5 text-[11px] tabular-nums text-[#3c4043] dark:text-[#e8ecf4]">
        {first}–{last} of {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={last >= total}
        aria-label={`Next ${itemLabel}`}
        className={button}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

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
    <div className="min-w-40 rounded-lg border border-[#dadce0] bg-white px-3 py-2.5 shadow-sm dark:border-white/15 dark:bg-[#1b2436]">
      <p className="mb-1.5 text-xs text-[#5f6368] dark:text-[#a9b4c7]">
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
            <span className="text-xs text-[#3c4043] dark:text-[#c3ccdc]">
              {row.name}
            </span>
          </span>
          <span className="text-xs font-medium text-[#3c4043] dark:text-[#e8ecf4]">
            {row.value}
          </span>
        </div>
      ))}
      {footer && (
        <div className="mt-2 space-y-0.5 border-t border-[#e8eaed] pt-2 dark:border-white/10">
          {footer}
        </div>
      )}
    </div>
  );
}

const SWITCH_STYLE = {
  gray: {
    track: "rounded-lg bg-gray-100 dark:bg-white/10",
    tab: "rounded-md font-medium",
    selected:
      "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none",
    idle: "text-gray-400 hover:text-gray-600 dark:text-[#7b869b] dark:hover:text-[#c3ccdc]",
  },
  blue: {
    track: "rounded-xl bg-[#e4f2fe] dark:bg-white/10",
    tab: "rounded-lg",
    selected:
      "bg-white font-bold text-blue-950 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none",
    idle: "font-semibold text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white",
  },
} as const;

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
      className={`flex items-center ${full ? "w-full gap-1 p-1" : "w-fit gap-0.5  p-0.5"} ${style.track}`}
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
