"use client";

import { Check } from "lucide-react";
import { MAX_STAFF } from "./StaffSalesChart";
import { useState } from "react";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
} from "@/components/settingsComponents/SettingsModalShell";

const StaffFilterModal = ({
  open,
  onClose,
  allStaff,
  selected,
  colorMap,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  allStaff: string[];
  selected: string[];
  colorMap: Map<string, string>;
  onApply: (names: string[]) => void;
}) => {
  const [draft, setDraft] = useState<string[]>(selected);
  const [error, setError] = useState("");

  const toggle = (name: string) => {
    setError("");
    setDraft((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) {
          setError("Select at least 1 staff member.");
          return prev;
        }
        return prev.filter((n) => n !== name);
      }
      if (prev.length >= MAX_STAFF) {
        setError(`Maximum ${MAX_STAFF} staff members allowed.`);
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleApply = () => {
    if (draft.length === 0) {
      setError("Select at least 1 staff member.");
      return;
    }
    onApply(draft);
    onClose();
  };

  return (
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Filter Employee"
      description={`Select 1 – ${MAX_STAFF} employees to compare`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={draft.length === 0}
            className={modalPrimaryBtn}
          >
            Apply Selection ({draft.length})
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ── Selection summary ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-gray-800">
                {draft.length}
              </span>
              <span className="text-xs text-gray-400">
                / {MAX_STAFF} selected
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setDraft(allStaff.slice(0, MAX_STAFF));
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Select top {Math.min(MAX_STAFF, allStaff.length)}
              </button>
              <span className="text-gray-200">|</span>
              <button
                type="button"
                onClick={() => {
                  if (draft.length <= 1) {
                    setError("Select at least 1 staff member.");
                    return;
                  }
                  setError("");
                  setDraft([]);
                }}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(draft.length / MAX_STAFF) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Error message ── */}
        {error && (
          <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ── Staff list ── */}
        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {allStaff.map((name) => {
            const isSelected = draft.includes(name);
            const color = colorMap.get(name) ?? "#6b7280";
            const isDisabled = !isSelected && draft.length >= MAX_STAFF;

            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-200"
                    : isDisabled
                      ? "bg-gray-50 border-transparent opacity-40 cursor-not-allowed"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: color,
                      ...(isSelected
                        ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}40` }
                        : {}),
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {name}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SettingsModalShell>
  );
};

export default StaffFilterModal;
