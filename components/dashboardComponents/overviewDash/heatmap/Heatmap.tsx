"use client";

import { useState } from "react";

// Types

// Current Week: { day -> { hour -> count } }
export interface CurrentWeekHeatmapData {
  [day: string]: { [hour: string]: number };
}

// Current Month: { week -> { day -> count } }
export interface CurrentMonthHeatmapData {
  [week: string]: { [day: string]: number };
}

export interface HeatmapDataSet {
  currentWeek: CurrentWeekHeatmapData;
  currentMonth: CurrentMonthHeatmapData;
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
];
const WEEKS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];

// Color helpers

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
  WEEKS.forEach((week) => {
    let total = 0;
    DAYS.forEach((day) => {
      const v = data[week]?.[day] ?? 0;
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
  const busiest = Object.entries(weekTotals).sort((a, b) => b[1] - a[1])[0];
  return {
    peakWeek,
    peakDay,
    peakValue,
    quietWeek,
    quietDay,
    quietValue,
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
  const currentMonthValues = WEEKS.flatMap((week) =>
    DAYS.map((day) => data.currentMonth[week]?.[day] ?? 0),
  );
  const currentMonthMin = Math.min(...currentMonthValues);
  const currentMonthMax = Math.max(...currentMonthValues);
  const currentMonthStats = deriveCurrentMonthStats(data.currentMonth);

  const min = view === "currentWeek" ? currentWeekMin : currentMonthMin;
  const max = view === "currentWeek" ? currentWeekMax : currentMonthMax;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-2 p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-5 gap-3">
        <div>
          <h2 className="text-[16px] md:text-xl mt-1 font-bold text-gray-900">
            Sales Activity Heatmap
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
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
      <div className="overflow-x-auto">
        {view === "currentWeek" ? (
          <div style={{ minWidth: 360 }}>
            {/* Hour headers */}
            <div className="flex mb-1 ml-12">
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
            {/* Day rows */}
            {DAYS.map((day) => (
              <div key={day} className="flex items-center mb-1.5">
                <div className="w-12 shrink-0 text-xs sm:text-sm text-gray-500 font-medium">
                  {day}
                </div>
                <div className="flex flex-1 gap-0.5 sm:gap-1">
                  {HOURS.map((hour) => {
                    const value = data.currentWeek[day]?.[hour] ?? 0;
                    return (
                      <div
                        key={hour}
                        className="flex-1 rounded-md sm:rounded-lg flex items-center justify-center text-xs font-bold cursor-default select-none transition-transform hover:scale-105 h-6 sm:h-11"
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
                        title={`${day} @ ${hour}: ${value} orders`}
                      >
                        <span className="hidden sm:block">{value}</span>{" "}
                        {/* hide numbers on mobile — too small */}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ minWidth: 320 }}>
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
            {/* Week rows */}
            {WEEKS.map((week) => (
              <div key={week} className="flex items-center mb-1.5">
                <div className="w-16 shrink-0 text-xs sm:text-sm text-gray-500 font-medium">
                  {week}
                </div>
                <div className="flex flex-1 gap-0.5 sm:gap-1">
                  {DAYS.map((day) => {
                    const value = data.currentMonth[week]?.[day] ?? 0;
                    return (
                      <div
                        key={day}
                        className="flex-1 rounded-md sm:rounded-lg flex items-center justify-center text-xs font-bold cursor-default select-none transition-transform hover:scale-105 h-8 sm:h-13"
                        style={{
                          backgroundColor: getCellColor(
                            value,
                            currentMonthMin,
                            currentMonthMax,
                            scheme,
                          ),
                          color: getCellTextColor(
                            value,
                            currentMonthMin,
                            currentMonthMax,
                            scheme,
                          ),
                        }}
                        title={`${week} ${day}: ${value} orders`}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
