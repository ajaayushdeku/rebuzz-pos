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
import { Users, X, Check, SlidersHorizontal } from "lucide-react";
import SampleDataBadge from "@/components/ui/sampledatabadge";

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
  "#f472b6",
  "#60a5fa",
  "#f59e0b",
  "#34d399",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#4ade80",
];

const MAX_STAFF = 8;

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

// ── Staff Filter Modal ────────────────────────────────────────────────────

function StaffFilterModal({
  open,
  onClose,
  allStaff,
  selected,
  colorMap,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  allStaff: string[];
  selected: string[];
  colorMap: Map<string, string>;
  onApply: (names: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [error, setError] = useState("");

  if (!open) return null;

  const toggle = (name: string) => {
    setError("");
    setDraft((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) {
          setError("Select at least 1 staff member.");
          return prev;
        }
        return prev.filter((n) => n !== name);
      }
      if (prev.length >= MAX_STAFF) {
        setError(`Maximum ${MAX_STAFF} staff members allowed.`);
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleApply = () => {
    if (draft.length === 0) {
      setError("Select at least 1 staff member.");
      return;
    }
    onApply(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users size={15} className="text-blue-500" />
              Filter Staff
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select 1–{MAX_STAFF} staff to compare
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Count badge */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {draft.length} / {MAX_STAFF} selected
          </span>
          <div className="flex gap-1">
            {/* Select all (up to 8) */}
            <button
              onClick={() => {
                setError("");
                setDraft(allStaff.slice(0, MAX_STAFF));
              }}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Select top {Math.min(MAX_STAFF, allStaff.length)}
            </button>
            <button
              onClick={() => {
                setError("");
                setDraft([]);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Staff list */}
        <div className="px-5 pb-3 max-h-72 overflow-y-auto space-y-1.5">
          {allStaff.map((name) => {
            const isSelected = draft.includes(name);
            const color = colorMap.get(name) ?? "#6b7280";
            const isDisabled = !isSelected && draft.length >= MAX_STAFF;

            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  isSelected
                    ? "border-blue-200 bg-blue-50"
                    : isDisabled
                      ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {name}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={11} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-500 px-5 pb-2">{error}</p>}

        {/* Progress bar */}
        <div className="px-5 pb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(draft.length / MAX_STAFF) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={draft.length === 0}
            className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply ({draft.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main chart ────────────────────────────────────────────────────────────

export default function StaffOrdersChart({ data }: StaffOrdersChartProps) {
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg p-6 transition duration-300 w-full">
      {isEmpty && <SampleDataBadge />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[16px] md:text-xl font-bold text-gray-900">
            Orders Per Hour by Staff
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
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
            Filter Staff
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
