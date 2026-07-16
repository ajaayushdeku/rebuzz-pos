"use client";

import { useState, useMemo } from "react";
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
import { SlidersHorizontal } from "lucide-react";
import SampleDataBadge from "@/components/ui/sampledatabadge";
import StaffFilterModal from "./StaffFilterModal";

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
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
  "#60a5fa",
  "#fb923c",
  "#22d3ee",
  "#4ade80",
];

export const MAX_STAFF = 8;

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
    <div className="bg-white rounded-xl px-4 py-3 shadow-lg border border-gray-100 min-w-32">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
      {activeEntries.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color as string }}
            />
            <span className="text-xs text-gray-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">
            {entry.value as number}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Legend ────────────────────────────────────────────────────────────────

const CustomLegend = ({
  staffLines,
}: {
  staffLines: { key: string; color: string }[];
}) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2">
    {staffLines.map(({ key, color }) => (
      <div key={key} className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-gray-600">{key}</span>
      </div>
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

  // Filter data to only selected staff
  const filteredData = useMemo(
    () =>
      data.map((hourSlot) => ({
        ...hourSlot,
        staff: hourSlot.staff.filter((s) => selectedStaff.includes(s.name)),
      })),
    [data, selectedStaff],
  );

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg p-5 transition duration-300 w-full">
      {isEmpty && <SampleDataBadge />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Sales Per Hour by Employee
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Throughput breakdown across the day per team member.
          </p>
        </div>

        {/* Filter button */}
        {!isEmpty && allStaffNames.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shrink-0"
          >
            <SlidersHorizontal size={12} />
            Filter Employee
            {selectedStaff.length < allStaffNames.length && (
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {selectedStaff.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Selected staff summary pills */}
      {!isEmpty && selectedStaff.length < allStaffNames.length && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedStaff.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium"
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

      {/* Chart */}
      <div className="h-55 md:h-75">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={flatData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              ticks={yTicks}
              domain={[0, paddedMax]}
              width={30}
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

      {/* Filter modal */}
      <StaffFilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        allStaff={allStaffNames}
        selected={selectedStaff}
        colorMap={colorMap}
        onApply={setSelectedStaff}
      />
    </div>
  );
}
