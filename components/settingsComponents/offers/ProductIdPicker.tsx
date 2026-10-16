"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

import { useProductsList } from "@/hooks/useProductsList";
import {
  getVariants,
  offerItemLabel,
  variantLabel,
} from "@/lib/productVariants";

/**
 * Product pickers for editing a stored offer.
 *
 * One row per *variant*, matching the builder's pickers. This used to list one
 * row per product, because an offer came back as product ids with no variant
 * beside them and a variant-level list could not have shown what was chosen.
 * Offers now store the variant's own id, so the row that was picked is exactly
 * the row that can be ticked, and editing an offer no longer silently widens a
 * deal on one size to every size of the item.
 *
 * Legacy ids are still handled: an offer saved before this shows its product
 * name in the closed field (via `offerItemLabel`, which resolves either kind)
 * even though no variant row carries that id. Re-picking upgrades it.
 */

const FIELD =
  "h-11 w-full rounded-xl border border-gray-300 bg-white text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]";

/** `id` is what gets stored: a variant's where the product has any. */
type Row = { id: string; label: string; variants: string; search: string };

/**
 * The catalogue as selectable rows — one per variant, or one per product for
 * an item that has none.
 *
 * A product with variants contributes no row of its own. That is deliberate and
 * matches the builder: "Coke" as an offer target is ambiguous once Coke is sold
 * in three sizes at three prices, and leaving the choice open was how a deal
 * meant for the small one came to apply to the large.
 */
function useRows(): { rows: Row[]; isLoading: boolean } {
  const { data: products = [], isLoading } = useProductsList();

  const rows = useMemo(
    () =>
      products.flatMap((product) => {
        const variants = getVariants(product);

        if (variants.length === 0) {
          return [
            {
              id: product.id,
              label: product.name,
              variants: "",
              search: product.name.toLowerCase(),
            },
          ];
        }

        return variants.map((variant) => {
          const label = variantLabel(variant);
          return {
            id: variant.id,
            label: product.name,
            variants: label,
            // Both halves, so "large" finds the row and not just the product.
            search: `${product.name} ${label}`.toLowerCase(),
          };
        });
      }),
    [products],
  );

  return { rows, isLoading };
}

/** How a stored id reads once it is chosen, either kind. */
function useLabelFor() {
  const { data: products = [] } = useProductsList();
  return useMemo(
    () => (id: string) => offerItemLabel(products, id),
    [products],
  );
}

/** The product name, with the variant it names under it. */
function RowLabel({ row }: { row: Row }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[#3c4043] dark:text-[#e8ecf4]">
        {row.label}
      </span>
      {row.variants && (
        <span className="block truncate text-[11px] text-gray-400 dark:text-[#7b869b]">
          {row.variants}
        </span>
      )}
    </span>
  );
}

function Panel({
  children,
  query,
  onQuery,
  onClose,
}: {
  children: React.ReactNode;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Click-away, behind the menu — a dropdown that only closes on a second
          click of its own trigger feels stuck. */}
      <button
        type="button"
        aria-label="Close product list"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
      />
      {/* Taller than a one-line list needs: each row carries its variants under
          the name, so max-h-56 would have shown three products and half of a
          fourth. */}
      <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/15 dark:bg-[#1b2436]">
        <div className="sticky top-0 border-b border-gray-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1b2436]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#9aa6bd]"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]"
            />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-6 text-center text-xs text-gray-400 dark:text-[#9aa6bd]">
      {children}
    </p>
  );
}

/** One product, by id — the free item a "Free item" offer gives away. */
export function ProductIdPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const { rows, isLoading } = useRows();
  const labelFor = useLabelFor();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Resolved rather than looked up among the rows: an offer stored against a
  // whole product before variants were saved has no row of its own, and it
  // should read as its product name, not as a deleted item.
  const selectedLabel = labelFor(value);
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((row) => row.search.includes(needle))
    : rows;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} flex items-center justify-between px-3.5 text-left`}
      >
        <span
          className={
            selectedLabel ? "truncate" : "text-gray-400 dark:text-[#7b869b]"
          }
        >
          {/* An id with nothing behind it — deleted from the menu since the
              offer was made — says so rather than showing a blank field. */}
          {selectedLabel ??
            (value ? "Item no longer on the menu" : placeholder)}
        </span>
        <ChevronsUpDown
          size={15}
          className="ml-2 shrink-0 text-gray-400 dark:text-[#9aa6bd]"
        />
      </button>

      {open && (
        <Panel query={query} onQuery={setQuery} onClose={() => setOpen(false)}>
          {isLoading ? (
            <Empty>Loading items...</Empty>
          ) : filtered.length === 0 ? (
            <Empty>No items match “{query}”</Empty>
          ) : (
            filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  onChange(row.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <RowLabel row={row} />
                {row.id === value && (
                  <Check
                    size={14}
                    className="shrink-0 text-blue-600 dark:text-blue-300"
                  />
                )}
              </button>
            ))
          )}
        </Panel>
      )}
    </div>
  );
}

/** Several products, by id — what a BOGO applies to. */
export function ProductIdMultiPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const { rows, isLoading } = useRows();
  const labelFor = useLabelFor();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const picked = useMemo(() => new Set(value), [value]);
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((row) => row.search.includes(needle))
    : rows;

  const toggle = (id: string) =>
    onChange(
      picked.has(id) ? value.filter((kept) => kept !== id) : [...value, id],
    );

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`${FIELD} flex items-center justify-between px-3.5 text-left`}
        >
          <span
            className={
              value.length > 0
                ? "truncate"
                : "text-gray-400 dark:text-[#7b869b]"
            }
          >
            {value.length === 0
              ? placeholder
              : `${value.length} item${value.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronsUpDown
            size={15}
            className="ml-2 shrink-0 text-gray-400 dark:text-[#9aa6bd]"
          />
        </button>

        {open && (
          <Panel
            query={query}
            onQuery={setQuery}
            onClose={() => setOpen(false)}
          >
            {isLoading ? (
              <Empty>Loading items...</Empty>
            ) : filtered.length === 0 ? (
              <Empty>No items match “{query}”</Empty>
            ) : (
              filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  // The list stays open: picking several items one dropdown at a
                  // time is what a multi-select exists to avoid.
                  onClick={() => toggle(row.id)}
                  aria-pressed={picked.has(row.id)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <RowLabel row={row} />
                  {picked.has(row.id) && (
                    <Check
                      size={14}
                      className="shrink-0 text-blue-600 dark:text-blue-300"
                    />
                  )}
                </button>
              ))
            )}
          </Panel>
        )}
      </div>

      {/* What is chosen, spelled out under the closed field — "3 items
          selected" is a count, not an answer to "which three?". */}
      {value.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[12px] text-[#3c4043] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]"
            >
              {labelFor(id) ?? "Removed item"}
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => toggle(id)}
                className="cursor-pointer text-gray-400 transition-colors hover:text-[#3c4043] dark:text-[#9aa6bd] dark:hover:text-[#e8ecf4]"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
