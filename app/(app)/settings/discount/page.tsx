"use client";

import { useState } from "react";
import { Search, Plus, Percent, DollarSign } from "lucide-react";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "@/hooks/useDiscounts";
import toast from "react-hot-toast";
import DiscountTable from "@/components/settingsComponents/discounts/DiscountTable";
import EditDiscountModal from "@/components/settingsComponents/discounts/EditDiscountModal";
import DeleteConfirmModal from "@/components/settingsComponents/DeleteConfirmModal";
import { Button } from "@/components/ui/button";

export interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
  _docId?: string;
}

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

export default function DiscountSettingsPage() {
  const { data: discounts = [], isLoading } = useDiscounts();
  const { mutate: createDiscount, isPending: creating } = useCreateDiscount();
  const { mutate: updateDiscount, isPending: updating } = useUpdateDiscount();
  const { mutate: deleteDiscount, isPending: deleting } = useDeleteDiscount();
  const [search, setSearch] = useState("");

  // Edit/Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Discount | null>(null);
  const [form, setForm] = useState<DiscountForm>({
    name: "",
    type: "percentage",
    rate: 0,
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  const percentageDiscounts = discounts.filter(
    (d: Discount) => d.type === "percentage",
  );
  const fixedDiscounts = discounts.filter((d: Discount) => d.type === "fixed");

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", type: "percentage", rate: 0 });
    setModalOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditTarget(d);
    setForm({ name: d.name, type: d.type, rate: d.rate });
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    const target = discounts.find((d: Discount) => d._id === id);
    if (!target?._docId) {
      toast.error("Missing document reference");
      return;
    }
    setDeleteTarget(target);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget?._docId) return;
    deleteDiscount(
      { docId: deleteTarget._docId, discountId: deleteTarget._id },
      {
        onSuccess: () => {
          toast.success("Discount deleted");
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete discount"),
      },
    );
  };

  const handleSave = () => {
    if (!form.name.trim() || form.rate <= 0) return;

    if (editTarget) {
      if (!editTarget._docId) {
        toast.error("Missing document reference");
        return;
      }

      updateDiscount(
        {
          docId: editTarget._docId,
          discountId: editTarget._id,
          payload: { name: form.name, rate: form.rate, type: form.type },
        },
        {
          onSuccess: () => {
            toast.success("Discount updated");
            setModalOpen(false);
          },
          onError: () => toast.error("Failed to update discount"),
        },
      );
    } else {
      createDiscount(
        {
          discounts: [
            {
              name: form.name,
              rate: form.rate,
              type: form.type,
              isEnabled: false,
            },
          ],
        },
        {
          onSuccess: () => {
            toast.success("Discount created");
            setModalOpen(false);
          },
          onError: () => toast.error("Failed to create discount"),
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
              Discount Settings
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {discounts.length} discounts configured
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Discount
          </Button>
        </div>

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative ">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discounts..."
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Discount Tables side by side */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
          <div className="bg-white rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Percent size={14} className="text-blue-500" /> Percentage
              Discounts
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <DiscountTable
                discounts={percentageDiscounts}
                search={search}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            )}
          </div>

          <div className="bg-white rounded-xl  p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-green-500" /> Fixed Amount
              Discounts
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <DiscountTable
                discounts={fixedDiscounts}
                search={search}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            )}
          </div>
        </div>

        {/* Create/Edit modal */}
        <EditDiscountModal
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
              setDeleteTarget(null);
            }
          }}
          title="Delete Discount"
          message={
            deleteTarget
              ? `Delete "${deleteTarget.name}"? This cannot be undone.`
              : ""
          }
          onConfirm={confirmDelete}
          isPending={deleting}
        />
      </div>
    </div>
  );
}
