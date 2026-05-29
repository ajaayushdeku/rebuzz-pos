"use client";

import { useState } from "react";
import { Receipt, Search, Loader2, Trash2, Layers } from "lucide-react";
import { useTaxes, useToggleTax, useUpdateTaxSettings } from "@/hooks/useTaxes";
import { CreateTaxDialog } from "@/components/invoice/CreateTaxRate";
import toast from "react-hot-toast";

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

export default function TaxSettingsPage() {
  const { data, isLoading } = useTaxes();
  const { mutate: toggleTax, isPending: togglingTax } = useToggleTax();
  const { mutate: updateSettings, isPending: updatingSettings } =
    useUpdateTaxSettings();
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

    // If disabling, just disable this one
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

    // If enabling, find any currently active tax (normal or group) and disable it first
    const activeNormal = taxes.find((t) => t.isEnabled && t._id !== taxId);
    const activeGroup = groupedTaxes.find(
      (g) => g.isEnabled && g._id !== taxId,
    );
    const currentlyActive = activeNormal || activeGroup;

    if (currentlyActive) {
      // Disable the currently active one first, then enable the new one
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
      // No active tax, just enable the new one
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

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
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
                    <td className="py-3  text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${tax.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} `}
                      >
                        {tax.isEnabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Toggle
                          checked={tax.isEnabled}
                          loading={togglingId === tax._id}
                          onClick={() => handleToggle(tax._id, tax.isEnabled)}
                        />
                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
                          <Toggle
                            checked={group.isEnabled}
                            loading={togglingId === group._id}
                            onClick={() =>
                              handleToggle(group._id, group.isEnabled)
                            }
                          />
                          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
