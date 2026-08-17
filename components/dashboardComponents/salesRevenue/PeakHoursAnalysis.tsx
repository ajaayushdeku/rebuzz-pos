"use client";

import { useState, useMemo, useRef } from "react";
import { CustomTooltipProps } from "@/lib/types/chart";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { HOUR_RANGES } from "@/utils/formatHourReportToday";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
  Legend,
} from "recharts";
import type { BarShapeProps } from "recharts";
import { ComponentHeader } from "@/components/ComponentHeader";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Clock } from "lucide-react";

export interface PeakHourlyData {
  hour: string;
  revenue: number;
  sales: number;
}

interface PeakHourlyDataProps {
  data: PeakHourlyData[];
}

const clampHour = (value: number): number =>
  Math.max(0, Math.min(23, Math.floor(Number.isNaN(value) ? 0 : value)));

/** Convert a 24‑hour time string (e.g. "14:00") to 12‑hour AM/PM (e.g. "2:00 PM"). */
function toAmPm(hour24: string): string {
  const [h, m] = hour24.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return hour24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-5 mt-2">
    {[{ label: "Avg. Orders", color: "#3a7ced" }].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload as PeakHourlyData;
    return (
      <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 min-w-44">
        <p className="text-gray-400 text-xs mb-1.5">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Avg. Orders</span>
          <span className="text-xs font-bold text-blue-800">
            {point.sales.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">Avg. Revenue</span>
          <span className="text-xs font-bold text-violet-800">
            {formatCurrencySymbol(
              point.revenue,
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

/**
 * Options for the hour-range dropdown. "Custom" is listed but disabled: it is
 * only ever reached by editing the From / To inputs, matching how the native
 * <option disabled> behaved.
 */
const HOUR_RANGE_OPTIONS = [
  { value: "all", label: "All Day (00:00 – 23:59)" },
  ...HOUR_RANGES.filter((r) => !(r.start === 0 && r.end === 23)).map((r) => ({
    value: `${r.start}-${r.end}`,
    label: r.label,
  })),
  { value: "custom", label: "Custom", disabled: true },
];

const PeakHoursAnalysis = ({ data }: PeakHourlyDataProps) => {
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

  // ── Y-axis for order counts (integers) ──
  const formatYAxis = (value: number): string =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);

  const maxSales = Math.max(...filteredData.map((d) => d.sales), 0);
  const domainMax = maxSales <= 0 ? 5 : Math.max(5, Math.ceil(maxSales * 1.15));
  const tickStep = Math.max(1, Math.ceil(domainMax / 5));
  const ticks = Array.from(
    { length: Math.floor(domainMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  const CustomBar = (props: BarShapeProps) => (
    <Rectangle {...props} radius={[8, 8, 0, 0]} fill="#3a7ced" />
  );

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
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow duration-300 p-5 w-full">
      {/* HEADER */}
      <div className=" flex flex-col  md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"> */}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Clock size={15} className="text-blue-600" />
          </div>
          <ComponentHeader
            title="Peak Hours Analysis"
            subHeader="Average number of orders per hour across the selected period"
          />
        </div>

        {/* </div> */}

        {/* Hour Range Filter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={presetValue}
              options={HOUR_RANGE_OPTIONS}
              onChange={handlePresetChange}
              className="w-[210px]"
            />

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
                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div style={{ minWidth: Math.max(filteredData.length * 90, 600) }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={filteredData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
                barCategoryGap="5%"
              >
                <CartesianGrid vertical={false} stroke="#f3f4f6" />

                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                  interval="preserveStartEnd"
                  tick={({
                    x,
                    y,
                    payload,
                  }: {
                    x: number | string;
                    y: number | string;
                    payload: { value: string };
                  }) => {
                    const ampm = toAmPm(payload.value);
                    const yNum = Number(y);
                    return (
                      <text
                        x={x}
                        y={yNum + 8}
                        textAnchor="middle"
                        fill="#9ca3af"
                        fontSize={10}
                      >
                        {payload.value}
                        <tspan fontSize={8} fill="#b0b7c3">
                          {" "}
                          [{ampm}]
                        </tspan>
                      </text>
                    );
                  }}
                />

                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  ticks={ticks}
                  domain={[0, domainMax]}
                  allowDecimals={false}
                  width={45}
                />

                <Tooltip
                  content={<CustomTooltip currency={currency} />}
                  cursor={{
                    fill: "rgba(58,124,237,0.06)",
                  }}
                />

                <Legend content={<CustomLegend />} />

                <Bar dataKey="sales" name="Avg. Orders" shape={CustomBar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursAnalysis;
