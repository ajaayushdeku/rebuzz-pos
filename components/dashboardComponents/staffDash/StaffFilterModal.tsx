import { Users, X, Check } from "lucide-react";
import { MAX_STAFF } from "./StaffOrdersChart";
import { useState } from "react";

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

  if (!open) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 "
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Filter Employee
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Select 1 – {MAX_STAFF} employees to compare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Selection controls ────────────────────────────── */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {draft.length}
            </span>
            <span className="text-sm text-gray-400">
              / {MAX_STAFF} selected
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setError("");
                setDraft(allStaff.slice(0, MAX_STAFF));
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Select top {Math.min(MAX_STAFF, allStaff.length)}
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => {
                if (draft.length <= 1) {
                  setError("Select at least 1 staff member.");
                  return;
                }
                setError("");
                setDraft([]);
              }}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* ── Progress bar ──────────────────────────────────── */}
        <div className="px-6 pb-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(draft.length / MAX_STAFF) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Staff list ────────────────────────────────────── */}
        <div className="px-4 max-h-72 overflow-y-auto space-y-1">
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? "bg-blue-50 border border-blue-200"
                    : isDisabled
                      ? "bg-gray-50 border border-transparent opacity-40 cursor-not-allowed"
                      : "border border-transparent hover:bg-gray-50 hover:border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? "ring-2 ring-offset-1" : ""}`}
                    style={{
                      backgroundColor: color,
                      ...(isSelected
                        ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${color}40` }
                        : {}),
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {name}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Error message ─────────────────────────────────── */}
        {error && (
          <div className="px-6 pt-3">
            <p className="text-xs font-medium text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="px-6 py-5 mt-2 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={draft.length === 0}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Apply Selection ({draft.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffFilterModal;
