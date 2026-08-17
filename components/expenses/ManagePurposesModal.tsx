"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Tags } from "lucide-react";
import ModalShell, {
  SectionLabel,
  modalInput,
  modalInputIdle,
  modalSelectTrigger,
  modalSelectTriggerIdle,
  modalGhostButton,
  modalPrimaryButton,
} from "@/components/ui/ModalShell";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
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

/**
 * Name / applies-to / icon — identical in the create and edit modals, so they
 * share one definition. Previously the two were copy-pasted and had already
 * started to diverge (only create set a placeholder).
 */
function PurposeFields({
  name,
  onNameChange,
  onSubmit,
  appliesTo,
  onAppliesToChange,
  icon,
  onIconChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  /** Enter in the name field commits, matching the old behaviour. */
  onSubmit: () => void;
  appliesTo: AppliesTo;
  onAppliesToChange: (v: AppliesTo) => void;
  icon: string;
  onIconChange: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Name</SectionLabel>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="e.g. Rent, Utilities..."
          className={`mt-2 ${modalInput} ${modalInputIdle}`}
          autoFocus
        />
      </div>

      <div>
        <SectionLabel>Applies to</SectionLabel>
        <Select
          value={appliesTo}
          onValueChange={(v) => onAppliesToChange(v as AppliesTo)}
        >
          <SelectTrigger
            className={`mt-2 ${modalSelectTrigger} ${modalSelectTriggerIdle}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {(Object.keys(APPLIES_TO_LABEL) as AppliesTo[]).map((key) => (
              <SelectItem key={key} value={key}>
                <span className="text-[13px]">{APPLIES_TO_LABEL[key]}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <SectionLabel>Icon</SectionLabel>
        <div className="mt-2 grid max-h-36 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl border border-gray-200 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ICON_PICKER_OPTIONS.map(({ key, Icon }) => {
            const active = icon === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onIconChange(key)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                title={key}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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

  // ModalShell listens for Escape on the document, so a stacked child modal
  // would otherwise close this one too. `busy` suppresses Escape and backdrop
  // dismissal, which is exactly the guard needed while a child is open.
  const hasChildModal =
    createOpen || editTarget !== null || deleteTarget !== null;

  return (
    <>
      {/* ── Main manage modal ── */}
      <ModalShell
        open={open}
        onClose={onClose}
        busy={hasChildModal}
        title="Manage purposes"
        subtitle="Each purpose can be used for expense, income, or both"
        icon={Tags}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={openCreate}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-3 text-[13px] font-semibold text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus size={14} /> Add new purpose
          </button>

          {isPurposesLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-gray-400">
              <Loader2 size={15} className="animate-spin" />
              Loading purposes
            </div>
          ) : allPurposes.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-gray-400">
              No purposes yet. Use “Add new purpose” to create one.
            </p>
          ) : (
            <div className="space-y-1.5">
              {allPurposes.map((p) => {
                const Icon = getPurposeIcon(p.icon, p.name);
                const iconColor = getPurposeColor(p.icon, p.name);
                return (
                  <div
                    key={p._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 transition hover:border-gray-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: iconColor + "20" }}
                      >
                        <Icon size={15} style={{ color: iconColor }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-medium leading-tight text-gray-900">
                            {p.name}
                          </p>
                          {p.isDefault && (
                            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                              default
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${APPLIES_TO_BADGE[p.appliesTo]}`}
                        >
                          {APPLIES_TO_LABEL[p.appliesTo]}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Edit purpose"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete purpose"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalShell>

      {/* ── Create purpose ── */}
      <ModalShell
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        busy={creating}
        title="New purpose"
        subtitle="Add a purpose and choose where it applies"
        icon={Plus}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
              className={modalGhostButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create purpose"
              )}
            </button>
          </div>
        }
      >
        <PurposeFields
          name={newName}
          onNameChange={setNewName}
          onSubmit={handleCreate}
          appliesTo={newAppliesTo}
          onAppliesToChange={setNewAppliesTo}
          icon={newIcon}
          onIconChange={setNewIcon}
        />
      </ModalShell>

      {/* ── Edit purpose ── */}
      <ModalShell
        open={editTarget !== null}
        onClose={() => !savingEdit && setEditTarget(null)}
        busy={savingEdit}
        title="Edit purpose"
        subtitle="Update the name or where this purpose applies"
        icon={Pencil}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              disabled={savingEdit}
              className={modalGhostButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={savingEdit || !editName.trim()}
              className={`${modalPrimaryButton} bg-blue-600 hover:bg-blue-700`}
            >
              {savingEdit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        }
      >
        <PurposeFields
          name={editName}
          onNameChange={setEditName}
          onSubmit={handleEdit}
          appliesTo={editAppliesTo}
          onAppliesToChange={setEditAppliesTo}
          icon={editIcon}
          onIconChange={setEditIcon}
        />
      </ModalShell>

      {/* ── Delete confirmation ── */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o && !deleting) setDeleteTarget(null);
        }}
        icon={Tags}
        title="Delete purpose?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed. Existing transactions using this purpose won’t be affected.`
            : "This purpose will be permanently removed."
        }
        onConfirm={handleDelete}
        isPending={deleting}
      />
    </>
  );
}
