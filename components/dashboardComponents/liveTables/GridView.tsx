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
  Eye,
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
    textColor: "text-slate-600 dark:text-[#a9b4c7]",
    border: "border-slate-500",
    iconColor: "text-slate-600 dark:text-[#a9b4c7]",
    status: "all",
  },
  occupied: {
    label: "Occupied",
    hex: "#2563eb", // blue-600
    textColor: "text-blue-600 dark:text-[#7ba2e3]",
    border: "border-blue-500",
    iconColor: "text-blue-600 dark:text-[#7ba2e3]",
    status: "occupied",
  },
  free: {
    label: "Free",
    hex: "#16a34a", // green-600
    textColor: "text-green-600 dark:text-emerald-400",
    border: "border-gray-200 dark:border-white/15",
    iconColor: "text-green-600 dark:text-emerald-400",
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
  onViewDetails,
}: {
  table: LiveTable;
  isSelected: boolean;
  onClick: () => void;
  onEdit: (table: LiveTable) => void;
  onDelete: (table: LiveTable) => void;
  onChangeTable: (table: LiveTable) => void;
  onViewDetails: (table: LiveTable) => void;
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
      className={`group cursor-pointer rounded-2xl border bg-white px-3 pb-2 pt-3 transition-colors sm:px-5 sm:pt-4 dark:bg-[#161d2e] ${
        isSelected
          ? "border-blue-400 ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-[#0f1420]"
          : "border-[#e3e3e3] hover:border-[#dadce0] dark:border-white/10"
      }`}
    >
      {/* Header. At two cards to a phone's width the card is about 137px
          wide, and `px-5` left 97px of it — a 13px status label and two icon
          buttons did not fit, which is why the buttons used to stack into a
          vertical column below `sm`. Everything shrinks a step instead, and
          the status truncates rather than pushing the actions off. */}
      <div className="mb-3 flex items-start justify-between gap-1 sm:mb-4">
        <div
          className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${config.textColor}`}
        >
          <Armchair
            size={15}
            strokeWidth={2}
            className={`shrink-0 sm:size-[17px] ${config.iconColor}`}
          />

          <span className="truncate text-[11px] sm:text-[13px]">
            {config.label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* View details — stops propagation so it doesn't also select the
              card underneath. */}
          <button
            type="button"
            title="View table details"
            aria-label={`View details for ${table.name || `Table ${table.id}`}`}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(table);
            }}
            className="rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:text-[#7b869b] dark:hover:bg-white/10"
          >
            <Eye size={16} />
          </button>

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
                
                rounded-md
              "
            >
              <MoreVertical size={17} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-[#dadce0] bg-white py-1.5 shadow-lg dark:border-white/15 dark:bg-[#1b2436]"
                onClick={(e) => e.stopPropagation()}
              >
                {isOccupied ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onChangeTable(table);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-blue-600 transition-colors dark:text-[#7ba2e3]"
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
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-[#c3ccdc] dark:hover:bg-white/10"
                    >
                      <Pencil
                        size={14}
                        className="text-gray-400 dark:text-[#7b869b]"
                      />
                      Edit Table
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(table);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400"
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
      </div>

      {/* Table Name */}
      <h3 className="mb-3 text-lg font-semibold leading-none tracking-tight text-[#3c4043] sm:mb-5 sm:text-xl dark:text-[#e8ecf4]">
        {table.name || `Table ${table.id}`}
      </h3>

      {/* Seats */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#5f6368] sm:gap-2 sm:text-[13px] dark:text-[#a9b4c7]">
        <Users size={15} strokeWidth={1.8} className="shrink-0" />

        <span>
          {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
        </span>
      </div>

      {/* Bottom Information */}
      <div className="mt-3 min-h-[34px] border-t border-[#e8eaed] pt-2.5 sm:mt-4 sm:pt-3 dark:border-white/10">
        {isActive ? (
          /* Wraps: the bill and the seated time together need more than the
             97px this card has on a phone, and a truncated amount of money is
             worse than a second line. */
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            {/* Bill */}
            {bill != null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium tabular-nums text-[#1e8e3e] dark:text-[#10b981]">
                  {formatCurrencySymbol(bill, currency.symbol, currency.locale)}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Time */}
            {seatedMinutes != null && (
              <div className="flex items-center gap-1.5 text-xs tabular-nums text-[#9aa0a6] dark:text-[#9aa6bd]">
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
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl dark:bg-[#161d2e] border border-[#e3e3e3] bg-white shadow-xl dark:border-white/10">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:bg-red-400/10 dark:border-red-400/25">
              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-[15px] text-[#3c4043] dark:text-[#e8ecf4]">
              Delete table
            </h3>
          </div>
          <p className="mb-5 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
            Are you sure you want to delete{" "}
            <span className="text-[#3c4043] dark:text-[#e8ecf4]">
              {table.name || `Table ${table.id}`}
            </span>
            ? This action cannot be undone.
          </p>

          {error && (
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-100 dark:text-[#a9b4c7] dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
  onViewDetails: (table: LiveTable) => void;
}

export default function GridView({
  tables,
  selectedTableId,
  onSelectTable,
  onEditTable,
  onTableDeleted,
  onTableChanged,
  onViewDetails,
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
      {/* Status filter — the loose pills this page has always used: the
          selected one fills with its status colour. */}
      {/* `flex flex-wrap gap-2` rather than `mr-2` on each pill: the margin
          spaced them along a row but gave a wrapped row nothing above it, so on
          a phone the two lines of pills touched. */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const isActive = tableStatus === config.status;
          const count = counts[config.status] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTableStatus(config.status)}
              // `hover:${config.border}` and `hover:${config.textColor}` were
              // built by interpolation, which Tailwind cannot see at build
              // time, so neither class was ever generated. Worse, textColor is
              // two classes ("text-green-600 dark:text-emerald-400"): only the
              // first took the `hover:` prefix and the second landed bare,
              // repainting every inactive pill in dark mode. Static hover now.
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 ${
                isActive
                  ? ""
                  : "border-gray-200 bg-white text-gray-700 hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10"
              }`}
              style={
                isActive
                  ? {
                      color: "white",
                      backgroundColor: `${config.hex}`,
                      borderColor: config.hex,
                    }
                  : undefined
              }
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: isActive ? "white" : config.hex }}
              />
              {config.label}
              <span
                className={`inline-flex min-w-6 items-center justify-center rounded-full bg-gray-300/40 px-2 py-0.5 text-xs font-bold dark:bg-white/15 ${
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
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 dark:text-[#7b869b]">
          Indoor · {indoor.length} {indoor.length === 1 ? "table" : "tables"}
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
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>

      {/* Outdoor */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 dark:text-[#7b869b]">
          Outdoor · {outdoor.length} {outdoor.length === 1 ? "table" : "tables"}
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
              onViewDetails={onViewDetails}
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
