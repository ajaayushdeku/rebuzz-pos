"use client";

import { useState } from "react";
import { Percent, Check, Search, Loader2, Receipt } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { useCreateTax, useCreateGroupTax, useTaxes } from "@/hooks/useTaxes";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

type Tab = "normal" | "group";

export const CreateTaxDialog = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("normal");

  // Normal tax form
  const { mutate: createTax, isPending: creatingTax } = useCreateTax();
  const [normalForm, setNormalForm] = useState({ name: "", rate: 0 });

  // Group tax form
  const { mutate: createGroupTax, isPending: creatingGroup } =
    useCreateGroupTax();
  const { data: taxData } = useTaxes();
  const taxes = taxData?.taxes ?? [];
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  const filteredTaxes = taxes.filter((t) =>
    t.name.toLowerCase().includes(groupSearch.toLowerCase()),
  );

  const totalGroupRate = selectedTaxIds.reduce((sum, id) => {
    const t = taxes.find((x) => x._id === id);
    return sum + (t?.rate ?? 0);
  }, 0);

  const toggleTaxId = (id: string) => {
    setSelectedTaxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const reset = () => {
    setNormalForm({ name: "", rate: 0 });
    setGroupName("");
    setGroupSearch("");
    setSelectedTaxIds([]);
    setTab("normal");
  };

  const handleSaveNormal = () => {
    if (!normalForm.name.trim() || normalForm.rate <= 0) return;
    createTax(
      {
        taxes: [
          {
            name: normalForm.name,
            rate: normalForm.rate,
            _id: null,
            adminId: null,
            isSelected: false,
            isEnabled: false,
            isToogleLoading: false,
          },
        ],
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || selectedTaxIds.length === 0) return;
    createGroupTax(
      { groupName, groupedTaxes: selectedTaxIds },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  const isPending = creatingTax || creatingGroup;

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const inputClass =
    "w-full h-9 rounded-lg border border-slate-200 px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]";

  return (
    <>
      <HeaderActionButton
        variant="dashed"
        hideLabelOnMobile
        icon={Receipt}
        label="Create Tax"
        onClick={() => setOpen(true)}
      />

      <ModalShell
        open={open}
        onClose={() => handleOpenChange(false)}
        busy={isPending}
        title="Create Tax"
        subtitle="Add a single tax rate, or combine existing taxes into a group"
        icon={Receipt}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={tab === "normal" ? handleSaveNormal : handleSaveGroup}
              disabled={
                isPending ||
                (tab === "normal" &&
                  (!normalForm.name.trim() || normalForm.rate <= 0)) ||
                (tab === "group" &&
                  (!groupName.trim() || selectedTaxIds.length === 0))
              }
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating...
                </>
              ) : tab === "normal" ? (
                "Create Tax"
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* ── Tax type ── */}
          <div>
            <div className="mb-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-[#6b7588]">
                Tax Type
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-[#9aa6bd]">
                Pick what kind of tax you want to create
              </p>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 dark:bg-white/10">
              {(["normal", "group"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    tab === t
                      ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                      : "text-slate-500 hover:text-slate-700 dark:text-[#9aa6bd] dark:hover:text-white"
                  }`}
                >
                  {t === "normal" ? "Normal Tax" : "Group Tax"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Normal tax form ── */}
          {tab === "normal" && (
            <>
              <div>
                <div className="mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-[#6b7588]">
                    Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#9aa6bd]">
                    How this tax appears on invoices
                  </p>
                </div>
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5 dark:text-[#6b7588]">
                  Tax Name
                </label>
                <input
                  placeholder="e.g. VAT, Service Tax"
                  value={normalForm.name}
                  onChange={(e) =>
                    setNormalForm({
                      ...normalForm,
                      name: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-[#6b7588]">
                    Rate
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#9aa6bd]">
                    Percentage added to the taxable amount
                  </p>
                </div>
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5 dark:text-[#6b7588]">
                  Rate (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7b869b]">
                    <Percent className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={normalForm.rate}
                    onChange={(e) =>
                      setNormalForm({
                        ...normalForm,
                        rate: Number(e.target.value),
                      })
                    }
                    className={`${inputClass} pl-8`}
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Group tax form ── */}
          {tab === "group" && (
            <>
              <div>
                <div className="mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-[#6b7588]">
                    Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#9aa6bd]">
                    How this group appears when applied to a product
                  </p>
                </div>
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400 block mb-1.5 dark:text-[#6b7588]">
                  Group Tax Name
                </label>
                <input
                  placeholder="e.g. Total Tax"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-[#6b7588]">
                    Select Taxes to Group
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-[#9aa6bd]">
                    Their rates are added together to form the group rate
                  </p>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-[#7b869b]" />
                  <input
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search taxes..."
                    className={`${inputClass} pl-8`}
                  />
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5">
                  {taxes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 dark:text-[#7b869b]">
                      No normal taxes available. Create one first.
                    </p>
                  ) : filteredTaxes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 dark:text-[#7b869b]">
                      No taxes match your search.
                    </p>
                  ) : (
                    filteredTaxes.map((tax) => {
                      const isSelected = selectedTaxIds.includes(tax._id);
                      return (
                        <button
                          key={tax._id}
                          type="button"
                          onClick={() => toggleTaxId(tax._id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-[#7ba2e3] dark:bg-blue-400/10 dark:text-[#a8c4ee]"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-white/15 dark:text-[#c3ccdc] dark:hover:border-white/25 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-semibold text-xs">{tax.name}</p>
                            <p className="text-[11px] text-slate-400 dark:text-[#7b869b]">
                              {tax.rate}%
                            </p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300 dark:border-white/30"
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

              {/* Live rate preview */}
              {selectedTaxIds.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-3 shadow-sm dark:border-blue-400/20 dark:from-blue-400/10 dark:via-transparent dark:to-indigo-400/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-700 dark:text-[#a8c4ee]">
                        Combined Rate
                      </p>
                      <p className="text-[11px] text-blue-400 mt-0.5 truncate dark:text-[#7ba2e3]">
                        {selectedTaxIds
                          .map((id) => {
                            const t = taxes.find((x) => x._id === id);
                            return t ? `${t.name} (${t.rate}%)` : "";
                          })
                          .join(" + ")}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-blue-700 shrink-0 dark:text-[#a8c4ee]">
                      {totalGroupRate}%
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ModalShell>
    </>
  );
};
