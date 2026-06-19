"use client";

import { Loader2 } from "lucide-react";
import type { Category } from "@/lib/types/category";
import { normalizeColor } from "@/services/category.client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            {editTarget ? "Edit Category" : "Create New Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Name */}
          <div>
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

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Color
            </label>
            {/* Color swatches */}
            <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Drag color picker */}
            <div className="mb-3 flex items-center gap-3">
              <label className="text-xs font-medium text-gray-500 block min-w-[80px]">
                Custom Color:
              </label>

              <input
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#60A5FA"
                }
                onChange={(e) =>
                  onFormChange({ ...form, color: e.target.value })
                }
                className="h-10 flex-1 cursor-pointer p-1"
              />
            </div>

            {/* Hex input */}
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

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span
              className="w-8 h-8 rounded-lg border border-gray-200"
              style={{ backgroundColor: normalizeColor(form.color) }}
            />
            <div className="text-sm">
              <p className="font-medium text-gray-800">
                {form.name || "Category Name"}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {normalizeColor(form.color)}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-sm rounded-lg"
          >
            Cancel
          </Button>

          <Button
            onClick={onSave}
            disabled={isPending || !form.name.trim() || !form.color.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Saving...
              </>
            ) : editTarget ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
