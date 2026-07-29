"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { getPurposeColor, useTracker } from "@/providers/ExpenseContext";
import type { PurposeItem } from "@/services/apiExpense.client";
import { getPurposeIcon, ICON_PICKER_OPTIONS } from "@/lib/purpose-icons";

type AppliesTo = "expense" | "income" | "both";

const APPLIES_TO_LABEL: Record<AppliesTo, string> = {
  expense: "Expense only",
  income: "Income only",
  both: "Expense & Income",
};

const APPLIES_TO_BADGE: Record<AppliesTo, string> = {
  expense: "bg-red-50 text-red-600",
  income: "bg-green-50 text-green-600",
  both: "bg-blue-50 text-blue-600",
};

export default function ManagePurposesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  // `type` is kept for backward compatibility but no longer filters the list
  type?: "expense" | "income";
}) {
  const {
    allPurposes,
    isPurposesLoading,
    addPurpose,
    updatePurpose,
    deletePurpose,
  } = useTracker();

  // Create-purpose modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAppliesTo, setNewAppliesTo] = useState<AppliesTo>("expense");
  const [newIcon, setNewIcon] = useState<string>("public");
  const [creating, setCreating] = useState(false);

  // Edit-purpose modal state
  const [editTarget, setEditTarget] = useState<PurposeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editAppliesTo, setEditAppliesTo] = useState<AppliesTo>("expense");
  const [editIcon, setEditIcon] = useState<string>("public");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete-purpose confirmation state
  const [deleteTarget, setDeleteTarget] = useState<PurposeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetCreate = () => {
    setNewName("");
    setNewAppliesTo("expense");
    setNewIcon("public");
  };

  const openCreate = () => {
    resetCreate();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (
      allPurposes.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error("Purpose already exists");
      return;
    }
    setCreating(true);
    try {
      await addPurpose(trimmed, newAppliesTo, newIcon);
      toast.success("Purpose created");
      setCreateOpen(false);
      resetCreate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add purpose");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (p: PurposeItem) => {
    setEditTarget(p);
    setEditName(p.name);
    setEditAppliesTo(p.appliesTo);
    setEditIcon(p.icon || "public");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (
      allPurposes.some(
        (p) =>
          p._id !== editTarget._id &&
          p.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("Another purpose already has this name");
      return;
    }
    setSavingEdit(true);
    try {
      await updatePurpose(editTarget._id, {
        name: trimmed,
        appliesTo: editAppliesTo,
        icon: editIcon,
      });
      toast.success("Purpose updated");
      setEditTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update purpose",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePurpose(deleteTarget._id);
      toast.success("Purpose deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete purpose",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ── Main manage modal ── */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Manage Purposes
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              All purposes are shown. Each purpose can be used for expense,
              income, or both.
            </DialogDescription>
          </DialogHeader>

          {/* Add new */}
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus size={14} /> Add new purpose
          </button>

          {/* List */}
          {isPurposesLoading ? (
            <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {allPurposes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No purposes yet. Click “Add new purpose” to create one.
                </p>
              ) : (
                allPurposes.map((p) => {
                  const Icon = getPurposeIcon(p.icon, p.name);
                  const iconColor = getPurposeColor(p.icon, p.name);
                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: iconColor + "20" }}
                        >
                          <Icon size={14} style={{ color: iconColor }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800 truncate">
                              {p.name}
                            </span>
                            {p.isDefault && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
                                default
                              </span>
                            )}
                          </div>
                          <span
                            className={`mt-1 inline-block text-[10px] font-medium rounded-full px-2 py-0.5 ${APPLIES_TO_BADGE[p.appliesTo]}`}
                          >
                            {APPLIES_TO_LABEL[p.appliesTo]}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit purpose"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete purpose"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create purpose modal ── */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o && !creating) setCreateOpen(false);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={!creating}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              New purpose
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a purpose and choose where it applies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Rent, Utilities..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Applies to
              </label>
              <Select
                value={newAppliesTo}
                onValueChange={(v) => setNewAppliesTo(v as AppliesTo)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense only</SelectItem>
                  <SelectItem value="income">Income only</SelectItem>
                  <SelectItem value="both">Expense & Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 border border-gray-200 rounded-lg">
                {ICON_PICKER_OPTIONS.map(({ key, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewIcon(key)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      newIcon === key
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title={key}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit purpose modal ── */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(o) => {
          if (!o && !savingEdit) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={!savingEdit}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Edit purpose
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update the name or where this purpose applies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Applies to
              </label>
              <Select
                value={editAppliesTo}
                onValueChange={(v) => setEditAppliesTo(v as AppliesTo)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense only</SelectItem>
                  <SelectItem value="income">Income only</SelectItem>
                  <SelectItem value="both">Expense & Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-1 border border-gray-200 rounded-lg">
                {ICON_PICKER_OPTIONS.map(({ key, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditIcon(key)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      editIcon === key
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title={key}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={savingEdit || !editName.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {savingEdit ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation modal ── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={!deleting}>
          <DialogHeader>
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-base font-semibold text-center text-gray-900">
              Delete purpose?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500">
              {deleteTarget
                ? `“${deleteTarget.name}” will be permanently removed. Existing transactions using this purpose won’t be affected.`
                : "This purpose will be permanently removed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 sm:flex-none bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
