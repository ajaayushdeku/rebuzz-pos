"use client";

import { useState, useMemo, useRef } from "react";
import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { HOUR_RANGES } from "@/utils/formatHourReportToday";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface HourlyData {
  hour: string;
  revenue: number;
}

interface HourlyDataProps {
  data: HourlyData[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
        <p className="text-gray-400 text-xs">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Revenue</span>
          <span className="text-xs font-bold text-violet-800">
            {formatCurrencySymbol(
              payload[0].value as number,
              currency.symbol,
              currency.locale,
            )}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const clampHour = (value: number): number =>
  Math.max(0, Math.min(23, Math.floor(Number.isNaN(value) ? 0 : value)));

export default function HourlySalesChart({ data }: HourlyDataProps) {
  const { currency } = useCurrency();
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>({ start: 10, end: 17 });

  // Custom hour-range inputs
  const [fromHour, setFromHour] = useState(10);
  const [toHour, setToHour] = useState(17);
  const [rangeError, setRangeError] = useState("");

  const applyCustomRange = (from: number, to: number) => {
    if (from > to) {
      setRangeError('"From" hour must be less than or equal to "To" hour.');
      return;
    }
    setRangeError("");
    setSelectedRange({ start: from, end: to });
  };

  const handleFromChange = (raw: number) => {
    const from = clampHour(raw);
    setFromHour(from);
    applyCustomRange(from, toHour);
  };

  const handleToChange = (raw: number) => {
    const to = clampHour(raw);
    setToHour(to);
    applyCustomRange(fromHour, to);
  };

  const handlePresetChange = (val: string) => {
    if (val === "custom") return;
    if (val === "all") {
      setSelectedRange(null);
      setFromHour(0);
      setToHour(23);
      setRangeError("");
      return;
    }
    const [start, end] = val.split("-").map(Number);
    setSelectedRange({ start, end });
    setFromHour(start);
    setToHour(end);
    setRangeError("");
  };

  // Which preset (if any) the active range corresponds to.
  const presetValue = (() => {
    if (!selectedRange) return "all";
    const match = HOUR_RANGES.find(
      (r) => r.start === selectedRange.start && r.end === selectedRange.end,
    );
    return match ? `${match.start}-${match.end}` : "custom";
  })();

  const filteredData = useMemo(() => {
    if (!selectedRange) return data;
    return data.filter((d) => {
      const hour = parseInt(d.hour.split(":")[0], 10);
      return hour >= selectedRange.start && hour <= selectedRange.end;
    });
  }, [data, selectedRange]);

  const formatYAxis = (value: number): string =>
    value >= 1000
      ? `${currency.symbol} ${value / 1000}k`
      : formatCurrencySymbol(value, currency.symbol, currency.locale);

  const maxRevenue = Math.max(...filteredData.map((d) => d.revenue), 0);
  const domainMax =
    maxRevenue === 0 ? 500 : Math.ceil(maxRevenue / 100) * 100 + 100;
  const tickCount = 5;
  const tickStep = Math.ceil(domainMax / tickCount / 100) * 100;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleScroll = () => {
    updateScrollButtons();
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-4 md:p-6 w-full mt-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div className="flex-shrink-0">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
            Hourly Sales Trend
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Revenue throughput across all operating hours today
          </p>
        </div>

        {/* Hour Range Filter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={presetValue}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent whitespace-nowrap"
            >
              <option value="all">All Day (00:00 – 23:59)</option>
              {HOUR_RANGES.filter((r) => !(r.start === 0 && r.end === 23)).map(
                (range) => (
                  <option
                    key={range.label}
                    value={`${range.start}-${range.end}`}
                  >
                    {range.label}
                  </option>
                ),
              )}
              <option value="custom" disabled>
                Custom
              </option>
            </select>

            {/* Vertical divider */}
            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Custom From / To hour inputs */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-400 whitespace-nowrap">
                From
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={fromHour}
                onChange={(e) => handleFromChange(Number(e.target.value))}
                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <label className="text-xs text-gray-400 whitespace-nowrap">
                To
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={toHour}
                onChange={(e) => handleToChange(Number(e.target.value))}
                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {rangeError && <p className="text-xs text-red-500">{rangeError}</p>}
        </div>
      </div>

      {/* CHART with horizontal scroll */}
      <div className="relative">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
            aria-label="Scroll left"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
            aria-label="Scroll right"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div style={{ minWidth: Math.max(filteredData.length * 60, 600) }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={filteredData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop
                      offset="100%"
                      stopColor="#7c3aed"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="#f3f4f6" />

                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#9ca3af",
                    fontSize: 11,
                  }}
                  dy={8}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  ticks={ticks}
                  domain={[0, domainMax]}
                  width={65}
                />

                <Tooltip
                  content={<CustomTooltip currency={currency} />}
                  cursor={{
                    stroke: "#7c3aed",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{
                    r: 4,
                    fill: "#7c3aed",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#7c3aed",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
