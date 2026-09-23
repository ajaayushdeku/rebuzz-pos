"use client";

import { useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import StaffFilterModal from "./StaffFilterModal";
import {
  AXIS_TICK,
  CHART_PALETTE,
  ChartCard,
  ChartTooltipBox,
  yAxisTitle,
} from "../chartCard";
import RangeBadge from "@/components/ui/RangeBadge";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { HOUR_RANGES } from "@/utils/formatHourReportToday";

export interface StaffDataPoint {
  name: string;
  value: number | null;
}

export interface StaffHourlyData {
  hour: string;
  staff: StaffDataPoint[];
}

interface StaffOrdersChartProps {
  data: StaffHourlyData[];
}

const COLOR_PALETTE = [
  "#a78bfa",
  "#9c2a95",
  "#da2747",
  "#8ecd21",
  "#34d399",
  "#f59e0b",

  "#f472b6",
  "#60a5fa",
  "#fb923c",
  "#22d3ee",
  "#4ade80",
];

export const MAX_STAFF = 8;

const clampHour = (value: number): number =>
  Math.max(0, Math.min(23, Math.floor(Number.isNaN(value) ? 0 : value)));

/** Convert a 24-hour time string (e.g. "14:00") to 12-hour AM/PM ("2:00 PM"). */
function toAmPm(hour24: string): string {
  const [h, m] = hour24.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return hour24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Same options as the hourly sales trend. "Custom" is listed but disabled —
 * it is only ever reached by editing the From / To inputs.
 */
const HOUR_RANGE_OPTIONS = [
  { value: "all", label: "All Day (00:00 – 23:59)" },
  ...HOUR_RANGES.filter((r) => !(r.start === 0 && r.end === 23)).map((r) => ({
    value: `${r.start}-${r.end}`,
    label: r.label,
  })),
  { value: "custom", label: "Custom", disabled: true },
];

// ── Tooltip ───────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: Payload<ValueType, NameType>[];
}) => {
  if (!active || !payload?.length) return null;
  const activeEntries = payload.filter((p) => (p.value as number) > 0);
  if (!activeEntries.length) return null;
  return (
    <ChartTooltipBox
      label={label}
      rows={activeEntries.map((entry) => ({
        name: String(entry.name ?? ""),
        color: (entry.color as string) ?? CHART_PALETTE.blue,
        value: String(entry.value as number),
      }))}
    />
  );
};

// ── Legend ────────────────────────────────────────────────────────────────

const CustomLegend = ({
  staffLines,
}: {
  staffLines: { key: string; color: string }[];
}) => (
  <div className="mt-3 flex flex-wrap items-center justify-end gap-x-5 gap-y-1.5 pr-2">
    {staffLines.map(({ key, color }) => (
      <span key={key} className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[13px]" style={{ color: CHART_PALETTE.title }}>
          {key}
        </span>
      </span>
    ))}
  </div>
);

// ── Main chart ────────────────────────────────────────────────────────────

export default function StaffSalesChart({ data }: StaffOrdersChartProps) {
  const isEmpty = !data || data.length === 0;

  // All unique staff names from data (already limited to 8 by wrapper)
  const allStaffNames = useMemo(
    () => (data[0]?.staff ?? []).map((s) => s.name),
    [data],
  );

  // Color map: name → color (stable, based on index in allStaffNames)
  const colorMap = useMemo(
    () =>
      new Map(
        allStaffNames.map((name, i) => [
          name,
          COLOR_PALETTE[i % COLOR_PALETTE.length],
        ]),
      ),
    [allStaffNames],
  );

  // Selected staff — default to all (up to 8)
  const [selectedStaff, setSelectedStaff] = useState<string[]>(allStaffNames);
  const [modalOpen, setModalOpen] = useState(false);

  // Sync selectedStaff when data changes (e.g. range filter changes)
  useMemo(() => {
    setSelectedStaff(allStaffNames);
  }, [allStaffNames]);

  // ── Hour range ──────────────────────────────────────────────────────────
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>({ start: 10, end: 17 });
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

  // Filter to the selected hours, then to the selected staff
  const filteredData = useMemo(() => {
    const inRange = selectedRange
      ? data.filter((d) => {
          const hour = parseInt(d.hour.split(":")[0], 10);
          return hour >= selectedRange.start && hour <= selectedRange.end;
        })
      : data;

    return inRange.map((hourSlot) => ({
      ...hourSlot,
      staff: hourSlot.staff.filter((s) => selectedStaff.includes(s.name)),
    }));
  }, [data, selectedStaff, selectedRange]);

  const displayData = isEmpty
    ? [{ hour: "No Data", staff: [{ name: "No Staff", value: 0 }] }]
    : filteredData;

  const staffLines = useMemo(
    () =>
      selectedStaff.map((name) => ({
        key: name,
        color: colorMap.get(name) ?? "#6b7280",
      })),
    [selectedStaff, colorMap],
  );

  const flatData = displayData.map(({ hour, staff }) => ({
    hour,
    ...Object.fromEntries(staff.map((s) => [s.name, s.value])),
  }));

  // Dynamic Y-axis
  const allValues = flatData.flatMap((entry) =>
    Object.entries(entry)
      .filter(([key]) => key !== "hour")
      .map(([, val]) => Number(val) || 0),
  );
  const dataMax = Math.max(...allValues, 0);
  const paddedMax = Math.ceil((dataMax * 1.2) / 10) * 10 || 10;
  const tickStep = Math.max(1, Math.ceil(paddedMax / 5 / 5) * 5);
  const yTicks = Array.from(
    { length: Math.floor(paddedMax / tickStep) + 1 },
    (_, i) => i * tickStep,
  );

  // A full 24-hour day does not fit at a readable tick spacing, so the plot
  // scrolls horizontally inside the card.
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
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <ChartCard
      icon={TrendingUp}
      // Green, as before: Tailwind's green-600 / green-200 / green-50.
      iconColor="#16a34a"
      iconBorder="#bbf7d0"
      iconBg="#f0fdf4"
      title="Sales Per Hour by Employee"
      rangeBadge={true}
      info={{
        heading: "Reading this chart",
        // Hour buckets over the page's range, one line per employee.
        body: "Bills taken per hour of the day by each employee, across the date range at the top of the page — so an hour's figure is the total for that hour over every day in the range. Use the hour range to narrow the day, and Filter employee to pick who is drawn.",
      }}
      subtitle="Throughput breakdown across the day per team member."
      controls={
        <div className="flex flex-col items-end gap-1.5">
          <div className="relative flex flex-row items-center gap-2">
            {/* Hour Range Filter — same control as the hourly sales trend */}
            <FilterSelect
              value={presetValue}
              options={HOUR_RANGE_OPTIONS}
              onChange={handlePresetChange}
              className="w-[210px]"
            />
            <div
              className="mx-1 h-6 w-px"
              style={{ backgroundColor: CHART_PALETTE.control }}
            />
            {/* Custom From / To hour inputs */}
            <div className="flex items-center gap-1.5">
              <label
                className="whitespace-nowrap text-xs"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                From
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={fromHour}
                onChange={(e) => handleFromChange(Number(e.target.value))}
                className="w-14 rounded-lg border border-[#dadce0] bg-white px-2 py-2.5 text-xs text-[#3c4043] tabular-nums focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <label
                className="whitespace-nowrap text-xs"
                style={{ color: CHART_PALETTE.subtitle }}
              >
                To
              </label>
              <input
                type="number"
                min={0}
                max={23}
                value={toHour}
                onChange={(e) => handleToChange(Number(e.target.value))}
                className="w-14 rounded-lg border border-[#dadce0] bg-white px-2 py-2.5 text-xs text-[#3c4043] tabular-nums focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div
              className="mx-1 h-6 w-px"
              style={{ backgroundColor: CHART_PALETTE.control }}
            />

            {/* Employee filter */}
            {!isEmpty && allStaffNames.length > 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex shrink-0 cursor-pointer flex-row items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
              >
                <SlidersHorizontal size={12} />
                Filter employee
                {selectedStaff.length < allStaffNames.length && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {selectedStaff.length}
                  </span>
                )}
              </button>
            )}

            <div className="absolute right-0 bottom-[-22px] hidden md:block">
              {" "}
              <RangeBadge variant="pill" />
            </div>
          </div>

          {rangeError && (
            <p className="text-xs" style={{ color: CHART_PALETTE.bad }}>
              {rangeError}
            </p>
          )}
        </div>
      }
    >
      {isEmpty && <SampleDataBadge />}

      {/* Selected staff summary pills */}
      {!isEmpty && selectedStaff.length < allStaffNames.length && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedStaff.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              style={{
                borderColor: colorMap.get(name) + "60",
                backgroundColor: colorMap.get(name) + "15",
                color: colorMap.get(name),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorMap.get(name) }}
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Chart — horizontally scrollable, a full day does not fit at once */}
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-[#dadce0] bg-white/90 p-2 shadow-sm transition-colors hover:bg-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full border border-[#dadce0] bg-white/90 p-2 shadow-sm transition-colors hover:bg-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className="overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            className="h-55 md:h-75"
            style={{ minWidth: Math.max(flatData.length * 95, 600) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={flatData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid vertical={false} stroke={CHART_PALETTE.grid} />
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
                  }) => (
                    <text
                      x={x}
                      y={Number(y) + 8}
                      textAnchor="middle"
                      fill={CHART_PALETTE.axis}
                      fontSize={12}
                    >
                      {payload.value}
                      <tspan fontSize={10} fill={CHART_PALETTE.subtitle}>
                        {" "}
                        [{toAmPm(payload.value)}]
                      </tspan>
                    </text>
                  )}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  ticks={yTicks}
                  domain={[0, paddedMax]}
                  width={70}
                  label={yAxisTitle("Bills taken")}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend staffLines={staffLines} />} />
                {staffLines.map(({ key, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: color, stroke: color }}
                    activeDot={{
                      r: 5,
                      fill: color,
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter modal */}
      <StaffFilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        allStaff={allStaffNames}
        selected={selectedStaff}
        colorMap={colorMap}
        onApply={setSelectedStaff}
      />
    </ChartCard>
  );
}
