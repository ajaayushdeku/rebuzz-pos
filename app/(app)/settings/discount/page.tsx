"use client";

import { useState } from "react";
import {
  Tag,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  Percent,
  DollarSign,
} from "lucide-react";
import { useDiscounts, useCreateDiscount } from "@/hooks/useDiscounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type DiscountType = "percentage" | "fixed";

type DiscountForm = {
  name: string;
  type: DiscountType;
  rate: number;
};

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function DiscountTable({
  discounts,
  search,
  onEdit,
  onDelete,
}: {
  discounts: any[];
  search: string;
  onEdit: (d: any) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = discounts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No discounts found
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-gray-100">
          <th className="text-left pb-2.5 font-medium">Name</th>
          <th className="text-left pb-2.5 font-medium">Value</th>
          <th className="text-right pb-2.5 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((d) => (
          <tr
            key={d._id}
            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
          >
            <td className="py-3 font-medium text-gray-800">{d.name}</td>
            <td className="py-3 text-gray-600">
              {d.type === "percentage" ? `${d.rate}%` : `Rs ${d.rate}`}
            </td>
            <td className="py-3">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onEdit(d)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(d._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DiscountSettingsPage() {
  const { data: discounts = [], isLoading } = useDiscounts();
  const { mutate: createDiscount, isPending: creating } = useCreateDiscount();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
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

  const openEdit = (d: any) => {
    setEditTarget(d);
    setForm({ name: d.name, type: d.type, rate: d.rate });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || form.rate <= 0) return;
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
                onDelete={(id) => toast("Delete not wired yet")}
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
                onDelete={(id) => toast("Delete not wired yet")}
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
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
              >
                {creating ? (
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
