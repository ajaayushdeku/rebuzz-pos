"use client";

import { Loader2, Tag } from "lucide-react";
import type { Category } from "@/lib/types/category";
import { normalizeColor } from "@/services/category.client";
import ModalShell from "@/components/ui/ModalShell";

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

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      title={editTarget ? "Edit Category" : "Create New Category"}
      subtitle="Name your category and pick a colour to identify it"
      icon={Tag}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || !form.name.trim() || !form.color.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Details ── */}
        <div>
          <div className="mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How this category appears across the app
            </p>
          </div>

          <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
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
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Colour
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
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
              <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5">
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
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
              Preview
            </h3>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-3 shadow-sm">
            <span
              className="w-9 h-9 rounded-lg border border-gray-200 shrink-0"
              style={{ backgroundColor: normalizeColor(form.color) }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-slate-700">
                {form.name || "Category Name"}
              </p>
              <p className="text-[11px] text-gray-400 tracking-[0.1em]  font-mono">
                {normalizeColor(form.color)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default EditCategoryModal;
