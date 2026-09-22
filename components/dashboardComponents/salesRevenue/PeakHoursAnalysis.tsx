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
} from "recharts";
import RangeBadge from "@/components/ui/RangeBadge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
  BAR_RADIUS,
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartLegend,
  ChartTooltipBox,
  niceTicks,
  yAxisTitle,
} from "../chartCard";

export interface PeakHourlyData {
  hour: string;
  revenue: number;
  sales: number;
}

interface PeakHourlyDataProps {
  data: PeakHourlyData[];
}

const ORDERS_COLOR = CHART_PALETTE.darkBlue;
/**
 * Revenue is only in the tooltip, never drawn, so its row gets a neutral dot
 * rather than a series colour that would send the reader looking for a bar.
 */
const REVENUE_DOT = CHART_PALETTE.control;

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

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as PeakHourlyData;
  return (
    <ChartTooltipBox
      label={label}
      rows={[
        {
          name: "Avg. Orders",
          color: ORDERS_COLOR,
          value: point.sales.toFixed(2),
        },
        {
          name: "Avg. Revenue",
          color: REVENUE_DOT,
          value: formatCurrencySymbol(
            point.revenue,
            currency.symbol,
            currency.locale,
          ),
        },
      ]}
    />
  );
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

/** The From / To hour inputs, outlined like the card's other controls. */
const HOUR_INPUT_CLASS =
  "w-14 rounded-lg border bg-white px-2 py-2 text-xs focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500";

/** A round arrow over the chart's edge, shown while there is more to scroll. */
const ScrollButton = ({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={side === "left" ? "Scroll left" : "Scroll right"}
    className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border bg-white transition-colors hover:bg-[#f1f3f4] ${
      side === "left" ? "left-0" : "right-0"
    }`}
    style={{ borderColor: CHART_PALETTE.control, color: CHART_PALETTE.axis }}
  >
    {side === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
  </button>
);

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

  // ── Y-axis for order counts ──
  // Averages can be fractional, so a step can be too (2.5, 0.5).
  const formatYAxis = (value: number): string =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);

  const maxSales = Math.max(...filteredData.map((d) => d.sales), 0);
  // At least 0–4, so a quiet (or empty) range still counts in whole orders
  // instead of stretching a fraction of one order over the full height.
  const ticks = niceTicks(0, Math.max(maxSales, 4));

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
    <ChartCard
      icon={Clock}
      title="Peak Hours Analysis"
      rangeBadge={true}
      info={{
        heading: "Reading this chart",
        // Verified against getPeakHoursData + formatPeakHourAverages.
        body: "Each bar is the average number of paid bills in that hour of the day, over the date range at the top of the page. Refunded bills are left out, and each hour is averaged over only the days that had a sale in it. The hour filter narrows which hours are shown. Hover a bar for the average revenue too.",
      }}
      subtitle="Average number of orders per hour across the selected period"
      controls={
        <div className="relative  ">
          {/* Hour Range Filter — a toolbar above the chart rather than in the
          header, which keeps the header's pills small. */}
          <div className="mb-4 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                value={presetValue}
                options={HOUR_RANGE_OPTIONS}
                onChange={handlePresetChange}
                className="w-[210px]"
              />

              {/* Vertical divider */}
              <div
                className="mx-1 h-6 w-px"
                style={{ backgroundColor: CHART_PALETTE.control }}
              />

              {/* Custom From / To hour inputs */}
              <div className="flex items-center gap-1.5">
                <label
                  className="whitespace-nowrap text-xs"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  From
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={fromHour}
                  onChange={(e) => handleFromChange(Number(e.target.value))}
                  className={HOUR_INPUT_CLASS}
                  style={{
                    borderColor: CHART_PALETTE.control,
                    color: CHART_PALETTE.title,
                  }}
                />
                <label
                  className="whitespace-nowrap text-xs"
                  style={{ color: CHART_PALETTE.axis }}
                >
                  To
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={toHour}
                  onChange={(e) => handleToChange(Number(e.target.value))}
                  className={HOUR_INPUT_CLASS}
                  style={{
                    borderColor: CHART_PALETTE.control,
                    color: CHART_PALETTE.title,
                  }}
                />
              </div>
            </div>

            {rangeError && <p className="text-xs text-red-500">{rangeError}</p>}
          </div>

          <div className="hidden md:block absolute right-0 bottom-[-15px]">
            <RangeBadge variant="pill" />
          </div>
        </div>
      }
    >
      {/* CHART with horizontal scroll */}
      <div className="relative">
        {canScrollLeft && (
          <ScrollButton side="left" onClick={() => scroll("left")} />
        )}
        {canScrollRight && (
          <ScrollButton side="right" onClick={() => scroll("right")} />
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
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                barCategoryGap="5%"
              >
                <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />

                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={{ stroke: CHART_PALETTE.control }}
                  tickSize={6}
                  interval="preserveStartEnd"
                  // The 24-hour label with its 12-hour reading beside it,
                  // smaller and lighter: "14:00 [2:00 PM]".
                  tick={({
                    x,
                    y,
                    payload,
                  }: {
                    x: number | string;
                    y: number | string;
                    payload: { value: string };
                  }) => (
                    <text
                      x={x}
                      y={y}
                      dy="0.71em"
                      textAnchor="middle"
                      fill={AXIS_TICK.fill}
                      fontSize={10}
                    >
                      {payload.value}
                      <tspan fontSize={8} fill={CHART_PALETTE.subtitle}>
                        {" "}
                        [{toAmPm(payload.value)}]
                      </tspan>
                    </text>
                  )}
                />

                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  ticks={ticks}
                  domain={[ticks[0], ticks[ticks.length - 1]]}
                  width={56}
                  label={yAxisTitle("Avg. orders")}
                />

                <Tooltip
                  content={<CustomTooltip currency={currency} />}
                  cursor={{ fill: "rgba(60,64,67,0.04)" }}
                />

                <Bar
                  dataKey="sales"
                  name="Avg. Orders"
                  fill={ORDERS_COLOR}
                  radius={BAR_RADIUS}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ChartLegend
        items={[{ label: "Avg. Orders", color: ORDERS_COLOR, shape: "dot" }]}
      />
    </ChartCard>
  );
};

export default PeakHoursAnalysis;
