"use client";

import { useState } from "react";
import { Trophy, Check, Plus } from "lucide-react";
import ModalShell, {
  modalInput,
  modalInputIdle,
  modalInputError,
  modalGhostButton,
} from "@/components/ui/ModalShell";
import { type LoyaltyStatus, STATUS_COLORS } from "./loyaltyStatusConfig";
import TierBadge from "./TierBadge";

export interface LoyaltyStatusDraft {
  name: string;
  minPoints: number;
}

/**
 * Add / edit a loyalty tier. One modal serves both — `editing` decides the
 * copy, the seeded values and the confirm label, so the two flows cannot
 * drift apart the way a separate add form and edit form would.
 */
export default function LoyaltyStatusModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** The tier being edited, or null to add a new one. */
  editing: LoyaltyStatus | null;
  onClose: () => void;
  onSubmit: (draft: LoyaltyStatusDraft) => void;
}) {
  const isEdit = !!editing;

  const [name, setName] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    minPoints?: string;
  }>({});

  /**
   * Seed from `editing` the first time this render pass sees a new target.
   * Deriving during render rather than syncing in an effect keeps the fields
   * correct on the very first paint — an effect would flash the previous
   * tier's values for a frame.
   */
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const seedKey = open ? (editing?.id ?? "new") : null;
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    setName(editing?.name ?? "");
    setMinPoints(editing ? String(editing.minPoints) : "");
    setErrors({});
  }

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Status name is required";
    if (!minPoints || isNaN(Number(minPoints)) || Number(minPoints) < 0) {
      next.minPoints = "Enter a valid minimum points (0 or more)";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ name: name.trim(), minPoints: Number(minPoints) });
  };

  // The badge's icon and colour are derived from the name, so the preview
  // shows the result while typing rather than after the row is added. While
  // editing it keeps the tier's existing colour, since renaming does not
  // reassign one.
  const named = STATUS_COLORS[name.trim().toLowerCase()];
  const previewColor = editing?.color ?? named?.color ?? "text-blue-700";
  const previewBg = editing?.bgColor ?? named?.bg ?? "bg-blue-100";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Loyalty Tier" : "Add Loyalty Tier"}
      subtitle={
        isEdit
          ? "Update this tier's name or point threshold"
          : "Name the tier and set the points needed to reach it"
      }
      icon={Trophy}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onClose} className={modalGhostButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {isEdit ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "Update Tier" : "Add Tier"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400">
            Status Name
          </label>
          <input
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="e.g. Platinum"
            className={`${modalInput} ${
              errors.name ? modalInputError : modalInputIdle
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400">
            Minimum Points Required
          </label>
          <input
            type="number"
            min={0}
            value={minPoints}
            onChange={(e) => {
              setMinPoints(e.target.value);
              if (errors.minPoints)
                setErrors((p) => ({ ...p, minPoints: undefined }));
            }}
            placeholder="e.g. 10000"
            className={`${modalInput} tabular-nums ${
              errors.minPoints ? modalInputError : modalInputIdle
            }`}
          />
          {errors.minPoints && (
            <p className="mt-1 text-xs text-red-500">{errors.minPoints}</p>
          )}
        </div>

        {name.trim() && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-3.5 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Preview
            </p>
            <div className="flex items-center gap-2">
              <TierBadge
                name={name.trim()}
                color={previewColor}
                bgColor={previewBg}
              />
              <span className="text-xs tabular-nums text-gray-400">
                from {Number(minPoints || 0).toLocaleString()} pts
              </span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
