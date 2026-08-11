"use client";

import { useState } from "react";
import { X, Loader2, ArrowRightLeft, Check, Armchair } from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";

interface ChangeTableModalProps {
  open: boolean;
  /** The occupied table whose ticket is being moved. */
  currentTable: LiveTable | null;
  /** All tables (used to derive the free/available list). */
  allTables: LiveTable[];
  onClose: () => void;
  onChanged: () => void;
}

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

  if (!open || !currentTable) return null;

  // Only FREE tables (status "free") are eligible for a change.
  const freeTables = allTables.filter(
    (t) => t.status === "free" && t._id !== currentTable._id,
  );

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

      setSelectedTable(null);
      onChanged();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 " onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Change Table
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Current table info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide mb-0.5">
              Moving ticket from
            </p>
            <p className="text-sm font-bold text-gray-900">
              {currentTable.name || `Table ${currentTable.id}`}
              {ticketNumber != null && (
                <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                  Ticket #{ticketNumber}
                </span>
              )}
            </p>
          </div>

          {/* Free tables list */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Select a free table
            </label>

            {freeTables.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No free tables available right now.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {freeTables.map((t) => {
                  const isSelected = selectedTable?._id === t._id;
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => {
                        setSelectedTable(t);
                        setError(null);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Armchair
                          size={15}
                          className={
                            isSelected ? "text-blue-500" : "text-gray-400"
                          }
                        />
                        <span className="font-medium">
                          {t.name || `Table ${t.id}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {t.capacity} {t.capacity === 1 ? "seat" : "seats"}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedTable}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRightLeft size={16} />
              )}
              {submitting ? "Changing…" : "Confirm Change"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
