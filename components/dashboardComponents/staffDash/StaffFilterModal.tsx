"use client";

import { Check, Users } from "lucide-react";
import { MAX_STAFF } from "./StaffSalesChart";
import { useState } from "react";
import ModalShell, {
  SectionLabel,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";

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
    <ModalShell
      open={open}
      onClose={onClose}
      title="Filter employees"
      subtitle={`Select 1 – ${MAX_STAFF} employees to compare`}
      icon={Users}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-50"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onClose} className={modalGhostButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={draft.length === 0}
            className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
          >
            <Check className="h-4 w-4" />
            Apply selection ({draft.length})
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Selection summary ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {draft.length}
              </span>
              <span className="text-[11px] text-gray-400 tabular-nums">
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
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
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
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(draft.length / MAX_STAFF) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Error message ── */}
        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-500">
            {error}
          </p>
        )}

        {/* ── Staff list ── */}
        <div>
          <SectionLabel>Employees</SectionLabel>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/60"
                      : isDisabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-40"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: color,
                        ...(isSelected
                          ? {
                              boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}40`,
                            }
                          : {}),
                      }}
                    />
                    <span
                      className={`truncate text-[13px] font-medium ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {name}
                    </span>
                  </div>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default StaffFilterModal;
