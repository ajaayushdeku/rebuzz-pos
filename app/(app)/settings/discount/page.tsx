"use client";

import { useRef, useState } from "react";
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

  // Which discount table is showing
  const [activeTab, setActiveTab] = useState<DiscountType>("percentage");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    // New discounts default to whichever table you're looking at
    setForm({ name: "", type: activeTab, rate: 0 });
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
            // Follow the new discount to its table
            setActiveTab(form.type);
          },
          onError: () => toast.error("Failed to create discount"),
        },
      );
    }
  };

  const tabs: Array<{
    key: DiscountType;
    label: string;
    count: number | null;
    icon: typeof Percent;
  }> = [
    {
      key: "percentage",
      label: "Percentage",
      count: isLoading ? null : percentageDiscounts.length,
      icon: Percent,
    },
    {
      key: "fixed",
      label: "Fixed amount",
      count: isLoading ? null : fixedDiscounts.length,
      icon: DollarSign,
    },
  ];

  // Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((t) => t.key === activeTab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    setActiveTab(tabs[next].key);
    tabRefs.current[next]?.focus();
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

        {/* ── Search — stays put, filters whichever table is showing ── */}
        <div className="relative ">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discounts..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* ── Tabs — the rule runs edge to edge and the pill sits on top ── */}
        <div className="relative flex justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
          />
          <div
            role="tablist"
            aria-label="Discount type"
            onKeyDown={handleTabKeyDown}
            className="relative flex items-center gap-1 rounded-full bg-[#e4f2fe] p-1"
          >
            {tabs.map((tab, i) => {
              const selected = tab.key === activeTab;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`discounts-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`discounts-panel-${tab.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2  text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] ${
                    selected
                      ? "bg-white font-bold text-blue-950 shadow-sm"
                      : "font-semibold text-blue-800 hover:text-blue-950"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {tab.label}
                  <span
                    className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 
                     bg-[#e4f2fe] text-blue-950 ring-blue-900"
                  >
                    {tab.count === null ? "–" : tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panels ─────────────────────────────────────── */}
        <div
          role="tabpanel"
          id={`discounts-panel-${activeTab}`}
          aria-labelledby={`discounts-tab-${activeTab}`}
          tabIndex={0}
          className="bg-white rounded-xl px-6 py-5 focus-visible:outline-none"
        >
          {activeTab === "percentage" ? (
            <DiscountTable
              discounts={percentageDiscounts}
              discountType="percent"
              search={search}
              onEdit={openEdit}
              onDelete={openDelete}
              loading={isLoading}
            />
          ) : (
            <DiscountTable
              discounts={fixedDiscounts}
              discountType="fixed"
              search={search}
              onEdit={openEdit}
              onDelete={openDelete}
              loading={isLoading}
            />
          )}
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
