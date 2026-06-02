"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Trash2,
  Layers,
  Pencil,
  Check,
  Percent,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Toggle({
  checked,
  loading,
  onClick,
}: {
  checked: boolean;
  loading: boolean;
  onClick: () => void;
}) {
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
}

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

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

  // Edit modals
  const [editNormalOpen, setEditNormalOpen] = useState(false);
  const [editingNormal, setEditingNormal] = useState<any | null>(null);
  const [editNormalForm, setEditNormalForm] = useState({ name: "", rate: 0 });

  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupTaxIds, setEditGroupTaxIds] = useState<string[]>([]);
  const [editGroupSearch, setEditGroupSearch] = useState("");

  const taxes = data?.taxes ?? [];
  const groupedTaxes = data?.groupedTaxes ?? [];
  const taxSettings = data?.taxSettings;
  const isExclusive = taxSettings?.mode === "exclusive";

  const filteredTaxes = taxes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredGroups = groupedTaxes.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

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

  const getGroupRate = (taxIds: string[]) =>
    taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  // ── Normal Tax Edit ───────────────────────────────────
  const openEditNormal = (tax: any) => {
    setEditingNormal(tax);
    setEditNormalForm({ name: tax.name, rate: tax.rate });
    setEditNormalOpen(true);
  };

  const handleSaveNormalEdit = () => {
    if (
      !editingNormal ||
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
  const handleDeleteNormal = (tax: any) => {
    if (!tax._docId) {
      toast.error("Missing document reference");
      return;
    }
    if (!window.confirm(`Delete tax "${tax.name}"? This cannot be undone.`))
      return;
    deleteNormalTax(
      { docId: tax._docId, taxId: tax._id },
      {
        onError: () => toast.error("Failed to delete tax"),
      },
    );
  };

  // ── Group Tax Edit ────────────────────────────────────
  const openEditGroup = (group: any) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupTaxIds([...group.taxIds]);
    setEditGroupSearch("");
    setEditGroupOpen(true);
  };

  const toggleEditGroupTaxId = (id: string) => {
    setEditGroupTaxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSaveGroupEdit = () => {
    if (!editingGroup || !editGroupName.trim() || editGroupTaxIds.length === 0)
      return;
    updateGroupTax(
      {
        docId: editingGroup._docId,
        groupId: editingGroup._id,
        payload: { name: editGroupName, taxIds: editGroupTaxIds },
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
  const handleDeleteGroup = (group: any) => {
    if (!group._docId) {
      toast.error("Missing document reference");
      return;
    }
    if (
      !window.confirm(
        `Delete group tax "${group.name}"? This cannot be undone.`,
      )
    )
      return;
    deleteGroupTax(
      { docId: group._docId, groupId: group._id },
      {
        onError: () => toast.error("Failed to delete group tax"),
      },
    );
  };

  const isPending =
    updatingNormal || deletingNormal || updatingGroup || deletingGroup;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Tax Settings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
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

        {/* ── Search ──────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search taxes..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Standard taxes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Standard Taxes
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : filteredTaxes.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No taxes yet. Create one above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2.5 font-medium">Name</th>
                  <th className="text-left pb-2.5 font-medium">Rate</th>
                  <th className="text-center pb-2.5 font-medium">Status</th>
                  <th className="text-right pb-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaxes.map((tax) => (
                  <tr
                    key={tax._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 font-medium text-gray-800">
                      {tax.name}
                    </td>
                    <td className="py-3 text-gray-500">{tax.rate}%</td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${tax.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} `}
                      >
                        {tax.isEnabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditNormal(tax)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <Toggle
                          checked={tax.isEnabled}
                          loading={togglingId === tax._id}
                          onClick={() => handleToggle(tax._id, tax.isEnabled)}
                        />
                        <button
                          onClick={() => handleDeleteNormal(tax)}
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
          )}
        </div>

        {/* Group taxes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Layers size={14} className="text-blue-500" /> Group Taxes
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No group taxes yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2.5 font-medium">Name</th>
                  <th className="text-left pb-2.5 font-medium">
                    Combined Rate
                  </th>
                  <th className="text-left pb-2.5 font-medium">Includes</th>
                  <th className="text-center pb-2.5 font-medium">Status</th>
                  <th className="text-right pb-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => {
                  const rate = getGroupRate(group.taxIds);
                  const names = group.taxIds
                    .map((id) => taxes.find((t) => t._id === id)?.name ?? "")
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr
                      key={group._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 font-medium text-gray-800">
                        {group.name}
                      </td>
                      <td className="py-3 text-blue-600 font-semibold ">
                        {rate}%
                      </td>
                      <td className="py-3 text-gray-400 text-xs max-w-[180px] truncate">
                        {names || "—"}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {group.isEnabled ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditGroup(group)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <Toggle
                            checked={group.isEnabled}
                            loading={togglingId === group._id}
                            onClick={() =>
                              handleToggle(group._id, group.isEnabled)
                            }
                          />
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Edit Normal Tax Modal ─────────────────────────────── */}
      <Dialog
        open={editNormalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditNormalOpen(false);
            setEditingNormal(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Tax
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Tax Name
              </Label>
              <Input
                value={editNormalForm.name}
                onChange={(e) =>
                  setEditNormalForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. VAT"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Rate (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="pl-7"
                  value={editNormalForm.rate}
                  onChange={(e) =>
                    setEditNormalForm((p) => ({
                      ...p,
                      rate: Number(e.target.value),
                    }))
                  }
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Percent className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditNormalOpen(false);
                setEditingNormal(null);
              }}
              className="text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNormalEdit}
              disabled={
                updatingNormal ||
                !editNormalForm.name.trim() ||
                editNormalForm.rate <= 0
              }
              className="bg-blue-600 hover:bg-blue-700 text-sm rounded-lg"
            >
              {updatingNormal ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Group Tax Modal ──────────────────────────────── */}
      <Dialog
        open={editGroupOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditGroupOpen(false);
            setEditingGroup(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Edit Group Tax
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Group Name
              </Label>
              <Input
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="e.g. Total Tax"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Select Taxes
              </Label>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={editGroupSearch}
                  onChange={(e) => setEditGroupSearch(e.target.value)}
                  placeholder="Search taxes..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {taxes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No normal taxes available.
                  </p>
                ) : (
                  taxes
                    .filter((t) =>
                      t.name
                        .toLowerCase()
                        .includes(editGroupSearch.toLowerCase()),
                    )
                    .map((tax) => {
                      const isSelected = editGroupTaxIds.includes(tax._id);
                      return (
                        <button
                          key={tax._id}
                          type="button"
                          onClick={() => toggleEditGroupTaxId(tax._id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-medium text-xs">{tax.name}</p>
                            <p className="text-xs text-gray-400">{tax.rate}%</p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>
            {editGroupTaxIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      Combined Rate
                    </p>
                    <p className="text-xs text-blue-400 mt-0.5">
                      {editGroupTaxIds
                        .map((id) => {
                          const t = taxes.find((x) => x._id === id);
                          return t ? `${t.name} (${t.rate}%)` : "";
                        })
                        .join(" + ")}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    {getGroupRate(editGroupTaxIds)}%
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditGroupOpen(false);
                setEditingGroup(null);
              }}
              className="text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGroupEdit}
              disabled={
                updatingGroup ||
                !editGroupName.trim() ||
                editGroupTaxIds.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700 text-sm rounded-lg"
            >
              {updatingGroup ? (
                <>
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
