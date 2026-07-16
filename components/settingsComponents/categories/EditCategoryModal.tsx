"use client";

import { Loader2 } from "lucide-react";
import type { Category } from "@/lib/types/category";
import { normalizeColor } from "@/services/category.client";
import SettingsModalShell, {
  modalCancelBtn,
  modalPrimaryBtn,
  modalInputClass as inputClass,
} from "@/components/settingsComponents/SettingsModalShell";

const PRESET_COLORS = [
  "#F47003",
  "#60A5FA",
  "#A78BFA",
  "#EC4899",
  "#34D399",
  "#F59E0B",
  "#F87171",
  "#06B6D4",
  "#8B5CF6",
  "#867376",
  "#14B8A6",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#D946EF",
  "#FB923C",
];

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: Category | null;
  form: { name: string; color: string };
  onFormChange: (form: { name: string; color: string }) => void;
  onSave: () => void;
  isPending: boolean;
}

const EditCategoryModal = ({
  open,
  onOpenChange,
  editTarget,
  form,
  onFormChange,
  onSave,
  isPending,
}: EditCategoryModalProps) => {
  return (
    <SettingsModalShell
      open={open}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title={editTarget ? "Edit Category" : "Create New Category"}
      description="Name your category and pick a colour to identify it"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={modalCancelBtn}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !form.name.trim() || !form.color.trim()}
            className={modalPrimaryBtn}
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : editTarget ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Details ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Details</h3>
            <p className="text-xs text-gray-500">
              How this category appears across the app
            </p>
          </div>

          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Category Name
          </label>
          <input
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="e.g. Beverages"
            className={inputClass}
          />
        </div>

        {/* ── Colour ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Colour</h3>
            <p className="text-xs text-gray-500">
              Pick a preset or enter a custom hex value
            </p>
          </div>

          {/* Presets */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onFormChange({ ...form, color })}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    normalizeColor(form.color).toUpperCase() ===
                    normalizeColor(color).toUpperCase()
                      ? "border-gray-800 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Custom colour + hex */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Custom
              </label>
              <input
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#60A5FA"
                }
                onChange={(e) =>
                  onFormChange({ ...form, color: e.target.value })
                }
                className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 p-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Hex
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  #
                </span>
                <input
                  value={form.color.replace(/^#/, "")}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "");
                    onFormChange({ ...form, color: `#${raw.toUpperCase()}` });
                  }}
                  placeholder="F47003"
                  maxLength={6}
                  className={`${inputClass} pl-7 font-mono uppercase`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Preview</h3>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm">
            <span
              className="w-9 h-9 rounded-lg border border-gray-200 shrink-0"
              style={{ backgroundColor: normalizeColor(form.color) }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {form.name || "Category Name"}
              </p>
              <p className="text-[11px] text-gray-400 font-mono">
                {normalizeColor(form.color)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsModalShell>
  );
};

export default EditCategoryModal;
