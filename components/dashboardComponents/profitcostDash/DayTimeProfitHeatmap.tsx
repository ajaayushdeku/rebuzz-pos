"use client";

import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencySymbol, formatCompactCurrency } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";
import RangeBadge from "@/components/ui/RangeBadge";
import { Grid3x3 } from "lucide-react";
import { CHART_PALETTE, ChartCard } from "../chartCard";

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
  if (profit >= 200) return "bg-emerald-600";
  if (profit >= 150) return "bg-emerald-500";
  if (profit >= 100) return "bg-emerald-400";
  if (profit >= 50) return "bg-emerald-300";
  if (profit > 0) return "bg-emerald-200";
  if (profit === 0) return "bg-emerald-100";
  return "bg-emerald-100";
};

const getTextColor = (profit: number): string => {
  if (profit < 0) return "text-red-900";
  if (profit >= 90) return "text-white";
  return "text-gray-700";
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    <ChartCard
      icon={Grid3x3}
      // Green, as before: Tailwind's green-600 / green-200 / green-50.
      iconColor="#16a34a"
      iconBorder="#bbf7d0"
      iconBg="#f0fdf4"
      title="Day × Time Profit Heatmap"
      info={{
        heading: "Reading this chart",
        // From formatDayTimeProfitAverages: per-bill average in each bucket.
        body: "Each cell is the average profit per bill paid in that weekday and hour, over the date range at the top of the page — a bill's total less its items' cost prices, refunds left out. An hour with no bills shows zero. Hover a cell for its exact figure.",
      }}
      subtitle="Average profit generation by hour and day of week"
      controls={<RangeBadge variant="pill" />}
      className="select-none"
    >
      {/* Heatmap Grid */}
      <div className="relative">
        {/* Scrollable container with hidden scrollbar */}
        <div className="overflow-x-auto scrollbar-hide">
          {/* Flex layout: fixed day labels + scrollable cells */}
          <div className="flex">
            {/* Fixed day labels column */}
            <div className="sticky left-0 z-10 shrink-0 bg-white">
              {/* Time header spacer */}
              <div className="mb-1 h-6 w-12"></div>
              {/* Day labels */}
              {DAYS.map((day) => (
                <div key={day} className="mb-1 flex h-10 items-center gap-1">
                  <span
                    className="w-12 pl-1 text-xs"
                    style={{ color: CHART_PALETTE.axis }}
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable cells section */}
            <div className="min-w-0">
              {/* Time headers */}
              <div
                className="mb-1 grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${TIME_COLUMNS.length}, minmax(60px, 1fr))`,
                }}
              >
                {TIME_COLUMNS.map(({ label }) => (
                  <div
                    key={label}
                    className="flex h-6 items-center justify-center text-center text-[11px]"
                    style={{ color: CHART_PALETTE.subtitle }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Day rows (cells only) */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="mb-1 grid gap-1"
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
                            className={`flex h-10 cursor-default items-center justify-center rounded-md text-[10px] font-medium tracking-wide tabular-nums ${getColor(profit)} ${getTextColor(profit)}`}
                          >
                            {profit >= 10000
                              ? formatCompactCurrency(
                                  profit,
                                  currency.symbol,
                                  currency.locale,
                                )
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
                              Avg profit per bill:{" "}
                              <strong className="tracking-wide">
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

      {/* Legend: the colour scale, under the grid on the right */}
      <div
        className="mt-3 flex items-center justify-end gap-2 pr-2 text-[13px]"
        style={{ color: CHART_PALETTE.title }}
      >
        <span className="h-2.5 w-2.5 rounded-[2px] bg-red-300" />
        <span>Loss</span>
        <span
          className="mx-1 h-3 w-px"
          style={{ backgroundColor: CHART_PALETTE.control }}
        />
        <span>Low</span>
        <div className="flex gap-0.5">
          {[
            "bg-emerald-100",
            "bg-emerald-200",
            "bg-emerald-300",
            "bg-emerald-400",
            "bg-emerald-500",
            "bg-emerald-600",
          ].map((shade) => (
            <span key={shade} className={`h-2.5 w-4 rounded-[2px] ${shade}`} />
          ))}
        </div>
        <span>High profit</span>
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
    </ChartCard>
  );
}
