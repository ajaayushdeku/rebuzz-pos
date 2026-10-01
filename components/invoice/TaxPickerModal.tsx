"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2, Layers, Receipt } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { Tax, GroupedTax } from "@/services/apiTaxes.client";
import { CreateTaxDialog } from "./CreateTaxRate";

type TaxTab = "normal" | "group";

/** In the order the switch draws them, so the arrow keys and the pill agree. */
const TAX_TABS: { key: TaxTab; label: string }[] = [
  { key: "normal", label: "Normal Taxes" },
  { key: "group", label: "Group Taxes" },
];

interface TaxPickerModalProps {
  open: boolean;
  onClose: () => void;
  taxes: Tax[];
  groupedTaxes: GroupedTax[];
  isLoading: boolean;
  togglingId: string | null;
  togglingTax: boolean;
  onToggle: (
    taxId: string,
    currentlyEnabled: boolean,
    isGroup?: boolean,
  ) => void;
}

export default function TaxPickerModal({
  open,
  onClose,
  taxes,
  groupedTaxes,
  isLoading,
  togglingId,
  togglingTax,
  onToggle,
}: TaxPickerModalProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TaxTab>("normal");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Clear the query each time it opens, so a stale filter doesn't hide
  // everything on the next visit.
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  /**
   * Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
   *
   * The same handler the switch above the invoice table uses: once the buttons
   * carry `role="tab"`, a screen reader announces them as a tab list and the
   * arrow keys are the expected way through it.
   */
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = TAX_TABS.findIndex((t) => t.key === tab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % TAX_TABS.length;
    if (e.key === "ArrowLeft")
      next = (current - 1 + TAX_TABS.length) % TAX_TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TAX_TABS.length - 1;
    if (next === null) return;

    e.preventDefault();
    setTab(TAX_TABS[next].key);
    setSearch("");
    tabRefs.current[next]?.focus();
  };

  const filteredNormal = useMemo(
    () =>
      taxes.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [taxes, search],
  );

  const filteredGroup = useMemo(
    () =>
      groupedTaxes.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [groupedTaxes, search],
  );

  // Resolve combined rate for a grouped tax
  const getGroupRate = (group: GroupedTax): number =>
    group.taxIds.reduce((sum, id) => {
      const t = taxes.find((x) => x._id === id);
      return sum + (t?.rate ?? 0);
    }, 0);

  const getGroupTaxNames = (group: GroupedTax): string =>
    group.taxIds
      .map((id) => {
        const t = taxes.find((x) => x._id === id);
        return t ? `${t.name} (${t.rate}%)` : "";
      })
      .filter(Boolean)
      .join(", ");

  const TaxToggle = ({
    isEnabled,
    isThisToggling,
    disabled,
    onClick,
  }: {
    isEnabled: boolean;
    isThisToggling: boolean;
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        isEnabled ? "bg-blue-600" : "bg-gray-200 dark:bg-white/10"
      }`}
    >
      {isThisToggling ? (
        <Loader2 className="absolute inset-0 m-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      )}
    </button>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Select Tax"
      subtitle="Choose a tax to apply to this invoice."
      icon={Receipt}
      iconColor="text-blue-600 dark:text-[#7ba2e3]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="animate-pulse">
            <CreateTaxDialog />
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      {/* Tabs — the rule runs edge to edge and the pill sits on top of it, the
          same switch as the one above the invoice table. */}
      <div className="relative flex justify-center">
        {/* <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-gray-200 dark:bg-white/10"
        /> */}
        <div
          role="tablist"
          aria-label="Tax type"
          onKeyDown={handleTabKeyDown}
          className="w-full relative flex items-center gap-1 rounded-xl bg-[#e4f2fe] p-1 dark:bg-[#272C37]"
        >
          {TAX_TABS.map(({ key, label }, i) => {
            const selected = tab === key;

            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tax-picker-tab-${key}`}
                aria-selected={selected}
                aria-controls="tax-picker-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => {
                  setTab(key);
                  setSearch("");
                }}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe] dark:focus-visible:ring-offset-[#242a38] ${
                  selected
                    ? "bg-white font-bold text-blue-950 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                    : "font-semibold text-blue-800 hover:text-blue-950 dark:text-[#a8c4ee] dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-[#9aa6bd]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab === "normal" ? "taxes" : "group taxes"}...`}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
        />
      </div>

      {/* List */}
      <div
        id="tax-picker-panel"
        role="tabpanel"
        aria-labelledby={`tax-picker-tab-${tab}`}
        className="mt-3 min-h-[150px] max-h-[200px] overflow-y-auto scrollbar-hide space-y-1.5"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm dark:text-[#9aa6bd]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading taxes...
          </div>
        ) : tab === "normal" ? (
          filteredNormal.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 dark:text-[#9aa6bd]">
              No taxes found
            </p>
          ) : (
            filteredNormal.map((tax) => {
              const isThisToggling = togglingId === tax._id;
              return (
                <div
                  key={tax._id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    tax.isEnabled
                      ? "border-blue-200 bg-blue-50 dark:border-blue-400/25 dark:bg-blue-400/10"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 dark:hover:border-white/20 dark:hover:bg-white/5 dark:border-white/10 dark:text-[#c3ccdc]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate dark:text-[#e8ecf4]">
                      {tax.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 dark:text-[#9aa6bd]">
                      {tax.rate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tax.isEnabled && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full dark:text-blue-300 dark:bg-blue-400/15">
                        Active
                      </span>
                    )}
                    <TaxToggle
                      isEnabled={tax.isEnabled}
                      isThisToggling={isThisToggling}
                      disabled={
                        isThisToggling || (togglingTax && !isThisToggling)
                      }
                      onClick={() => onToggle(tax._id, tax.isEnabled, false)}
                    />
                  </div>
                </div>
              );
            })
          )
        ) : filteredGroup.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 dark:text-[#9aa6bd]">
            No group taxes found
          </p>
        ) : (
          filteredGroup.map((group) => {
            const isThisToggling = togglingId === group._id;
            const groupRate = getGroupRate(group);
            const groupNames = getGroupTaxNames(group);
            return (
              <div
                key={group._id}
                className={`px-3 py-2.5 rounded-lg border transition-colors ${
                  group.isEnabled
                    ? "border-blue-200 bg-blue-50 dark:border-blue-400/25 dark:bg-blue-400/10"
                    : " border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 dark:hover:border-white/20 dark:hover:bg-white/5 dark:border-white/10 dark:text-[#c3ccdc]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Layers
                        size={12}
                        className="text-blue-500 shrink-0 dark:text-blue-300"
                      />
                      <p className="text-sm font-medium text-gray-800 truncate dark:text-[#e8ecf4]">
                        {group.name}
                      </p>
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0 dark:text-blue-300 dark:bg-blue-400/15">
                        {groupRate}%
                      </span>
                    </div>
                    {groupNames && (
                      <p className="text-xs text-gray-400 truncate ml-[18px] dark:text-[#9aa6bd]">
                        {groupNames}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {group.isEnabled && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full dark:text-blue-300 dark:bg-blue-400/15">
                        Active
                      </span>
                    )}
                    <TaxToggle
                      isEnabled={group.isEnabled}
                      isThisToggling={isThisToggling}
                      disabled={
                        isThisToggling || (togglingTax && !isThisToggling)
                      }
                      onClick={() => onToggle(group._id, group.isEnabled, true)}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
