"use client";

import { useRef, useState } from "react";
import {
  Users,
  DollarSign,
  Clock,
  LayoutGrid,
  Move,
  Check,
  RotateCcw,
} from "lucide-react";
import type { LiveTable, ViewMode } from "@/lib/mockData/mock-live-tables";
import {
  fmtMinutes,
  getStatusColor,
  getStatusLabel,
} from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol, formatCurrencySymbolOnly } from "@/utils/helper";
import { useTableTicket } from "@/hooks/useTableTicket";

// ── Layout persistence (per-browser) ──────────────────────────────────────
// Positions aren't stored by the API, so a custom floor arrangement is saved
// to localStorage keyed by the table's stable `_id`.
const LAYOUT_STORAGE_KEY = "live-tables-layout";
type LayoutMap = Record<string, { x: number; y: number }>;

function loadLayout(): LayoutMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ── Table node ────────────────────────────────────────────────────────────

function TableNode({
  table,
  mode,
  isSelected,
  editing,
  pos,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  table: LiveTable;
  mode: ViewMode;
  isSelected: boolean;
  editing: boolean;
  pos: { x: number; y: number };
  onClick: () => void;
  onDragStart: (
    e: React.PointerEvent<HTMLDivElement>,
    table: LiveTable,
  ) => void;
  onDragMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const { currency } = useCurrency();
  const color = getStatusColor(table.status);
  const isRound = table.shape === "round";
  const isRect = table.shape === "rectangle";
  const isLarge = table.isLarge;

  // Square (≤4 seats), rectangle (5–8), round (>8).
  const width = isRound ? 84 : isRect ? 100 : 64;
  const height = isRound ? 84 : isRect ? 58 : 64;

  // Fetch the open ticket when a mode needs its data (Total amount / Time seated).
  const needsTicket = mode === "total" || mode === "time";
  const ticketInvoice = needsTicket
    ? (table.currentTicket?.invoice ?? null)
    : null;
  const { data: ticket } = useTableTicket(ticketInvoice);
  // Capture "now" once at mount so render stays pure (no Date.now() in body).
  const [nowMs] = useState(() => Date.now());

  const radius = isRound ? "9999px" : "12px";

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
      case "total": {
        const amount = ticket?.grandTotal ?? table.bill;
        return amount != null
          ? `${formatCurrencySymbol(amount, currency.symbol, currency.locale)}`
          : "—";
      }
      case "time": {
        const minutes = ticket?.createdAt
          ? Math.max(
              0,
              Math.round(
                (nowMs - new Date(ticket.createdAt).getTime()) / 60000,
              ),
            )
          : table.seatedMinutes;
        return minutes != null ? fmtMinutes(minutes) : "—";
      }
    }
  };

  // Seat dots represent the table's seat count (capped so they fit the node).
  const dotCount = Math.min(table.seats, 8);

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        width: width,
        height: height,
        borderRadius: radius,
        border: `2px solid ${isSelected ? "#fff" : color}`,
        backgroundColor: isSelected ? color + "40" : "#1e2a3a",
        cursor: editing ? "grab" : "pointer",
        touchAction: editing ? "none" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: 4,
        // No position transition while editing so the node tracks the pointer.
        transition: editing ? "box-shadow 0.15s ease" : "all 0.15s ease",
        boxShadow: isSelected
          ? `0 0 0 3px ${color}60`
          : table.hasAlert
            ? `0 0 0 2px #f59e0b`
            : "none",
      }}
      onClick={editing ? undefined : onClick}
      onPointerDown={editing ? (e) => onDragStart(e, table) : undefined}
      onPointerMove={editing ? onDragMove : undefined}
      onPointerUp={editing ? onDragEnd : undefined}
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
            maxWidth: width - 12,
          }}
        >
          {Array.from({ length: dotCount }).map((_, i) => (
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

  // ── Drag-to-arrange (Edit Layout) ──────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<LayoutMap>(() => loadLayout());
  const [dragPos, setDragPos] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; w: number; h: number } | null>(null);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);

  const tables = zone === "indoor" ? indoorTables : outdoorTables;

  // Effective position: live drag > saved layout > auto-generated (table.x/y).
  const posFor = (t: LiveTable): { x: number; y: number } => {
    if (dragPos && dragPos.id === t._id) return { x: dragPos.x, y: dragPos.y };
    return layout[t._id] ?? { x: t.x, y: t.y };
  };

  const handleDragStart = (
    e: React.PointerEvent<HTMLDivElement>,
    t: LiveTable,
  ) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture?.(e.pointerId);
    dragRef.current = { id: t._id, w: el.offsetWidth, h: el.offsetHeight };
    const start = posFor(t);
    dragPosRef.current = { x: start.x, y: start.y };
    setDragPos({ id: t._id, x: start.x, y: start.y });
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Clamp so the node stays fully inside the canvas (half its size margin).
    const halfW = (drag.w / 2 / rect.width) * 100;
    const halfH = (drag.h / 2 / rect.height) * 100;
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.min(100 - halfW, Math.max(halfW, x));
    y = Math.min(100 - halfH, Math.max(halfH, y));
    dragPosRef.current = { x, y };
    setDragPos({ id: drag.id, x, y });
  };

  const handleDragEnd = () => {
    const drag = dragRef.current;
    const pos = dragPosRef.current;
    dragRef.current = null;
    dragPosRef.current = null;
    setDragPos(null);
    if (!drag || !pos) return;
    const next = { ...layout, [drag.id]: pos };
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy-mode errors
    }
  };

  const resetLayout = () => {
    setLayout({});
    try {
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

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

      {/* Zone tabs + Edit Layout controls */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between gap-2">
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

        {/* Edit Layout controls */}
        <div className="flex items-center gap-2">
          {editing && (
            <button
              onClick={resetLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              editing
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
          >
            {editing ? <Check size={13} /> : <Move size={13} />}
            {editing ? "Done" : "Edit Layout"}
          </button>
        </div>
      </div>

      {/* ── Dark floor canvas ── */}
      <div
        ref={canvasRef}
        className="relative mx-5 my-5 rounded-2xl overflow-hidden"
        style={{ background: "#0d1b2a", height: 500 }}
      >
        {/* Edit-mode hint */}
        {editing && (
          <div
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/40 rounded-full px-3 py-1"
            style={{ zIndex: 10 }}
          >
            <Move size={11} className="text-blue-200" />
            <span className="text-[10px] text-blue-100 font-semibold tracking-wide">
              Drag tables to rearrange
            </span>
          </div>
        )}

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
            editing={editing}
            pos={posFor(table)}
            onClick={() => onSelectTable(table)}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
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
