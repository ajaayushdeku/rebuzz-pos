"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Users,
  Clock,
  MoreVertical,
  Armchair,
  Pencil,
  Trash2,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import { fmtMinutes } from "@/lib/mockData/mock-live-tables";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { useTableTicket } from "@/hooks/useTableTicket";
import ChangeTableModal from "@/components/dashboardComponents/liveTables/ChangeTableModal";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    hex: string; // real CSS color — for inline styles
    textColor: string; // tailwind class — for the card
    border: string;
    iconColor: string; // tailwind class — for the card icon
    status: string;
  }
> = {
  all: {
    label: "All",
    hex: "#475569", // slate-600
    textColor: "text-slate-600",
    border: "border-slate-500",
    iconColor: "text-slate-600",
    status: "all",
  },
  occupied: {
    label: "Occupied",
    hex: "#2563eb", // blue-600
    textColor: "text-blue-600",
    border: "border-blue-500",
    iconColor: "text-blue-600",
    status: "occupied",
  },
  free: {
    label: "Free",
    hex: "#16a34a", // green-600
    textColor: "text-green-600",
    border: "border-gray-200",
    iconColor: "text-green-600",
    status: "free",
  },
};

function TableCard({
  table,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onChangeTable,
}: {
  table: LiveTable;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (table: LiveTable) => void;
  onDelete: (table: LiveTable) => void;
  onChangeTable: (table: LiveTable) => void;
}) {
  // A table is "occupied" when it has an assigned ticket.
  const isOccupied = !!table.currentTicket;
  const { currency } = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Occupied tables carry an open ticket — fetch it for the live bill + time.
  const { data: ticket } = useTableTicket(table.currentTicket?.invoice ?? null);

  const [nowMs] = useState(() => Date.now());

  const isActive = table.status === "occupied" || !!table.currentTicket;

  const config = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.free;

  const bill = ticket?.grandTotal ?? table.bill;

  const seatedMinutes = ticket?.createdAt
    ? Math.max(
        0,
        Math.round((nowMs - new Date(ticket.createdAt).getTime()) / 60000),
      )
    : table.seatedMinutes;

  return (
    <div
      onClick={onClick}
      className={`
        group
        bg-white
        rounded-2xl
        border
        ${config.border}
        px-5 pt-5 pb-2
        cursor-pointer
        transition-all
        hover:shadow-md
        ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : "shadow-sm"}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center gap-2 ${config.textColor}`}>
          <Armchair size={17} strokeWidth={2} className={config.iconColor} />

          <span className="text-sm font-medium">{config.label}</span>
        </div>

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="
              text-gray-400
              hover:text-gray-600
              transition-colors
              p-0.5
              rounded-md
            "
          >
            <MoreVertical size={17} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-20 w-40 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {isOccupied ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onChangeTable(table);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ArrowRightLeft size={14} className="text-blue-400" />
                  Change Table
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(table);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={14} className="text-gray-400" />
                    Edit Table
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(table);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Name */}
      <h3 className="text-xl font-semibold text-gray-900 leading-none mb-5">
        {table.name || `Table ${table.id}`}
      </h3>

      {/* Seats */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users size={16} className="text-slate-500" strokeWidth={1.8} />

        <span>
          {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
        </span>
      </div>

      {/* Bottom Information */}
      <div className="mt-4 pt-3 border-t border-gray-100 min-h-[34px]">
        {isActive ? (
          <div className="flex items-center justify-between">
            {/* Bill */}
            {bill != null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-green-600 font-mono tracking-tight">
                  {formatCurrencySymbol(bill, currency.symbol, currency.locale)}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Time */}
            {seatedMinutes != null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={14} strokeWidth={1.8} />

                <span>{fmtMinutes(seatedMinutes)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[16px]" />
        )}
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────

function DeleteTableModal({
  table,
  onClose,
  onDeleted,
}: {
  table: LiveTable | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!table) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${table._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to delete table.");
        setDeleting(false);
        return;
      }
      onDeleted();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 " onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Table
            </h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-700">
              {table.name || `Table ${table.id}`}
            </span>
            ? This action cannot be undone.
          </p>

          {error && (
            <p className="text-xs font-medium text-red-500 mb-3">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GridViewProps {
  tables: LiveTable[];
  selectedTableId: number | null;
  onSelectTable: (table: LiveTable) => void;
  onEditTable: (table: LiveTable) => void;
  onTableDeleted: () => void;
  onTableChanged: () => void;
}

export default function GridView({
  tables,
  selectedTableId,
  onSelectTable,
  onEditTable,
  onTableDeleted,
  onTableChanged,
}: GridViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<LiveTable | null>(null);
  const [changeTarget, setChangeTarget] = useState<LiveTable | null>(null);
  const [changeModalKey, setChangeModalKey] = useState(0);
  const [tableStatus, setTableStatus] = useState("all");

  const handleOpenChangeTable = (table: LiveTable) => {
    setChangeModalKey((k) => k + 1);
    setChangeTarget(table);
  };

  const { filteredTables, counts } = useMemo(() => {
    const occupied = tables.filter((t) => t.status === "occupied");
    const free = tables.filter((t) => t.status === "free");

    return {
      filteredTables:
        tableStatus === "all"
          ? tables
          : tableStatus === "occupied"
            ? occupied
            : free,
      counts: {
        all: tables.length,
        occupied: occupied.length,
        free: free.length,
      } as Record<string, number>,
    };
  }, [tableStatus, tables]);

  const indoor = filteredTables.filter((t) => t.zone === "indoor");
  const outdoor = filteredTables.filter((t) => t.zone === "outdoor");

  return (
    <div className="space-y-6">
      <div>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const isActive = tableStatus === config.status;
          const count = counts[config.status] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTableStatus(config.status)}
              className={`inline-flex items-center gap-2 px-4 py-1.5 mr-2 rounded-full border text-xs font-medium transition-all duration-200 ${
                isActive
                  ? ""
                  : `bg-white border-gray-200 text-gray-700 hover:bg-violet-50 hover:${config.border} hover:${config.textColor}`
              }`}
              style={
                isActive
                  ? {
                      color: "white",
                      backgroundColor: `${config.hex}`, // 8-digit hex = ~10% alpha
                      borderColor: config.hex,
                    }
                  : undefined
              }
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? "white" : config.hex }}
              />
              {config.label}
              <span
                className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold  bg-gray-300/40 ${
                  isActive ? "text-white" : ""
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Indoor */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Indoor · {indoor.length} tables
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {indoor.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              isSelected={selectedTableId === t.id}
              onClick={() => onSelectTable(t)}
              onEdit={onEditTable}
              onDelete={setDeleteTarget}
              onChangeTable={handleOpenChangeTable}
            />
          ))}
        </div>
      </div>

      {/* Outdoor */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Outdoor · {outdoor.length} tables
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {outdoor.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              isSelected={selectedTableId === t.id}
              onClick={() => onSelectTable(t)}
              onEdit={onEditTable}
              onDelete={setDeleteTarget}
              onChangeTable={handleOpenChangeTable}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteTableModal
        table={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={onTableDeleted}
      />

      {/* Change table modal */}
      <ChangeTableModal
        key={changeModalKey}
        open={!!changeTarget}
        currentTable={changeTarget}
        allTables={tables}
        onClose={() => setChangeTarget(null)}
        onChanged={onTableChanged}
      />
    </div>
  );
}
