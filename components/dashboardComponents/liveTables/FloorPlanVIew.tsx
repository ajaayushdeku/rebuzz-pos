"use client";

import { useState } from "react";
import { Users, DollarSign, Clock, LayoutGrid } from "lucide-react";
import type { LiveTable, ViewMode } from "@/lib/mockData/mock-live-tables";
import {
  fmtMinutes,
  getStatusColor,
  getStatusLabel,
} from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbolOnly } from "@/utils/helper";

// ── Table node ────────────────────────────────────────────────────────────

function TableNode({
  table,
  mode,
  isSelected,
  onClick,
}: {
  table: LiveTable;
  mode: ViewMode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { currency } = useCurrency();
  const color = getStatusColor(table.status);
  const isRound = table.shape === "round";
  const isLarge = table.isLarge;

  const size = isLarge ? 84 : 64;
  const radius = isRound ? "9999px" : isLarge ? "16px" : "12px";

  // What to show inside based on mode
  const mainLine = (): string => {
    switch (mode) {
      case "status":
        return table.id.toString();
      case "covers":
        return table.id.toString();
      case "total":
        return table.id.toString();
      case "time":
        return table.id.toString();
    }
  };

  const subLine = (): string | null => {
    switch (mode) {
      case "status":
        // Status mode shows the label via the dedicated status span below.
        return null;
      case "covers":
        return table.status === "open" || table.status === "cleaning"
          ? "—"
          : `${table.covers}`;
      case "total":
        return table.bill
          ? `${formatCurrencySymbolOnly(currency.symbol)} ${table.bill}`
          : "—";
      case "time":
        return table.seatedMinutes ? fmtMinutes(table.seatedMinutes) : "—";
    }
  };

  const dotCount = Math.min(table.covers, 6);

  return (
    <div
      style={{
        position: "absolute",
        left: `${table.x}%`,
        top: `${table.y}%`,
        transform: "translate(-50%, -50%)",
        width: size,
        height: size,
        borderRadius: radius,
        border: `2px solid ${isSelected ? "#fff" : color}`,
        backgroundColor: isSelected ? color + "40" : "#1e2a3a",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: 4,
        transition: "all 0.15s ease",
        boxShadow: isSelected
          ? `0 0 0 3px ${color}60`
          : table.hasAlert
            ? `0 0 0 2px #f59e0b`
            : "none",
      }}
      onClick={onClick}
    >
      {/* Cover count badge */}
      {table.covers > 0 && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "white",
          }}
        >
          {table.covers}
        </div>
      )}

      {/* Alert A badge */}
      {table.hasAlert && (
        <div
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: "white",
          }}
        >
          A
        </div>
      )}

      {/* Table number */}
      <span
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: isLarge ? 17 : 15,
          lineHeight: 1,
        }}
      >
        {table.id}
      </span>

      {/* Sub content */}
      {mode === "status" ? (
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: Math.min(dotCount, 6) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
          ))}
        </div>
      ) : null}

      {subLine() && subLine() !== table.id.toString() && (
        <span
          style={{
            color: color,
            fontWeight: 600,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {subLine()}
        </span>
      )}

      {/* Status label */}
      {mode === "status" && (
        <span
          style={{
            color: color,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {getStatusLabel(table.status)}
        </span>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────

const LEGEND = [
  { label: "Available", color: "#22c55e" },
  { label: "Occupied", color: "#3b82f6" },
  { label: "Reserved", color: "#f59e0b" },
  { label: "Needs Cleaning", color: "#ef4444" },
];

// ── View mode buttons ─────────────────────────────────────────────────────

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "status", label: "Status", icon: <LayoutGrid size={13} /> },
  { id: "covers", label: "Covers", icon: <Users size={13} /> },
  { id: "total", label: "Total", icon: <DollarSign size={13} /> },
  { id: "time", label: "Time", icon: <Clock size={13} /> },
];

// ── Main component ────────────────────────────────────────────────────────

interface FloorPlanViewProps {
  indoorTables: LiveTable[];
  outdoorTables: LiveTable[];
  selectedTableId: number | null;
  onSelectTable: (table: LiveTable) => void;
}

export default function FloorPlanView({
  indoorTables,
  outdoorTables,
  selectedTableId,
  onSelectTable,
}: FloorPlanViewProps) {
  const [zone, setZone] = useState<"indoor" | "outdoor">("indoor");
  const [mode, setMode] = useState<ViewMode>("status");

  const tables = zone === "indoor" ? indoorTables : outdoorTables;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 px-5 py-3.5 border-b border-gray-100">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-gray-900">
              Live Floor Plan
            </span>
            <span className="text-[10px] flex flex-row items-center gap-1 font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
              LIVE
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Real-time seating · updated{" "}
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4">
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone tabs */}
      <div className="px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { id: "indoor", label: "Indoor", count: indoorTables.length },
            { id: "outdoor", label: "Outdoor", count: outdoorTables.length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setZone(id as "indoor" | "outdoor")}
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-sm font-semibold border-[1.5px] transition-all ${
                zone === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "border-transparent text-gray-700 hover:text-gray-800"
              }`}
            >
              {label}
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  zone === id
                    ? "bg-gray-400 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Dark floor canvas ── */}
      <div
        className="relative mx-5 my-5 rounded-2xl overflow-hidden"
        style={{ background: "#0d1b2a", height: 500 }}
      >
        {/* Kitchen Pass label */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1"
          style={{ zIndex: 10 }}
        >
          <span className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">
            ⚙ Kitchen Pass
          </span>
        </div>

        {/* Entrance label */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1"
          style={{ zIndex: 10 }}
        >
          <span className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">
            ⬆ Entrance
          </span>
        </div>

        {/* Decorative leaf sprites */}
        {[
          [35, 38],
          [60, 28],
          [45, 62],
          [72, 55],
        ].map(([lx, ly], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${lx}%`,
              top: `${ly}%`,
              opacity: 0.15,
              fontSize: 18,
              pointerEvents: "none",
            }}
          >
            🌿
          </span>
        ))}

        {/* Table nodes */}
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            mode={mode}
            isSelected={selectedTableId === table.id}
            onClick={() => onSelectTable(table)}
          />
        ))}
      </div>

      {/* ── View mode pill bar ── */}
      <div className="flex justify-center pb-5">
        <div className="flex items-center bg-gray-900 rounded-full p-1 gap-1">
          {VIEW_MODES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                mode === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
