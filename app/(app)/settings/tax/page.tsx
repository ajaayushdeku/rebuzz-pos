"use client";

import { useRef, useState } from "react";
import { Search, Loader2, Layers, Receipt, Percent } from "lucide-react";
import {
  useTaxes,
  useToggleTax,
  useUpdateTaxSettings,
  useUpdateNormalTax,
  useDeleteNormalTax,
  useUpdateGroupTax,
  useDeleteGroupTax,
} from "@/hooks/useTaxes";
import toast from "react-hot-toast";
import { CreateTaxDialog } from "@/components/invoice/CreateTaxRate";
import { GroupedTax, Tax } from "@/services/apiTaxes.client";
import StandardTaxTable from "@/components/settingsComponents/staffs/taxes/StandardTaxTable";
import GroupTaxTable from "@/components/settingsComponents/staffs/taxes/GroupTaxTable";
import EditNormalTaxModal from "@/components/settingsComponents/staffs/taxes/EditNormalTaxModal";
import EditGroupTaxModal from "@/components/settingsComponents/staffs/taxes/EditGroupTaxModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

type TabKey = "standard" | "group";

const Toggle = ({
  checked,
  loading,
  onClick,
}: {
  checked: boolean;
  loading: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-200"}`}
    >
      {loading ? (
        <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
        />
      )}
    </button>
  );
};

export default function TaxSettingsPage() {
  const { data, isLoading } = useTaxes();
  const { mutate: toggleTax, isPending: togglingTax } = useToggleTax();
  const { mutate: updateSettings, isPending: updatingSettings } =
    useUpdateTaxSettings();
  const { mutate: updateNormalTax, isPending: updatingNormal } =
    useUpdateNormalTax();
  const { mutate: deleteNormalTax, isPending: deletingNormal } =
    useDeleteNormalTax();
  const { mutate: updateGroupTax, isPending: updatingGroup } =
    useUpdateGroupTax();
  const { mutate: deleteGroupTax, isPending: deletingGroup } =
    useDeleteGroupTax();
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Which tax table is showing
  const [activeTab, setActiveTab] = useState<TabKey>("standard");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Edit Normal Tax modal state
  const [editNormalOpen, setEditNormalOpen] = useState(false);
  const [editingNormal, setEditingNormal] = useState<Tax | null>(null);
  const [editNormalForm, setEditNormalForm] = useState({ name: "", rate: 0 });

  // Edit Group Tax modal state
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupedTax | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "normal" | "group";
    item: Tax | GroupedTax;
  } | null>(null);

  const taxes = data?.taxes ?? [];
  const groupedTaxes = data?.groupedTaxes ?? [];
  const taxSettings = data?.taxSettings;
  const isExclusive = taxSettings?.mode === "exclusive";

  const handleToggle = (taxId: string, currentlyEnabled: boolean) => {
    setTogglingId(taxId);

    if (currentlyEnabled) {
      toggleTax(
        { taxId, isEnabled: false },
        {
          onSuccess: () => setTogglingId(null),
          onError: () => {
            setTogglingId(null);
            toast.error("Failed to update tax");
          },
        },
      );
      return;
    }

    const activeNormal = taxes.find((t) => t.isEnabled && t._id !== taxId);
    const activeGroup = groupedTaxes.find(
      (g) => g.isEnabled && g._id !== taxId,
    );
    const currentlyActive = activeNormal || activeGroup;

    if (currentlyActive) {
      toggleTax(
        { taxId: currentlyActive._id, isEnabled: false },
        {
          onSuccess: () => {
            toggleTax(
              { taxId, isEnabled: true },
              {
                onSuccess: () => setTogglingId(null),
                onError: () => {
                  setTogglingId(null);
                  toast.error("Failed to update tax");
                },
              },
            );
          },
          onError: () => {
            setTogglingId(null);
            toast.error("Failed to update tax");
          },
        },
      );
    } else {
      toggleTax(
        { taxId, isEnabled: true },
        {
          onSuccess: () => setTogglingId(null),
          onError: () => {
            setTogglingId(null);
            toast.error("Failed to update tax");
          },
        },
      );
    }
  };

  const handleModeToggle = () => {
    const newMode = isExclusive ? "none" : "exclusive";
    updateSettings(
      { mode: newMode, isAddonTaxEnabled: false },
      {
        onError: () => toast.error("Failed to update tax mode"),
      },
    );
  };

  // ── Normal Tax Edit ───────────────────────────────────
  const openEditNormal = (tax: Tax) => {
    setEditingNormal(tax);
    setEditNormalForm({ name: tax.name, rate: tax.rate });
    setEditNormalOpen(true);
  };

  const handleSaveNormalEdit = () => {
    if (
      !editingNormal ||
      !editingNormal._docId ||
      !editNormalForm.name.trim() ||
      editNormalForm.rate <= 0
    )
      return;
    updateNormalTax(
      {
        docId: editingNormal._docId,
        taxId: editingNormal._id,
        payload: { name: editNormalForm.name, rate: editNormalForm.rate },
      },
      {
        onSuccess: () => {
          setEditNormalOpen(false);
          setEditingNormal(null);
        },
        onError: () => toast.error("Failed to update tax"),
      },
    );
  };

  // ── Normal Tax Delete ─────────────────────────────────
  const openDeleteNormal = (tax: Tax) => {
    if (!tax._docId) {
      toast.error("Missing document reference");
      return;
    }
    setDeleteTarget({ type: "normal", item: tax });
    setDeleteModalOpen(true);
  };

  const confirmDeleteNormal = () => {
    if (!deleteTarget || deleteTarget.type !== "normal") return;
    const tax = deleteTarget.item as Tax;
    if (!tax._docId) return;
    deleteNormalTax(
      { docId: tax._docId, taxId: tax._id },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete tax"),
      },
    );
  };

  // ── Group Tax Edit ────────────────────────────────────
  const openEditGroup = (group: GroupedTax) => {
    setEditingGroup(group);
    setEditGroupOpen(true);
  };

  const handleSaveGroupEdit = (payload: { name: string; taxIds: string[] }) => {
    if (!editingGroup || !editingGroup._docId) return;
    updateGroupTax(
      {
        docId: editingGroup._docId,
        groupId: editingGroup._id,
        payload,
      },
      {
        onSuccess: () => {
          setEditGroupOpen(false);
          setEditingGroup(null);
        },
        onError: () => toast.error("Failed to update group tax"),
      },
    );
  };

  // ── Group Tax Delete ──────────────────────────────────
  const openDeleteGroup = (group: GroupedTax) => {
    if (!group._docId) {
      toast.error("Missing document reference");
      return;
    }
    setDeleteTarget({ type: "group", item: group });
    setDeleteModalOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (!deleteTarget || deleteTarget.type !== "group") return;
    const group = deleteTarget.item as GroupedTax;
    if (!group._docId) return;
    deleteGroupTax(
      { docId: group._docId, groupId: group._id },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        },
        onError: () => toast.error("Failed to delete group tax"),
      },
    );
  };

  const isPending =
    updatingNormal || deletingNormal || updatingGroup || deletingGroup;

  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number | null;
    icon: typeof Receipt;
  }> = [
    {
      key: "standard",
      label: "Standard",
      count: isLoading ? null : taxes.length,
      icon: Receipt,
    },
    {
      key: "group",
      label: "Group",
      count: isLoading ? null : groupedTaxes.length,
      icon: Layers,
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
      <div className="w-full mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Tax Settings
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage tax rates and modes
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Exclusive Tax
              </span>
              <Toggle
                checked={isExclusive}
                loading={updatingSettings}
                onClick={handleModeToggle}
              />
            </div>
            <CreateTaxDialog />
          </div>
        </div>

        {/* ── Tabs — the rule runs edge to edge and the pill sits on top ── */}
        <div className="relative flex justify-center mt-6">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-gray-200"
          />
          <div
            role="tablist"
            aria-label="Tax type"
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
                  id={`taxes-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`taxes-panel-${tab.key}`}
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

        {/* ── Search — stays put, filters whichever table is showing ── */}
        <div className="relative ">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search taxes..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* ── Panels ─────────────────────────────────────── */}
        <div
          role="tabpanel"
          id={`taxes-panel-${activeTab}`}
          aria-labelledby={`taxes-tab-${activeTab}`}
          tabIndex={0}
          className="bg-white rounded-xl px-5 py-2 focus-visible:outline-none"
        >
          {activeTab === "standard" ? (
            <StandardTaxTable
              taxes={taxes}
              search={search}
              onEdit={openEditNormal}
              onToggle={handleToggle}
              onDelete={openDeleteNormal}
              togglingId={togglingId}
              loading={isLoading}
            />
          ) : (
            <GroupTaxTable
              groupedTaxes={groupedTaxes}
              taxes={taxes}
              search={search}
              onToggle={handleToggle}
              onDelete={openDeleteGroup}
              togglingId={togglingId}
              loading={isLoading}
            />
          )}
        </div>
      </div>

      {/* ── Edit Normal Tax Modal ─────────────────────────────── */}
      <EditNormalTaxModal
        open={editNormalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditNormalOpen(false);
            setEditingNormal(null);
          }
        }}
        tax={editingNormal}
        form={editNormalForm}
        onFormChange={setEditNormalForm}
        onSave={handleSaveNormalEdit}
        isPending={updatingNormal}
      />

      {/* ── Edit Group Tax Modal ──────────────────────────────── */}
      <EditGroupTaxModal
        open={editGroupOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditGroupOpen(false);
            setEditingGroup(null);
          }
        }}
        group={editingGroup}
        taxes={taxes}
        onSave={handleSaveGroupEdit}
        isPending={updatingGroup}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────── */}
      <DeleteConfirmDialog
        open={deleteModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }
        }}
        icon={deleteTarget?.type === "normal" ? Percent : Layers}
        title={
          deleteTarget?.type === "normal" ? "Delete tax?" : "Delete group tax?"
        }
        description={
          deleteTarget
            ? `“${(deleteTarget.item as Tax | GroupedTax).name}” will be permanently removed.`
            : "This tax will be permanently removed."
        }
        warning="This action cannot be undone."
        onConfirm={
          deleteTarget?.type === "normal"
            ? confirmDeleteNormal
            : confirmDeleteGroup
        }
        isPending={deletingNormal || deletingGroup}
      />
    </div>
  );
}
