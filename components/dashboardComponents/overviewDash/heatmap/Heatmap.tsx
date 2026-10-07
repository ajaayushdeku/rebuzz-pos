"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartCard,
  PillSwitch,
} from "@/components/dashboardComponents/chartCard";
import { Grid3x3 } from "lucide-react";

// Types

// Current Week: { day -> { hour -> count } }
export interface CurrentWeekHeatmapData {
  [day: string]: { [hour: string]: number };
}

// A single day cell in the Current Month grid. Carries its real calendar
// date so the UI can label it and distinguish prev-month / future days.
export interface MonthCell {
  count: number;
  /** ISO yyyy-mm-dd for this cell. */
  date: string;
  /** False for the leading days that belong to the previous month. */
  inMonth: boolean;
  /** True for days after today (rendered blank). */
  isFuture: boolean;
}

// Current Month: { week -> { day -> cell } }
export interface CurrentMonthHeatmapData {
  [week: string]: { [day: string]: MonthCell };
}

export interface HeatmapDataSet {
  currentWeek: CurrentWeekHeatmapData;
  currentMonth: CurrentMonthHeatmapData;
  /** ISO date (yyyy-mm-dd) for each weekday of the current week. */
  weekDates?: { [day: string]: string };
  /** Full name of the current month, e.g. "July". */
  monthName?: string;
}

type ViewMode = "currentWeek" | "currentMonth";

// Color schemes — easy to extend or swap

type Stops = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export interface ColorScheme {
  name: string;
  /** Quiet -> busy on a white card: pale, then saturated, then deep. */
  stops: Stops;
  /** Text on the pale end, and on the saturated end. */
  lightText: string;
  darkText: string;
  /** Where the cell gets dark enough to need the other text colour. */
  threshold: number;
  /**
   * The same hue on a dark card, running the other way: quiet sits just above
   * the card so an empty slot recedes, busy is the brightest cell there is.
   * Deep-on-dark would hide exactly the slots the card exists to point at.
   */
  dark: {
    stops: Stops;
  };
}

/**
 * The two inks a cell can wear on a dark card. Which one is used is decided per
 * cell from the cell's own luminance rather than from a threshold on the value:
 * the dark ramp's middle is mid-luminance, where either ink alone sits at about
 * 2.9:1, and taking the better of the two never drops below about 4:1.
 */
const DARK_INK_LIGHT = "#e8ecf4";
const DARK_INK_DARK = "#0f1420";

/** WCAG relative luminance, for choosing between those two. */
const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  blue: {
    name: "Blue",
    stops: [
      [191, 219, 254],
      [59, 130, 246],
      [30, 58, 138],
    ],
    lightText: "#1e40af",
    darkText: "#ffffff",
    threshold: 0.45,
    dark: {
      stops: [
        [28, 40, 64],
        [59, 130, 246],
        [147, 197, 253],
      ],
    },
  },
  green: {
    name: "Green",
    stops: [
      [187, 247, 208],
      [34, 197, 94],
      [20, 83, 45],
    ],
    lightText: "#166534",
    darkText: "#ffffff",
    threshold: 0.45,
    dark: {
      stops: [
        [20, 45, 38],
        [34, 197, 94],
        [134, 239, 172],
      ],
    },
  },
  purple: {
    name: "Purple",
    stops: [
      [233, 213, 255],
      [139, 92, 246],
      [76, 29, 149],
    ],
    lightText: "#6b21a8",
    darkText: "#ffffff",
    threshold: 0.45,
    dark: {
      stops: [
        [38, 30, 60],
        [139, 92, 246],
        [196, 181, 253],
      ],
    },
  },
  orange: {
    name: "Orange",
    stops: [
      [254, 215, 170],
      [249, 115, 22],
      [154, 52, 18],
    ],
    lightText: "#9a3412",
    darkText: "#ffffff",
    threshold: 0.4,
    dark: {
      stops: [
        [58, 36, 22],
        [249, 115, 22],
        [253, 186, 116],
      ],
    },
  },
};

// Constants

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [
  "12am",
  "1am",
  "2am",
  "3am",
  "4am",
  "5am",
  "6am",
  "7am",
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
  "11pm",
];

// Color helpers

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// "2026-06-29" → "Jun 29" (string-based, timezone-safe).
const formatCellDate = (iso: string): string => {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH_ABBR[(m ?? 1) - 1]} ${d}`;
};

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

type Variant = "light" | "dark";

/** Where `value` sits between the view's quietest and busiest slot, 0–1. */
const fraction = (value: number, min: number, max: number): number =>
  max === min ? 0 : (value - min) / (max - min);

/** The ramp's colour at `t`, low → mid → high. */
const rampColor = (t: number, stops: Stops): [number, number, number] => {
  const [low, mid, high] = stops;
  return t < 0.5
    ? [
        lerp(low[0], mid[0], t * 2),
        lerp(low[1], mid[1], t * 2),
        lerp(low[2], mid[2], t * 2),
      ]
    : [
        lerp(mid[0], high[0], (t - 0.5) * 2),
        lerp(mid[1], high[1], (t - 0.5) * 2),
        lerp(mid[2], high[2], (t - 0.5) * 2),
      ];
};

const getCellColor = (
  value: number,
  min: number,
  max: number,
  scheme: ColorScheme,
  variant: Variant = "light",
): string => {
  const stops = variant === "dark" ? scheme.dark.stops : scheme.stops;
  const [r, g, b] = rampColor(fraction(value, min, max), stops);
  return `rgb(${r},${g},${b})`;
};

const getCellTextColor = (
  value: number,
  min: number,
  max: number,
  scheme: ColorScheme,
  variant: Variant = "light",
): string => {
  const t = max === min ? 0 : (value - min) / (max - min);
  if (variant === "dark") {
    // Measured, not thresholded: the dark ramp's middle is mid-luminance, and
    // 0.18 is where the brighter ink stops being the more readable of the two.
    return relativeLuminance(rampColor(t, scheme.dark.stops)) > 0.18
      ? DARK_INK_DARK
      : DARK_INK_LIGHT;
  }
  return t > scheme.threshold ? scheme.darkText : scheme.lightText;
};

/**
 * Both colours for one cell, as custom properties. CSS decides which pair is
 * in force, so no component here has to know the theme.
 */
const cellVars = (
  value: number,
  min: number,
  max: number,
  scheme: ColorScheme,
): React.CSSProperties =>
  ({
    "--cell": getCellColor(value, min, max, scheme),
    "--cell-dark": getCellColor(value, min, max, scheme, "dark"),
    "--cell-text": getCellTextColor(value, min, max, scheme),
    "--cell-text-dark": getCellTextColor(value, min, max, scheme, "dark"),
  }) as React.CSSProperties;

/** What a cell wears to read those four properties. */
const CELL_COLORS =
  "bg-[var(--cell)] text-[var(--cell-text)] dark:bg-[var(--cell-dark)] dark:text-[var(--cell-text-dark)]";

// Stats helpers

interface CurrentWeekStats {
  peakDay: string;
  peakHour: string;
  peakValue: number;
  quietDay: string;
  quietHour: string;
  quietValue: number;
  busiestDay: string;
  busiestDayTotal: number;
}

interface CurrentMonthStats {
  peakWeek: string;
  peakDay: string;
  peakValue: number;
  quietWeek: string;
  quietDay: string;
  quietValue: number;
  busiestWeek: string;
  busiestWeekTotal: number;
}

const deriveCurrentWeekStats = (
  data: CurrentWeekHeatmapData,
): CurrentWeekStats => {
  let peakValue = -Infinity,
    peakDay = "",
    peakHour = "";
  let quietValue = Infinity,
    quietDay = "",
    quietHour = "";
  const dayTotals: Record<string, number> = {};
  DAYS.forEach((day) => {
    let total = 0;
    HOURS.forEach((hour) => {
      const v = data[day]?.[hour] ?? 0;
      total += v;
      if (v > peakValue) {
        peakValue = v;
        peakDay = day;
        peakHour = hour;
      }
      if (v < quietValue) {
        quietValue = v;
        quietDay = day;
        quietHour = hour;
      }
    });
    dayTotals[day] = total;
  });
  const busiest = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
  return {
    peakDay,
    peakHour,
    peakValue,
    quietDay,
    quietHour,
    quietValue,
    busiestDay: busiest[0],
    busiestDayTotal: busiest[1],
  };
};

const deriveCurrentMonthStats = (
  data: CurrentMonthHeatmapData,
): CurrentMonthStats => {
  let peakValue = -Infinity,
    peakWeek = "",
    peakDay = "";
  let quietValue = Infinity,
    quietWeek = "",
    quietDay = "";
  const weekTotals: Record<string, number> = {};
  // Weeks are dynamic (typically 5) and cells carry future/prev-month flags.
  Object.keys(data).forEach((week) => {
    let total = 0;
    DAYS.forEach((day) => {
      const cell = data[week]?.[day];
      // Skip empty/future cells so they don't distort peak/quiet stats.
      if (!cell || cell.isFuture) return;
      const v = cell.count;
      total += v;
      if (v > peakValue) {
        peakValue = v;
        peakWeek = week;
        peakDay = day;
      }
      if (v < quietValue) {
        quietValue = v;
        quietWeek = week;
        quietDay = day;
      }
    });
    weekTotals[week] = total;
  });
  const busiest = Object.entries(weekTotals).sort((a, b) => b[1] - a[1])[0] ?? [
    "—",
    0,
  ];
  return {
    peakWeek,
    peakDay,
    peakValue: peakValue === -Infinity ? 0 : peakValue,
    quietWeek,
    quietDay,
    quietValue: quietValue === Infinity ? 0 : quietValue,
    busiestWeek: busiest[0],
    busiestWeekTotal: busiest[1],
  };
};

// Sub-components

const VIEW_OPTIONS: {
  label: string;
  value: ViewMode;
}[] = [
  { label: "Current Week", value: "currentWeek" },
  { label: "Current Month", value: "currentMonth" },
];

const Legend = ({ scheme }: { scheme: ColorScheme }) => (
  <div className="flex shrink-0 items-center gap-2 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
    <span>Low</span>
    <div className="flex h-2 md:h-4 w-15 sm:w-24 overflow-hidden rounded">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-full flex-1 bg-[var(--cell)] dark:bg-[var(--cell-dark)]"
          style={cellVars(i, 0, 11, scheme)}
        />
      ))}
    </div>
    <span>High</span>
  </div>
);

// Props

export interface SalesHeatmapProps {
  data: HeatmapDataSet;
  defaultColorScheme?: keyof typeof COLOR_SCHEMES;
}

// Component

export default function Heatmap({
  data,
  defaultColorScheme = "blue",
}: SalesHeatmapProps) {
  const [view, setView] = useState<ViewMode>("currentWeek");
  const [schemeKey, setSchemeKey] =
    useState<keyof typeof COLOR_SCHEMES>(defaultColorScheme);
  const scheme = COLOR_SCHEMES[schemeKey];

  // --- Current week view ---
  const currentWeekValues = DAYS.flatMap((day) =>
    HOURS.map((hour) => data.currentWeek[day]?.[hour] ?? 0),
  );
  const currentWeekMin = Math.min(...currentWeekValues);
  const currentWeekMax = Math.max(...currentWeekValues);
  const currentWeekStats = deriveCurrentWeekStats(data.currentWeek);

  // --- Current month view ---
  // Weeks come straight from the data (typically 5, Mon-aligned calendar).
  const monthWeeks = Object.keys(data.currentMonth);
  // Color scale ignores future cells (they're blank) so it isn't skewed to 0.
  const currentMonthValues = monthWeeks.flatMap((week) =>
    DAYS.map((day) => data.currentMonth[week]?.[day]).filter(
      (cell): cell is MonthCell => !!cell && !cell.isFuture,
    ),
  );
  const currentMonthCounts = currentMonthValues.map((c) => c.count);
  const currentMonthMin = currentMonthCounts.length
    ? Math.min(...currentMonthCounts)
    : 0;
  const currentMonthMax = currentMonthCounts.length
    ? Math.max(...currentMonthCounts)
    : 0;
  const currentMonthStats = deriveCurrentMonthStats(data.currentMonth);

  // The icon tile follows the active colour scheme, so the card's own mark
  // reads as a key to the cells below it.
  const schemeRgb = scheme.stops[1].join(",");

  return (
    <ChartCard
      icon={Grid3x3}
      iconColor={`rgb(${schemeRgb})`}
      iconBorder={`rgba(${schemeRgb}, 0.25)`}
      iconBg={`rgba(${schemeRgb}, 0.08)`}
      title="Sales Activity Heatmap"
      info={{
        heading: "Reading this chart",
        // Shading is relative to this view, not to an absolute count.
        body: "How many orders were taken in each slot. Shading runs from the quietest slot to the busiest one in the view you are on, so a cell's darkness is relative to that view — switching between week and month rescales it. In the month view, days before the 1st are dimmed and future days are left blank.",
      }}
      subtitle="Order counts by day and hour — darker cells = more orders"
      buttons={<Legend scheme={scheme} />}
    >
      {/* Controls */}
      <div className="mb-5 flex  gap-3 sm:flex-row items-center justify-between   gap-2 sm:ml-auto w-full flex-wrap  sm:w-auto ">
        <PillSwitch
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
          label="Heatmap view"
          size="compact"
        />

        {/* <div className="block sm:hidden mx-1 h-6 w-px bg-[#dadce0] dark:bg-white/15" /> */}

        {/* Color scheme picker */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
            Color:
          </span>
          <div className="flex gap-1.5">
            {Object.entries(COLOR_SCHEMES).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setSchemeKey(key)}
                title={s.name}
                aria-label={`${s.name} colour scheme`}
                aria-pressed={schemeKey === key}
                className={` h-5 sm:h-6 w-5 sm:w-6 cursor-pointer rounded-full transition-all ${
                  schemeKey === key
                    ? "scale-110 ring-2 ring-[#5f6368] ring-offset-1 dark:ring-[#e8ecf4] dark:ring-offset-[#161d2e]"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: `rgb(${s.stops[1].join(",")})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto scrollbar-hide">
        {view === "currentWeek" ? (
          <div style={{ minWidth: 1000 }}>
            {/* Hour headers */}
            <div className="flex mb-1 ml-14">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[11px] text-[#5f6368] dark:text-[#9aa6bd]"
                >
                  <span className="sm:hidden">
                    {hour.replace("am", "").replace("pm", "")}
                  </span>
                  <span className="hidden sm:block">{hour}</span>
                </div>
              ))}
            </div>
            {/* Day rows — scrollable on small screens */}
            <div className="overflow-x-auto scrollbar-hide">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-14 shrink-0 pr-1 leading-tight">
                    <span className="block text-[11px] text-[#5f6368] sm:text-xs dark:text-[#9aa6bd]">
                      {day}
                    </span>
                    {data.weekDates?.[day] && (
                      <span className="block text-[10px] text-[#9aa0a6] dark:text-[#7b869b]">
                        {formatCellDate(data.weekDates[day])}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 gap-0.5 sm:gap-1">
                    {HOURS.map((hour) => {
                      const value = data.currentWeek[day]?.[hour] ?? 0;
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex h-8 flex-1 cursor-default select-none items-center justify-center rounded-md text-xs font-semibold transition-transform hover:scale-105 sm:h-10 sm:rounded-sm ${CELL_COLORS}`}
                              style={cellVars(
                                value,
                                currentWeekMin,
                                currentWeekMax,
                                scheme,
                              )}
                            >
                              <span>{value}</span>{" "}
                              {/* hide numbers on mobile — too small */}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4}>
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">
                                {day} @ {hour}
                              </span>
                              <span>
                                Orders: <strong>{value}</strong>
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ minWidth: 480 }}>
            {" "}
            {/* Day headers */}
            <div className="flex mb-1 ml-16">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex-1 text-center text-[11px] text-[#5f6368] dark:text-[#9aa6bd]"
                >
                  <span className="sm:hidden">{day.slice(0, 2)}</span>{" "}
                  {/* Mo, Tu, We... */}
                  <span className="hidden sm:block">{day}</span>
                </div>
              ))}
            </div>
            {/* Week rows — scrollable on small screens */}
            <div className="overflow-y-auto max-h-[400px] scrollbar-hide">
              {monthWeeks.map((week) => (
                <div key={week} className="flex items-center mb-1.5">
                  <div className="w-16 shrink-0 pr-1 leading-tight">
                    <span className="block text-[11px] text-[#5f6368] sm:text-xs dark:text-[#9aa6bd]">
                      {week}
                    </span>
                    {data.monthName && (
                      <span className="block text-[10px] text-[#9aa0a6] dark:text-[#7b869b]">
                        ({data.monthName})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 gap-0.5 sm:gap-1">
                    {DAYS.map((day) => {
                      const cell = data.currentMonth[week]?.[day];
                      if (!cell) return <div key={day} className="flex-1" />;

                      const dateLabel = formatCellDate(cell.date);

                      // Future days: blank placeholder with just the date.
                      if (cell.isFuture) {
                        return (
                          <div
                            key={day}
                            className="flex h-12 flex-1 select-none flex-col items-center justify-center rounded-md border border-dashed border-[#e8eaed] bg-[#f8f9fa] sm:h-16 sm:rounded-lg dark:border-white/10 dark:bg-white/5"
                          >
                            <span className="text-[9px] text-[#9aa0a6] sm:text-[10px] dark:text-[#7b869b]">
                              {dateLabel}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Tooltip key={day}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex h-12 flex-1 cursor-default select-none flex-col items-center justify-center rounded-md transition-transform hover:scale-105 sm:h-16 sm:rounded-lg ${CELL_COLORS} ${
                                cell.inMonth
                                  ? ""
                                  : "opacity-70 ring-1 ring-inset ring-[#dadce0] dark:ring-white/20"
                              }`}
                              style={cellVars(
                                cell.count,
                                currentMonthMin,
                                currentMonthMax,
                                scheme,
                              )}
                            >
                              <span className="text-[9px] sm:text-[10px] font-medium opacity-80 leading-none">
                                {dateLabel}
                              </span>
                              <span className="mt-0.5 text-xs font-semibold leading-tight sm:text-sm">
                                {cell.count}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4}>
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">
                                {dateLabel} ({day})
                                {!cell.inMonth && (
                                  <span className="font-normal text-gray-300 dark:text-[#6b7588]">
                                    {" "}
                                    · prev month
                                  </span>
                                )}
                              </span>
                              <span>
                                Orders: <strong>{cell.count}</strong>
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#e8eaed] pt-4 sm:grid-cols-3 dark:border-white/10">
        {view === "currentWeek" ? (
          <>
            {[
              {
                label: "Peak Slot",
                primary: `${currentWeekStats.peakDay} @ ${currentWeekStats.peakHour}`,
                secondary: `${currentWeekStats.peakValue} orders`,
                secondaryColor: `rgb(${scheme.stops[1].join(",")})`,
                secondaryClass: undefined,
              },
              {
                label: "Quietest Slot",
                primary: `${currentWeekStats.quietDay} @ ${currentWeekStats.quietHour}`,
                secondary: `${currentWeekStats.quietValue} orders`,
                secondaryClass: "text-[#9aa0a6] dark:text-[#9aa6bd]",
              },
              {
                label: "Busiest Day",
                primary: currentWeekStats.busiestDay,
                secondary: `${currentWeekStats.busiestDayTotal} total orders`,
                secondaryClass: "text-[#1e8e3e] dark:text-[#10b981]",
              },
            ].map(
              ({
                label,
                primary,
                secondary,
                secondaryColor,
                secondaryClass,
              }) => (
                <div
                  key={label}
                  className="flex items-center justify-between sm:flex-col sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0 last:border-b-0 last:pb-0"
                >
                  <p className="text-[11px] text-[#9aa0a6] sm:mb-1 dark:text-[#9aa6bd]">
                    {label}
                  </p>
                  <div className="text-right sm:text-center">
                    <p className="text-sm font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                      {primary}
                    </p>
                    <p
                      className={`text-xs font-medium sm:text-sm ${secondaryClass ?? ""}`}
                      style={
                        secondaryColor ? { color: secondaryColor } : undefined
                      }
                    >
                      {secondary}
                    </p>
                  </div>
                </div>
              ),
            )}
          </>
        ) : (
          <>
            {[
              {
                label: "Peak Slot",
                primary: `${currentMonthStats.peakWeek} · ${currentMonthStats.peakDay}`,
                secondary: `${currentMonthStats.peakValue} orders`,
                secondaryColor: `rgb(${scheme.stops[1].join(",")})`,
                secondaryClass: undefined,
              },
              {
                label: "Quietest Slot",
                primary: `${currentMonthStats.quietWeek} · ${currentMonthStats.quietDay}`,
                secondary: `${currentMonthStats.quietValue} orders`,
                secondaryClass: "text-[#9aa0a6] dark:text-[#9aa6bd]",
              },
              {
                label: "Busiest Week",
                primary: currentMonthStats.busiestWeek,
                secondary: `${currentMonthStats.busiestWeekTotal} total orders`,
                secondaryClass: "text-[#1e8e3e] dark:text-[#10b981]",
              },
            ].map(
              ({
                label,
                primary,
                secondary,
                secondaryColor,
                secondaryClass,
              }) => (
                <div
                  key={label}
                  className="flex items-center justify-between sm:flex-col sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0 last:border-b-0 last:pb-0"
                >
                  <p className="text-[11px] text-[#9aa0a6] sm:mb-1 dark:text-[#9aa6bd]">
                    {label}
                  </p>
                  <div className="text-right sm:text-center">
                    <p className="text-sm font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                      {primary}
                    </p>
                    <p
                      className={`text-xs font-medium sm:text-sm ${secondaryClass ?? ""}`}
                      style={
                        secondaryColor ? { color: secondaryColor } : undefined
                      }
                    >
                      {secondary}
                    </p>
                  </div>
                </div>
              ),
            )}
          </>
        )}
      </div>
    </ChartCard>
  );
}
