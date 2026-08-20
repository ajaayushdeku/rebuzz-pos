"use client";

import { useState } from "react";
import { Search, Shapes, Tag } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import toast from "react-hot-toast";
import type { Category } from "@/lib/types/category";
import CategoryTable from "@/components/settingsComponents/categories/CategoryTable";
import EditCategoryModal from "@/components/settingsComponents/categories/EditCategoryModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

type CategoryForm = {
  name: string;
  color: string;
};

export default function CategorySettingsPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { mutate: createCategory, isPending: creating } = useCreateCategory();
  const { mutate: updateCategory, isPending: updating } = useUpdateCategory();
  const { mutate: deleteCategory, isPending: deleting } = useDeleteCategory();
  const [search, setSearch] = useState("");

  // Edit/Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    color: "#60A5FA",
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", color: "#60A5FA" });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c);
    setForm({ name: c.name, color: c.color });
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    const target = categories.find((c: Category) => c._id === id);
    if (!target) return;
    setDeleteTargetId(id);
    setDeleteTargetName(target.name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    deleteCategory(deleteTargetId, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setDeleteTargetId(null);
        setDeleteTargetName("");
      },
      onError: () => toast.error("Failed to delete category"),
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.color.trim()) return;

    // Strip "#" prefix before sending to API
    const cleanColor = form.color.replace(/^#/, "");

    if (editTarget) {
      updateCategory(
        { _id: editTarget._id, name: form.name, color: cleanColor },
        {
          onSuccess: () => {
            setModalOpen(false);
          },
          onError: () => toast.error("Failed to update category"),
        },
      );
    } else {
      createCategory(
        { name: form.name, color: cleanColor },
        {
          onSuccess: () => {
            setModalOpen(false);
          },
          onError: () => toast.error("Failed to create category"),
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Category Settings
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {categories.length} categories configured
            </p>
          </div>
          <HeaderActionButton
            variant="dashed"
            icon={Tag}
            hideLabelOnMobile
            label="New Category"
            onClick={openCreate}
          />
        </div>

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative mt-6">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Category Table */}
        <div className="bg-white rounded-xl p-5">
          <CategoryTable
            categories={categories}
            search={search}
            onEdit={openEdit}
            onDelete={openDelete}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Create/Edit modal */}
      <EditCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editTarget={editTarget}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={creating || updating}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteModalOpen(false);
            setDeleteTargetId(null);
            setDeleteTargetName("");
          }
        }}
        icon={Shapes}
        title="Delete category?"
        description={
          deleteTargetName
            ? `“${deleteTargetName}” will be permanently removed.`
            : "This category will be permanently removed."
        }
        warning="This action cannot be undone."
        onConfirm={confirmDelete}
        isPending={deleting}
      />
    </div>
  );
}
