"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check, BadgePercent } from "lucide-react";
import ModalShell, { SectionLabel } from "@/components/ui/ModalShell";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { CreateDiscountDialog } from "./CreateDiscount";

interface Discount {
  _id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
}

type DiscountTab = "fixed" | "percentage";

/** In the order the switch draws them, so the arrow keys and the pill agree. */
const DISCOUNT_TABS: { key: DiscountTab; label: string }[] = [
  { key: "fixed", label: "Fixed Amount" },
  { key: "percentage", label: "Percentage (%)" },
];

interface DiscountPickerModalProps {
  open: boolean;
  onClose: () => void;
  discounts: Discount[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  title?: string;
}

export default function DiscountPickerModal({
  open,
  onClose,
  discounts,
  selectedIds,
  onApply,
  title = "Apply Discounts",
}: DiscountPickerModalProps) {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<DiscountTab>("fixed");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Left/Right/Home/End move between tabs, per the WAI-ARIA tabs pattern.
   *
   * The same handler the switch above the invoice table uses: once the buttons
   * carry `role="tab"`, a screen reader announces them as a tab list and the
   * arrow keys are the expected way through it.
   */
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = DISCOUNT_TABS.findIndex((t) => t.key === tab);
    let next: number | null = null;

    if (e.key === "ArrowRight") next = (current + 1) % DISCOUNT_TABS.length;
    if (e.key === "ArrowLeft")
      next = (current - 1 + DISCOUNT_TABS.length) % DISCOUNT_TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = DISCOUNT_TABS.length - 1;
    if (next === null) return;

    e.preventDefault();
    setTab(DISCOUNT_TABS[next].key);
    setSearch("");
    tabRefs.current[next]?.focus();
  };

  // The panel stays mounted between openings, so local selection has to be
  // re-seeded each time — otherwise cancelling and reopening shows the stale
  // draft rather than what's actually applied.
  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(
    () =>
      discounts.filter(
        (d) =>
          d.type === tab && d.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [discounts, search, tab],
  );

  const toggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Pick one or more discounts to apply to this invoice."
      icon={BadgePercent}
      iconColor="text-blue-600 dark:text-[#7ba2e3]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="animate-pulse">
            <CreateDiscountDialog />
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white dark:bg-white/5 text-gray-700 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer border border-gray-300 hover:text-white hover:border-red-500 hover:shadow-lg dark:border-white/20 dark:text-[#c3ccdc]"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Apply ({localSelected.length})
            </button>
          </div>
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
          aria-label="Discount type"
          onKeyDown={handleTabKeyDown}
          className="w-full relative flex items-center gap-1 rounded-xl bg-[#e4f2fe] p-1 dark:bg-[#272C37]"
        >
          {DISCOUNT_TABS.map(({ key, label }, i) => {
            const selected = tab === key;

            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`discount-picker-tab-${key}`}
                aria-selected={selected}
                aria-controls="discount-picker-panel"
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
          placeholder={`Search ${tab === "fixed" ? "fixed" : "percentage"} discounts...`}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
        />
      </div>

      {/* List */}
      <div
        id="discount-picker-panel"
        role="tabpanel"
        aria-labelledby={`discount-picker-tab-${tab}`}
        className="mt-3 min-h-[150px] max-h-[200px] overflow-y-auto scrollbar-hide space-y-1.5"
      >
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 dark:text-[#9aa6bd]">
            No {tab === "fixed" ? "fixed" : "percentage"} discounts found
          </p>
        ) : (
          filtered.map((d) => {
            const isSelected = localSelected.includes(d._id);
            return (
              <button
                key={d._id}
                type="button"
                onClick={() => toggle(d._id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:text-blue-300 dark:bg-blue-400/10"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 dark:hover:border-white/20 dark:hover:bg-white/5 dark:border-white/10 dark:text-[#c3ccdc]"
                }`}
              >
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 dark:text-[#9aa6bd]">
                    {d.type === "percentage"
                      ? `${d.rate}%`
                      : formatCurrencySymbol(
                          d.rate,
                          currency.symbol,
                          currency.locale,
                        )}{" "}
                    off
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 dark:border-white/20"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
