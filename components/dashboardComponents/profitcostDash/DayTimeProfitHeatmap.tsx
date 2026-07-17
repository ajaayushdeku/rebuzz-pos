"use client";

import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCompactNumber, formatCurrencySymbol } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import { ComponentHeader } from "@/components/ComponentHeader";

export interface DayTimeProfitData {
  day: string;
  hour: number;
  averageProfit: number;
}

interface DayTimeProfitHeatmapProps {
  data: DayTimeProfitData[];
}

const getColor = (profit: number): string => {
  if (profit < 0) return "bg-red-300";
  if (profit >= 150) return "bg-emerald-600";
  if (profit >= 120) return "bg-emerald-500";
  if (profit >= 90) return "bg-emerald-400";
  if (profit >= 60) return "bg-emerald-300";
  if (profit >= 30) return "bg-emerald-200";
  return "bg-emerald-100";
};

const getTextColor = (profit: number): string => {
  if (profit < 0) return "text-red-900";
  if (profit >= 90) return "text-white";
  return "text-gray-700";
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// All 24 hours of the day
const TIME_COLUMNS: { label: string; hour: number }[] = [
  { label: "12am", hour: 0 },
  { label: "1am", hour: 1 },
  { label: "2am", hour: 2 },
  { label: "3am", hour: 3 },
  { label: "4am", hour: 4 },
  { label: "5am", hour: 5 },
  { label: "6am", hour: 6 },
  { label: "7am", hour: 7 },
  { label: "8am", hour: 8 },
  { label: "9am", hour: 9 },
  { label: "10am", hour: 10 },
  { label: "11am", hour: 11 },
  { label: "12pm", hour: 12 },
  { label: "1pm", hour: 13 },
  { label: "2pm", hour: 14 },
  { label: "3pm", hour: 15 },
  { label: "4pm", hour: 16 },
  { label: "5pm", hour: 17 },
  { label: "6pm", hour: 18 },
  { label: "7pm", hour: 19 },
  { label: "8pm", hour: 20 },
  { label: "9pm", hour: 21 },
  { label: "10pm", hour: 22 },
  { label: "11pm", hour: 23 },
];

export default function DayTimeProfitHeatmap({
  data,
}: DayTimeProfitHeatmapProps) {
  const { currency } = useCurrency();

  // Fast "day-hour" → averageProfit lookup, recomputed only when data changes.
  const profitMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) map.set(`${d.day}-${d.hour}`, d.averageProfit);
    return map;
  }, [data]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full relative select-none">
      {/* Header */}
      <div className="mb-6">
        <ComponentHeader
          title=" Day × Time Profit Heatmap"
          subHeader="Average profit generation by hour and day of week"
        />
      </div>

      {/* Heatmap Grid */}
      <div className="relative">
        {/* Scrollable container with hidden scrollbar */}
        <div className="overflow-x-auto scrollbar-hide">
          {/* Flex layout: fixed day labels + scrollable cells */}
          <div className="flex">
            {/* Fixed day labels column */}
            <div className="sticky left-0 z-10 bg-white shrink-0">
              {/* Time header spacer */}
              <div className="h-6 mb-1 w-12"></div>
              {/* Day labels */}
              {DAYS.map((day) => (
                <div key={day} className="h-10 flex gap-1 items-center mb-1">
                  <span className="text-xs text-gray-600 font-medium w-12 pl-1">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable cells section */}
            <div className="min-w-0">
              {/* Time headers */}
              <div
                className="grid gap-1 mb-1"
                style={{
                  gridTemplateColumns: `repeat(${TIME_COLUMNS.length}, minmax(60px, 1fr))`,
                }}
              >
                {TIME_COLUMNS.map(({ label }) => (
                  <div
                    key={label}
                    className="text-center text-xs text-gray-500 font-medium h-6 flex items-center justify-center"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day rows (cells only) */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="grid gap-1 mb-1 "
                  style={{
                    gridTemplateColumns: `repeat(${TIME_COLUMNS.length}, minmax(60px, 1fr))`,
                  }}
                >
                  {TIME_COLUMNS.map(({ label, hour }) => {
                    const profit = profitMap.get(`${day}-${hour}`) ?? 0;

                    return (
                      <Tooltip key={`${day}-${label}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-10 rounded flex items-center justify-center text-[10px] font-medium cursor-default ${getColor(profit)} ${getTextColor(profit)}`}
                          >
                            {profit >= 10000
                              ? `${currency.symbol} ${formatCompactNumber(profit)}`
                              : formatCurrencySymbol(
                                  profit,
                                  currency.symbol,
                                  currency.locale,
                                )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4}>
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">
                              {day} {label}
                            </span>
                            <span>
                              Avg Profit:{" "}
                              <strong>
                                {" "}
                                {formatCurrencySymbol(
                                  profit,
                                  currency.symbol,
                                  currency.locale,
                                )}
                              </strong>
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-500">Loss</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-red-300"></div>
        </div>
        <span className="text-xs text-gray-500">|</span>
        <span className="text-xs text-gray-500">Low</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-emerald-100"></div>
          <div className="w-4 h-4 rounded bg-emerald-200"></div>
          <div className="w-4 h-4 rounded bg-emerald-300"></div>
          <div className="w-4 h-4 rounded bg-emerald-400"></div>
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <div className="w-4 h-4 rounded bg-emerald-600"></div>
        </div>
        <span className="text-xs text-gray-500">High Profit</span>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
