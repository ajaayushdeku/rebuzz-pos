"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
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
import DeleteConfirmModal from "@/components/settingsComponents/DeleteConfirmModal";
import { Button } from "@/components/ui/button";

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
      <div className="max-w-7xl mx-auto space-y-6">
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
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Category
          </Button>
        </div>

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Category Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CategoryTable
              categories={categories}
              search={search}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          )}
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
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteModalOpen(false);
            setDeleteTargetId(null);
            setDeleteTargetName("");
          }
        }}
        title="Delete Category"
        message={
          deleteTargetName
            ? `Delete "${deleteTargetName}"? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        isPending={deleting}
      />
    </div>
  );
}
