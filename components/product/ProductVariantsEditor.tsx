"use client";

import { useState } from "react";
import { Plus, Trash2, X, Info } from "lucide-react";

export interface VariantOption {
  id: string;
  title: string;
  values: string[];
}

export interface VariantRow {
  /** optionValues joined — stable identity across regeneration. */
  key: string;
  /** Existing variant `_id` when editing; absent for newly generated rows. */
  id?: string;
  optionValues: string[];
  isAvailable: boolean;
  costPrice: number;
  price: number;
  inStock: number;
  lowStock: number;
}

export const MAX_OPTIONS = 3;
export const MAX_VALUES = 10;
/** 3 options x 10 values is 1,000 combinations — past this it's unusable. */
export const MAX_ROWS = 200;

export const rowKey = (optionValues: string[]) => optionValues.join("/");

/** An option only counts once it has a name and something to choose from. */
export const usableOptions = (options: VariantOption[]) =>
  options.filter((o) => o.title.trim() && o.values.length > 0);

/* Every combination of the option values, in option order. */
export function buildVariantRows(
  options: VariantOption[],
  existing: VariantRow[] = [],
): VariantRow[] {
  const usable = options.filter((o) => o.values.length > 0);
  if (usable.length === 0) return [];

  const byKey = new Map(existing.map((r) => [r.key, r]));

  let combos: string[][] = [[]];
  for (const option of usable) {
    const next: string[][] = [];
    for (const combo of combos) {
      for (const value of option.values) {
        next.push([...combo, value]);
        if (next.length >= MAX_ROWS) break;
      }
      if (next.length >= MAX_ROWS) break;
    }
    combos = next;
  }

  return combos.map((optionValues) => {
    const key = rowKey(optionValues);
    const prior = byKey.get(key);
    return (
      prior ?? {
        key,
        optionValues,
        isAvailable: true,
        costPrice: 0,
        price: 0,
        inStock: 0,
        lowStock: 0,
      }
    );
  });
}

const numberInput =
  "w-full h-8 rounded-lg border border-slate-200 px-2 text-[13px] text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

/** Values are entered as tags — type, press Enter. */
function ValueTags({
  option,
  onChange,
}: {
  option: VariantOption;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    if (option.values.length >= MAX_VALUES) return;
    // Case-insensitive, so "Small" can't sit beside "small".
    if (option.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...option.values, value]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {option.values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-cyan-700 py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-white"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(option.values.filter((v) => v !== value))}
              className="rounded-full p-0.5 text-cyan-100 font-bold transition hover:bg-cyan-200 hover:text-cyan-700"
              aria-label={`Remove ${value}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          // Backspace on an empty field removes the last tag.
          if (e.key === "Backspace" && !draft && option.values.length > 0) {
            onChange(option.values.slice(0, -1));
          }
        }}
        onBlur={commit}
        disabled={option.values.length >= MAX_VALUES}
        placeholder={
          option.values.length >= MAX_VALUES
            ? `${MAX_VALUES} values is the limit`
            : "Type a value, press Enter"
        }
        className="mt-2 h-8 w-full bg-white rounded-lg border border-slate-200 px-2.5 text-[13px] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50"
      />
    </div>
  );
}

/* Step one of the variant flow: the option groups. */
export function VariantOptionsEditor({
  options,
  rows,
  onOptionsChange,
  onRowsChange,
}: {
  options: VariantOption[];
  rows: VariantRow[];
  onOptionsChange: (options: VariantOption[]) => void;
  onRowsChange: (rows: VariantRow[]) => void;
}) {
  const setOptions = (next: VariantOption[]) => {
    onOptionsChange(next);
    onRowsChange(buildVariantRows(next, rows));
  };

  return (
    <div className="space-y-4">
      {/* ── How it works ── */}
      <div className="flex gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <div className="text-[11px] leading-relaxed text-slate-500">
          An option is the attribute — Size, Flavour. Its values are the
          choices. Every combination of values becomes a variant you can price
          and stock separately. Up to {MAX_OPTIONS} options, {MAX_VALUES} values
          each.
        </div>
      </div>

      {/* ── Options ── */}
      <div className="space-y-3">
        {options.map((option, i) => (
          <div
            key={option.id}
            className="rounded-xl border border-slate-200 bg-slate-50/40  p-3.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Option {i + 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  setOptions(options.filter((o) => o.id !== option.id))
                }
                className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label={`Remove option ${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              value={option.title}
              onChange={(e) =>
                setOptions(
                  options.map((o) =>
                    o.id === option.id ? { ...o, title: e.target.value } : o,
                  ),
                )
              }
              placeholder="Option name, e.g. Size"
              className="mb-2.5 h-9 w-full mb-2 rounded-lg bg-white border border-slate-200 px-3 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />

            <ValueTags
              option={option}
              onChange={(values) =>
                setOptions(
                  options.map((o) =>
                    o.id === option.id ? { ...o, values } : o,
                  ),
                )
              }
            />
          </div>
        ))}

        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={() =>
              setOptions([
                ...options,
                { id: crypto.randomUUID(), title: "", values: [] },
              ])
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-[13px] font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {options.length === 0 ? "Add an option" : "Add another option"}
          </button>
        )}
      </div>
    </div>
  );
}

/* Step two of the variant flow: a card per generated combination. */
export function VariantRowsEditor({
  options,
  rows,
  currencySymbol,
  showStock,
  errors = {},
  onRowsChange,
}: {
  options: VariantOption[];
  rows: VariantRow[];
  currencySymbol: string;
  showStock: boolean;
  errors?: Record<string, string>;
  onRowsChange: (rows: VariantRow[]) => void;
}) {
  const [bulk, setBulk] = useState({
    costPrice: "",
    price: "",
    inStock: "",
    lowStock: "",
  });

  const updateRow = (key: string, patch: Partial<VariantRow>) =>
    onRowsChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const applyBulk = () => {
    const patch: Partial<VariantRow> = {};
    if (bulk.costPrice !== "") patch.costPrice = Number(bulk.costPrice);
    if (bulk.price !== "") patch.price = Number(bulk.price);
    if (showStock && bulk.inStock !== "") patch.inStock = Number(bulk.inStock);
    if (showStock && bulk.lowStock !== "")
      patch.lowStock = Number(bulk.lowStock);
    if (Object.keys(patch).length === 0) return;

    onRowsChange(rows.map((r) => ({ ...r, ...patch })));
    setBulk({ costPrice: "", price: "", inStock: "", lowStock: "" });
  };

  const atRowCap = rows.length >= MAX_ROWS;

  /** Money always; stock only while the product tracks it. */
  const FIELDS = [
    { field: "costPrice", label: "Cost", tone: "amber", money: true },
    { field: "price", label: "Price", tone: "emerald", money: true },
    ...(showStock
      ? ([
          { field: "inStock", label: "In stock", tone: "blue", money: false },
          { field: "lowStock", label: "Low stock", tone: "blue", money: false },
        ] as const)
      : []),
  ] as const;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
        <p className="text-[13px] font-medium text-slate-500">
          No combinations yet
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Go back and give an option a name and at least one value.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── What these came from ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 px-3.5 py-3">
        {usableOptions(options).map((option) => (
          <div key={option.id} className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              {option.title}
            </span>
            <span className="text-[11px] capitalize text-slate-600">
              {option.values.join(" · ")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Variants
        </h4>
        <span className="text-[11px] text-slate-400">
          {rows.length} combination{rows.length > 1 ? "s" : ""}
          {atRowCap && ` · capped at ${MAX_ROWS}`}
        </span>
      </div>

      {/* Set every row at once — with nine or more, typing the same cost
          into each is the slowest part of the job. */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="mb-2 text-[11px] font-medium text-slate-500">
          Set all rows
        </p>
        <div className="flex flex-wrap items-end gap-2">
          {FIELDS.map(({ field, label }) => (
            <div key={field} className="min-w-0 flex-1">
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400">
                {label}
              </label>
              <input
                type="number"
                min={0}
                value={bulk[field]}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, [field]: e.target.value }))
                }
                placeholder="—"
                className={`${numberInput} bg-white`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={applyBulk}
            className="h-8 shrink-0 rounded-lg bg-slate-800 px-3 text-[12px] font-semibold text-white transition hover:bg-slate-900"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`rounded-xl border p-3 transition ${
              errors[row.key]
                ? "border-rose-300 bg-rose-50/40"
                : row.isAvailable
                  ? "border-slate-200 bg-slate-50/40 "
                  : "border-slate-200 bg-slate-50/60 opacity-70"
            }`}
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3.5 w-1 shrink-0 rounded-full bg-cyan-500"
                  aria-hidden="true"
                />
                <span className="truncate text-[13px] font-semibold capitalize text-slate-800">
                  {row.optionValues.join(" · ")}
                </span>
              </div>

              <label className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {row.isAvailable ? "Available" : "Hidden"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateRow(row.key, { isAvailable: !row.isAvailable })
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    row.isAvailable ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                  aria-label={`${row.isAvailable ? "Hide" : "Show"} ${row.optionValues.join(" ")}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      row.isAvailable ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            <div
              className={`grid gap-2.5 ${
                showStock ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
              }`}
            >
              {FIELDS.map(({ field, label, tone, money }) => (
                <div key={field}>
                  <label
                    className={`mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] ${
                      tone === "amber"
                        ? "text-amber-700"
                        : tone === "emerald"
                          ? "text-emerald-700"
                          : "text-blue-700"
                    }`}
                  >
                    {label}
                  </label>
                  <div className="relative">
                    {money && (
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                        {currencySymbol}
                      </span>
                    )}
                    <input
                      type="number"
                      min={0}
                      value={row[field]}
                      onChange={(e) =>
                        updateRow(row.key, {
                          [field]: Number(e.target.value),
                        } as Partial<VariantRow>)
                      }
                      className={`${numberInput} bg-white ${money ? "pl-7" : ""}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {errors[row.key] && (
              <p className="mt-2 text-[11px] text-rose-600">
                {errors[row.key]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
