"use client";

import { useState } from "react";
import { Search, Loader2, Plus, Percent, DollarSign } from "lucide-react";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "@/hooks/useDiscounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import DiscountTable from "@/components/settingsComponents/discounts/DiscountTable";

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

export interface Discount {
  _id: string;
  name: string;
  isEnabled: boolean;
  rate: number;
  type: "percentage" | "fixed";
  _docId?: string;
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function DiscountSettingsPage() {
  const { data: discounts = [], isLoading } = useDiscounts();
  const { mutate: createDiscount, isPending: creating } = useCreateDiscount();
  const { mutate: updateDiscount, isPending: updating } = useUpdateDiscount();
  const { mutate: deleteDiscount, isPending: deleting } = useDeleteDiscount();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Discount | null>(null);
  const [form, setForm] = useState<DiscountForm>({
    name: "",
    type: "percentage",
    rate: 0,
  });

  const percentageDiscounts = discounts.filter(
    (d: any) => d.type === "percentage",
  );
  const fixedDiscounts = discounts.filter((d: any) => d.type === "fixed");

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

  const handleDelete = (id: string) => {
    const target = discounts.find((d: Discount) => d._id === id);
    if (!target?._docId) {
      toast.error("Missing document reference");
      return;
    }
    if (
      !window.confirm(
        `Delete discount "${target.name}"? This cannot be undone.`,
      )
    )
      return;
    deleteDiscount(
      { docId: target._docId, discountId: id },
      {
        onSuccess: () => {
          toast.success("Discount deleted");
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
            <p className="text-sm text-gray-500 mt-0.5">
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
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discounts..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Discount Tables side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Percent size={14} className="text-blue-500" /> Percentage
              Discounts
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <DiscountTable
                discounts={percentageDiscounts}
                search={search}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-green-500" /> Fixed Amount
              Discounts
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <DiscountTable
                discounts={fixedDiscounts}
                search={search}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        {/* Create/Edit modal */}
        <Dialog
          open={modalOpen}
          onOpenChange={(o) => !o && setModalOpen(false)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {editTarget ? "Edit Discount" : "New Discount"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Discount Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Seasonal Sale"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        type: e.target.value as DiscountType,
                      }))
                    }
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">
                    Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {form.type === "percentage" ? (
                        <Percent size={11} />
                      ) : (
                        <DollarSign size={11} />
                      )}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.rate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, rate: Number(e.target.value) }))
                      }
                      className={`${inputClass} pl-7`}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-sm rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={creating || updating || deleting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                {creating || updating ? (
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
      </div>
    </div>
  );
}
