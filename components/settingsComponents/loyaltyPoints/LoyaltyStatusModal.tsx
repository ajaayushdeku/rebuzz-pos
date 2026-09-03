"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Trophy,
  Check,
  Info,
  Loader2,
  Plus,
} from "lucide-react";
import ModalShell, {
  modalInput,
  modalInputError,
  modalGhostButton,
} from "@/components/ui/ModalShell";
import {
  FALLBACK_TIER_STYLE,
  type LoyaltyStatus,
  STATUS_COLORS,
} from "./loyaltyStatusConfig";
import TierBadge from "./TierBadge";
import { formatNumber } from "@/utils/helper";
import { useCurrency } from "@/providers/CurrencyContext";

/**
 * The idle field, in this modal's cyan rather than the shared blue.
 *
 * Local rather than a second export from ModalShell: this is one screen's
 * accent, and two conflicting `focus:ring-*` utilities on the same element
 * would resolve by stylesheet order rather than by which was written last.
 */
const cyanInputIdle =
  "border-gray-200 focus:border-cyan-400 focus:ring-cyan-500/20";

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
  isSaving = false,
  missingZeroFloor = null,
  tiers = [],
}: {
  open: boolean;
  /** The tier being edited, or null to add a new one. */
  editing: LoyaltyStatus | null;
  onClose: () => void;
  onSubmit: (draft: LoyaltyStatusDraft) => void;
  /** True while the tier is being written to the API. */
  isSaving?: boolean;
  /**
   * The ladder as it stands, so this form can refuse a threshold another tier
   * already owns. Two rungs at the same height are not a ladder: the banding
   * would have to pick one of them arbitrarily.
   */
  tiers?: LoyaltyStatus[];
  /**
   * The ladder's lowest threshold, when it is above 0 — so the form can say
   * what that leaves uncovered while a minimum is being chosen. Null when the
   * ladder already starts at 0, or has no rungs yet.
   */
  missingZeroFloor?: number | null;
}) {
  const { currency } = useCurrency();
  const isEdit = !!editing;

  const [name, setName] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    minPoints?: string;
  }>({});

  /**
   * The gap hint, hidden once this form would close it.
   *
   * Repeating "no tier starts at 0" while the user is typing 0 into the very
   * field that fixes it would be nagging rather than informing.
   */
  const showZeroHint =
    missingZeroFloor !== null &&
    !(minPoints.trim() !== "" && Number(minPoints) === 0);

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

  /**
   * The tier already sitting on the typed threshold, if any.
   *
   * Excludes the one being edited — saving Gold at its own 750 is not a
   * clash. Found as the field is typed rather than on submit, so the answer
   * arrives while the number is still being chosen.
   */
  const clash =
    minPoints.trim() === "" || isNaN(Number(minPoints))
      ? undefined
      : tiers.find(
          (t) => t.id !== editing?.id && t.minPoints === Number(minPoints),
        );

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Status name is required";
    if (!minPoints || isNaN(Number(minPoints)) || Number(minPoints) < 0) {
      next.minPoints = "Enter a valid minimum points (0 or more)";
    } else if (clash) {
      next.minPoints = `${clash.name} already starts at ${clash.minPoints.toLocaleString()} points`;
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
  const previewColor =
    editing?.color ?? named?.color ?? FALLBACK_TIER_STYLE.color;
  const previewBg = editing?.bgColor ?? named?.bg ?? FALLBACK_TIER_STYLE.bg;

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
      iconColor="text-cyan-600"
      iconBgColor="bg-cyan-50"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`${modalGhostButton} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            // Blocked outright rather than left to fail on submit: the reason
            // is already on screen beside the field that caused it.
            disabled={isSaving || !!clash}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEdit ? "Update Tier" : "Add Tier"}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {showZeroHint && (
          <div className="flex items-center  gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <Info className=" h-4.5 w-4.5 shrink-0 text-amber-600" />
            <p className="text-[12px] leading-relaxed text-amber-800">
              Your lowest tier starts at{" "}
              <span className="font-semibold">
                {missingZeroFloor.toLocaleString()}
              </span>{" "}
              points. Use a minimum of <span className="font-semibold">0</span>{" "}
              here to band customers below that — otherwise they stay on{" "}
              <strong>No tier</strong>.
            </p>
          </div>
        )}

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
              errors.name ? modalInputError : cyanInputIdle
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
              errors.minPoints || clash ? modalInputError : cyanInputIdle
            }`}
          />
          {errors.minPoints ? (
            <p className="mt-1 text-xs text-red-500">{errors.minPoints}</p>
          ) : (
            clash && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-semibold">{clash.name}</span> already
                  starts at {clash.minPoints.toLocaleString()} points. Pick a
                  different threshold.
                </span>
              </p>
            )
          )}
        </div>

        {name.trim() && (
          <div className="rounded-xl border border-dashed border-cyan-200 bg-cyan-50/50 px-3.5 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
              Preview
            </p>
            <div className="flex items-center gap-2">
              <TierBadge
                name={name.trim()}
                color={previewColor}
                bgColor={previewBg}
              />
              <span className="text-xs tabular-nums text-gray-600">
                from {formatNumber(Number(minPoints) || 0, currency.locale)} pts
              </span>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
