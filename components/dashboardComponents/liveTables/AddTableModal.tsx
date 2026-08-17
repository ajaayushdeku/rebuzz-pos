"use client";

import { useState } from "react";
import { Loader2, Plus, Armchair, Sun, Save, Table2 } from "lucide-react";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    <ModalShell
      open={open}
      onClose={onClose}
      busy={submitting}
      title={isEdit ? "Edit table" : "Add table"}
      subtitle={
        isEdit
          ? "Update this table's name, seating and zone"
          : "Add a table to the floor plan"
      }
      icon={Table2}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={modalGhostButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={submitting}
            className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEdit ? "Save changes" : "Create table"}
              </>
            )}
          </button>
        </div>
      }
    >
      {/* Still a <form> so Enter submits, as it did before. */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <SectionLabel>Table name / number</SectionLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Table 12, Window 1"
            className={`mt-2 ${modalInput} ${modalInputIdle}`}
          />
        </div>

        <div>
          <SectionLabel>Seats</SectionLabel>
          <input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            placeholder="e.g. 4"
            className={`mt-2 ${modalInput} ${modalInputIdle} tabular-nums`}
          />
        </div>

        <div>
          <SectionLabel>Zone</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={zone === "indoor"}
              onClick={() => handleZoneSelect("indoor")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                zone === "indoor"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Armchair
                size={16}
                strokeWidth={1.8}
                className={zone === "indoor" ? "text-blue-600" : "text-gray-400"}
              />
              Indoor
            </button>
            <button
              type="button"
              aria-pressed={zone === "outdoor"}
              onClick={() => handleZoneSelect("outdoor")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                zone === "outdoor"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Sun
                size={16}
                strokeWidth={1.8}
                className={
                  zone === "outdoor" ? "text-orange-500" : "text-gray-400"
                }
              />
              Outdoor
            </button>
          </div>
        </div>

        <div>
          <SectionLabel>Note</SectionLabel>
          {/* Two stacked layers: a styled read-only display showing the zone
              prefix dimmed, and a transparent textarea capturing input. */}
          <div className="relative mt-2">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-3.5 py-2.5 text-[13px]"
            >
              {zone && <span className="text-gray-300">{zonePrefix}</span>}
              <span className="text-gray-900">
                {restOfNote ? ` ${restOfNote}` : ""}
              </span>
            </div>
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
              className="relative w-full resize-none rounded-xl border border-gray-200 bg-transparent px-3.5 py-2.5 text-[13px] text-transparent caret-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-medium text-red-500">{error}</p>
        )}
      </form>
    </ModalShell>
  );
}
