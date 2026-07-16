"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export interface ColorScheme {
  name: string;
  stops: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  lightText: string;
  darkText: string;
  threshold: number;
}

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
  },
};

// Constants

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

const getCellColor = (
  value: number,
  min: number,
  max: number,
  scheme: ColorScheme,
): string => {
  const t = max === min ? 0 : (value - min) / (max - min);
  const [low, mid, high] = scheme.stops;
  const [r, g, b] =
    t < 0.5
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
  return `rgb(${r},${g},${b})`;
};

const getCellTextColor = (
  value: number,
  min: number,
  max: number,
  scheme: ColorScheme,
): string => {
  const t = max === min ? 0 : (value - min) / (max - min);
  return t > scheme.threshold ? scheme.darkText : scheme.lightText;
};

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

interface LegendProps {
  scheme: ColorScheme;
  min: number;
  max: number;
}
const Legend = ({ scheme, min, max }: LegendProps) => (
  <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
    <span>Low</span>
    <div className="flex rounded overflow-hidden h-4 w-24">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-full"
          style={{
            backgroundColor: getCellColor(i, 0, 11, scheme),
          }}
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

  const min = view === "currentWeek" ? currentWeekMin : currentMonthMin;
  const max = view === "currentWeek" ? currentWeekMax : currentMonthMax;

  return (
    <div className="bg-white w-full">
      {/* Header */}
      <div className="flex flex-row items-start justify-between mb-5 gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Sales Activity Heatmap
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Order counts by day and hour — darker cells = more orders
          </p>
        </div>
        <Legend scheme={scheme} min={min} max={max} />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        {/* View toggle — full width on mobile */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
          {VIEW_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Color scheme picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Color:</span>
          <div className="flex gap-1.5">
            {Object.entries(COLOR_SCHEMES).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setSchemeKey(key)}
                title={s.name}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  schemeKey === key
                    ? "border-gray-400 scale-110"
                    : "border-transparent"
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
                  className="flex-1 text-center text-xs text-gray-400 font-medium"
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
                    <span className="block text-xs sm:text-sm text-gray-500 font-medium">
                      {day}
                    </span>
                    {data.weekDates?.[day] && (
                      <span className="block text-[10px] text-gray-400">
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
                              className="flex-1 rounded-md sm:rounded-sm flex items-center justify-center text-xs font-bold cursor-default select-none transition-transform hover:scale-105 h-8 sm:h-10"
                              style={{
                                backgroundColor: getCellColor(
                                  value,
                                  currentWeekMin,
                                  currentWeekMax,
                                  scheme,
                                ),
                                color: getCellTextColor(
                                  value,
                                  currentWeekMin,
                                  currentWeekMax,
                                  scheme,
                                ),
                              }}
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
                  className="flex-1 text-center text-xs text-gray-400 font-medium"
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
                    <span className="block text-xs sm:text-sm text-gray-500 font-medium">
                      {week}
                    </span>
                    {data.monthName && (
                      <span className="block text-[10px] text-gray-400">
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
                            className="flex-1 rounded-md sm:rounded-lg flex flex-col items-center justify-center select-none h-12 sm:h-16 bg-gray-50 border border-dashed border-gray-200"
                          >
                            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium">
                              {dateLabel}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Tooltip key={day}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex-1 rounded-md sm:rounded-lg flex flex-col items-center justify-center cursor-default select-none transition-transform hover:scale-105 h-12 sm:h-16 ${
                                cell.inMonth
                                  ? ""
                                  : "opacity-70 ring-1 ring-inset ring-gray-300"
                              }`}
                              style={{
                                backgroundColor: getCellColor(
                                  cell.count,
                                  currentMonthMin,
                                  currentMonthMax,
                                  scheme,
                                ),
                                color: getCellTextColor(
                                  cell.count,
                                  currentMonthMin,
                                  currentMonthMax,
                                  scheme,
                                ),
                              }}
                            >
                              <span className="text-[9px] sm:text-[10px] font-medium opacity-80 leading-none">
                                {dateLabel}
                              </span>
                              <span className="text-xs sm:text-sm font-bold leading-tight mt-0.5">
                                {cell.count}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={4}>
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">
                                {dateLabel} ({day})
                                {!cell.inMonth && (
                                  <span className="font-normal text-gray-300">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-100">
        {view === "currentWeek" ? (
          <>
            {[
              {
                label: "Peak Slot",
                primary: `${currentWeekStats.peakDay} @ ${currentWeekStats.peakHour}`,
                secondary: `${currentWeekStats.peakValue} orders`,
                secondaryColor: `rgb(${scheme.stops[1].join(",")})`,
              },
              {
                label: "Quietest Slot",
                primary: `${currentWeekStats.quietDay} @ ${currentWeekStats.quietHour}`,
                secondary: `${currentWeekStats.quietValue} orders`,
                secondaryColor: undefined,
              },
              {
                label: "Busiest Day",
                primary: currentWeekStats.busiestDay,
                secondary: `${currentWeekStats.busiestDayTotal} total orders`,
                secondaryColor: "#22c55e",
              },
            ].map(({ label, primary, secondary, secondaryColor }) => (
              <div
                key={label}
                className="flex items-center justify-between sm:flex-col sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0 last:border-b-0 last:pb-0"
              >
                <p className="text-xs text-gray-400 sm:mb-1">{label}</p>
                <div className="text-right sm:text-center">
                  <p className="text-sm font-bold text-gray-900">{primary}</p>
                  <p
                    className="text-xs sm:text-sm font-medium"
                    style={{
                      color: secondaryColor ?? "#9ca3af",
                    }}
                  >
                    {secondary}
                  </p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              {
                label: "Peak Slot",
                primary: `${currentMonthStats.peakWeek} · ${currentMonthStats.peakDay}`,
                secondary: `${currentMonthStats.peakValue} orders`,
                secondaryColor: `rgb(${scheme.stops[1].join(",")})`,
              },
              {
                label: "Quietest Slot",
                primary: `${currentMonthStats.quietWeek} · ${currentMonthStats.quietDay}`,
                secondary: `${currentMonthStats.quietValue} orders`,
                secondaryColor: undefined,
              },
              {
                label: "Busiest Week",
                primary: currentMonthStats.busiestWeek,
                secondary: `${currentMonthStats.busiestWeekTotal} total orders`,
                secondaryColor: "#22c55e",
              },
            ].map(({ label, primary, secondary, secondaryColor }) => (
              <div
                key={label}
                className="flex items-center justify-between sm:flex-col sm:items-center border-b sm:border-b-0 pb-3 sm:pb-0 last:border-b-0 last:pb-0"
              >
                <p className="text-xs text-gray-400 sm:mb-1">{label}</p>
                <div className="text-right sm:text-center">
                  <p className="text-sm font-bold text-gray-900">{primary}</p>
                  <p
                    className="text-xs sm:text-sm font-medium"
                    style={{
                      color: secondaryColor ?? "#9ca3af",
                    }}
                  >
                    {secondary}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
