"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  ArrowRightLeft,
  Check,
  Armchair,
  Search,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalGhostButton,
} from "@/components/ui/ModalShell";

interface ChangeTableModalProps {
  open: boolean;
  /** The occupied table whose ticket is being moved. */
  currentTable: LiveTable | null;
  /** All tables (used to derive the free/available list). */
  allTables: LiveTable[];
  onClose: () => void;
  onChanged: () => void;
}

const tableLabel = (table: LiveTable) => table.name || `Table ${table.id}`;

export default function ChangeTableModal({
  open,
  currentTable,
  allTables,
  onClose,
  onChanged,
}: ChangeTableModalProps) {
  const [selectedTable, setSelectedTable] = useState<LiveTable | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /**
   * Every dismissal path runs this. The component stays mounted when `open` is
   * false, so its state used to survive a close: `submitting` was never
   * cleared after a successful change, which left the confirm button
   * permanently disabled the next time the modal opened, and the previously
   * chosen table stayed selected.
   */
  const resetAndClose = () => {
    setSelectedTable(null);
    setSubmitting(false);
    setError(null);
    setSearch("");
    onClose();
  };

  // Only FREE tables are eligible for a change.
  const freeTables = useMemo(
    () =>
      allTables.filter(
        (t) => t.status === "free" && t._id !== currentTable?._id,
      ),
    [allTables, currentTable?._id],
  );

  const visibleTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return freeTables;
    return freeTables.filter((t) =>
      tableLabel(t).toLowerCase().includes(query),
    );
  }, [freeTables, search]);

  if (!open || !currentTable) return null;

  const ticketNumber = currentTable.currentTicket?.invoice;

  const handleConfirm = async () => {
    if (!selectedTable) {
      setError("Please select a table to move the ticket to.");
      return;
    }
    if (ticketNumber == null) {
      setError("This table has no active ticket to move.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketNumber}/change-table`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: selectedTable.name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to change table.");
        setSubmitting(false);
        return;
      }

      onChanged();
      resetAndClose();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={resetAndClose}
      busy={submitting}
      title="Change Table"
      subtitle={`Move this ticket to another free table`}
      icon={ArrowRightLeft}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            className={modalGhostButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !selectedTable}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Changing…
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} />
                Confirm Change
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* From → To. The destination was only visible as a tick buried in
            the list; showing both ends states what is about to happen. */}
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              From
            </p>
            <p className="mt-1 truncate text-sm font-bold text-gray-900">
              {tableLabel(currentTable)}
            </p>
            {ticketNumber != null && (
              <span className="mt-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-blue-700">
                Ticket #{ticketNumber}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            <ArrowRight size={16} className="text-gray-300" />
          </div>

          <div
            className={`min-w-0 flex-1 rounded-xl border px-3.5 py-3 transition-colors ${
              selectedTable
                ? "border-blue-200 bg-blue-50"
                : "border-dashed border-gray-200 bg-white"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              To
            </p>
            <p
              className={`mt-1 truncate text-sm font-bold ${
                selectedTable ? "text-gray-900" : "text-gray-300"
              }`}
            >
              {selectedTable ? tableLabel(selectedTable) : "Not selected"}
            </p>
            {selectedTable && (
              <span className="mt-1.5 inline-block text-[11px] tabular-nums text-blue-600">
                {selectedTable.capacity}{" "}
                {selectedTable.capacity === 1 ? "seat" : "seats"}
              </span>
            )}
          </div>
        </div>

        {/* Free tables */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionLabel>Select a free table</SectionLabel>
            <span className="text-[11px] font-medium tabular-nums text-gray-400">
              {freeTables.length} available
            </span>
          </div>

          {/* Search appears only when the list is long enough to need it. */}
          {freeTables.length > 6 && (
            <div className="relative mb-2">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables..."
                className={`${modalInput} ${modalInputIdle} pl-9`}
              />
            </div>
          )}

          {freeTables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
              <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Armchair size={20} className="text-gray-400" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">
                No free tables right now
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Every other table is occupied or reserved.
              </p>
            </div>
          ) : visibleTables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-gray-500">
                No table matches “{search.trim()}”
              </p>
            </div>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {visibleTables.map((t) => {
                const isSelected = selectedTable?._id === t._id;
                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => {
                      setSelectedTable(t);
                      setError(null);
                    }}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Armchair
                        size={15}
                        className={`shrink-0 ${
                          isSelected ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span className="truncate font-medium">
                        {tableLabel(t)}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs tabular-nums text-gray-400">
                        {t.capacity} {t.capacity === 1 ? "seat" : "seats"}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                          <Check size={12} className="text-white" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-xs font-medium text-red-600">{error}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
