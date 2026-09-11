"use client";

import { Columns3 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TableColumn = {
  key: string;
  label: string;
  /**
   * Always rendered and never offered in the list. For a column that is a
   * control rather than data — hiding the row menu takes away what the row
   * can do, which is not a display preference.
   */
  locked?: boolean;
};

/**
 * Chooses which columns a table shows.
 *
 * Everything is on to begin with, so the table looks the same until someone
 * decides otherwise, and the choice is remembered per table when a
 * `storageKey` is given.
 *
 * A floor is enforced rather than suggested: at the limit the remaining
 * checkboxes go disabled instead of silently refusing the click, so the
 * control says why it will not go further. A table narrowed to one column is
 * not a table.
 */
export default function ColumnPicker({
  columns,
  visible,
  onChange,
  minVisible = 2,
  className = "",
}: {
  columns: readonly TableColumn[];
  /** Keys currently shown. Locked keys may be omitted; they render anyway. */
  visible: readonly string[];
  onChange: (next: string[]) => void;
  minVisible?: number;
  className?: string;
}) {
  const selectable = columns.filter((c) => !c.locked);
  const shown = new Set(visible);

  const shownCount = selectable.filter((c) => shown.has(c.key)).length;
  const allShown = shownCount === selectable.length;
  const atFloor = shownCount <= minVisible;

  const toggle = (key: string) => {
    const next = new Set(shown);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(selectable.filter((c) => next.has(c.key)).map((c) => c.key));
  };

  const selectAll = () => onChange(selectable.map((c) => c.key));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-2.5 text-[13px] text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        >
          <span className="flex items-center gap-2">
            <Columns3 size={14} className="text-gray-400" />
            Columns
          </span>
          {/* The count is the useful part of the trigger — it says the table
              is filtered without the menu being open. */}
          <span className="text-[11px] font-medium tabular-nums text-gray-400">
            {shownCount}/{selectable.length}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={allShown}
          disabled={allShown}
          // Multi-select: without this the menu closes on every tick and the
          // next column costs another trip to the trigger.
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={selectAll}
        >
          Select all
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {selectable.map((column) => {
          const checked = shown.has(column.key);
          return (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={checked}
              disabled={checked && atFloor}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggle(column.key)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}

        {atFloor && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[11px] leading-relaxed text-gray-400">
              At least {minVisible} columns stay visible.
            </p>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Reads a saved column choice, falling back to every column.
 *
 * Written for a `useState` initialiser rather than an effect: copying storage
 * into state from an effect is what this repo's lint rules forbid, and it also
 * renders one frame with the wrong columns before correcting itself.
 *
 * Saved keys are intersected with the current column list, so a column that
 * has since been renamed or removed cannot resurrect itself or leave a table
 * stuck below the floor.
 */
export function readStoredColumns(
  storageKey: string,
  columns: readonly TableColumn[],
  minVisible = 2,
): string[] {
  const all = columns.filter((c) => !c.locked).map((c) => c.key);
  if (typeof window === "undefined") return all;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return all;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return all;
    const kept = all.filter((key) => parsed.includes(key));
    return kept.length >= minVisible ? kept : all;
  } catch {
    return all;
  }
}

/** Saves a column choice. Storage can throw, and a filter is not worth a crash. */
export function storeColumns(storageKey: string, keys: readonly string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(keys));
  } catch {
    // Private windows and blocked site data — the table still works.
  }
}
