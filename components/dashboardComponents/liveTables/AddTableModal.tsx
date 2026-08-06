"use client";

import { useState } from "react";
import { X, Loader2, Plus, Armchair, Sun, Save } from "lucide-react";
import type { LiveTable } from "@/lib/mockData/mock-live-tables";

type Zone = "indoor" | "outdoor";

interface AddTableModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** When provided, the modal runs in "edit" mode for this table. */
  editingTable?: LiveTable | null;
}

export default function AddTableModal({
  open,
  onClose,
  onCreated,
  editingTable = null,
}: AddTableModalProps) {
  const isEdit = !!editingTable;

  // Detect zone from existing notes (e.g. "Outdoor near garden").
  const initialZone: Zone | null = editingTable
    ? /^outdoor/i.test(editingTable.notes ?? "")
      ? "outdoor"
      : /^indoor/i.test(editingTable.notes ?? "")
        ? "indoor"
        : null
    : null;

  const [name, setName] = useState(editingTable?.name ?? "");
  const [seats, setSeats] = useState(
    editingTable ? String(editingTable.seats) : "",
  );
  const [note, setNote] = useState(
    editingTable?.notes ??
      ((initialZone ?? "indoor") === "indoor" ? "Indoor" : "Outdoor"),
  );
  const [zone, setZone] = useState<Zone | null>(initialZone ?? "indoor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const zonePrefix =
    zone === "indoor" ? "Indoor" : zone === "outdoor" ? "Outdoor" : "";
  const restOfNote = zone
    ? note.slice(zonePrefix.length).replace(/^\s+/, "")
    : note;

  const handleZoneSelect = (z: Zone) => {
    setZone(z);
    const label = z === "indoor" ? "Indoor" : "Outdoor";
    // Prepend the zone label to the note (unchangeable prefix).
    setNote((prev) => {
      const cleaned = prev
        .replace(/^(Indoor|Outdoor)\s*/i, "")
        .replace(/^\s+/, "");
      return `${label}${cleaned ? ` ${cleaned}` : ""}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Table name is required.");
      return;
    }
    const seatsNum = Number(seats);
    if (!seats || Number.isNaN(seatsNum) || seatsNum <= 0) {
      setError("Please enter a valid number of seats.");
      return;
    }

    setSubmitting(true);
    try {
      const url =
        isEdit && editingTable
          ? `/api/tables/${editingTable._id}`
          : "/api/tables";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          seats: seatsNum,
          notes: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.message ||
            (isEdit ? "Failed to update table." : "Failed to create table."),
        );
        setSubmitting(false);
        return;
      }

      // Reset form
      setName("");
      setSeats("");
      setNote("");
      setZone(null);
      onCreated();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Table" : "Add Table"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Table name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Table Name / Number
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table 12, Window 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Seats */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Seats
            </label>
            <input
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Zone selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Zone
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleZoneSelect("indoor")}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  zone === "indoor"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Armchair size={16} />
                Indoor
              </button>
              <button
                type="button"
                onClick={() => handleZoneSelect("outdoor")}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  zone === "outdoor"
                    ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Sun size={16} />
                Outdoor
              </button>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Note
            </label>
            <div className="relative">
              {/* Styled display layer (dimmed prefix + normal rest) */}
              <div
                aria-hidden
                className="absolute inset-0 px-3.5 py-2.5 text-sm pointer-events-none whitespace-pre-wrap break-words"
              >
                {zone && <span className="text-gray-300">{zonePrefix}</span>}
                <span className="text-gray-900">
                  {restOfNote ? ` ${restOfNote}` : ""}
                </span>
              </div>
              {/* Transparent textarea capturing input */}
              <textarea
                value={note}
                onChange={(e) => {
                  // Keep the zone prefix unchangeable.
                  if (zone) {
                    const prefix = zone === "indoor" ? "Indoor" : "Outdoor";
                    const rest = e.target.value.slice(prefix.length);
                    if (!e.target.value.startsWith(prefix)) return;
                    setNote(`${prefix}${rest.replace(/^\s+/, " ")}`);
                  } else {
                    setNote(e.target.value);
                  }
                }}
                placeholder={zone ? "" : "Add a note (optional)"}
                rows={3}
                className="relative w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-transparent caret-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all resize-none bg-transparent"
              />
            </div>
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
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEdit ? (
                <Save size={16} />
              ) : (
                <Plus size={16} />
              )}
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
