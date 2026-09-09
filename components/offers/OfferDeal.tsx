"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Lock,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useProductsList } from "@/hooks/useProductsList";
import OfferStepCard from "./OfferStepCard";
import { AUDIENCES, DEAL_KINDS, dealById } from "./offerDealConfig";
import { getVariants, variantLabel } from "@/lib/productVariants";
import { Product } from "@/lib/types/product";

const FIELD =
  "h-11 w-full rounded-xl border border-gray-200 bg-white text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const LABEL = "mb-1.5 block text-[13px] font-medium text-gray-700";

type PickerRow = {
  key: string;
  productId: string;
  variantId: string | null;
  label: string;
  search: string;
  available: boolean;
};

const toRows = (products: Product[]): PickerRow[] => {
  return products.flatMap((product): PickerRow[] => {
    const variants = getVariants(product);

    if (variants.length === 0) {
      return [
        {
          key: product.id,
          productId: product.id,
          variantId: null,
          label: product.name,
          search: product.name.toLowerCase(),
          available: true,
        },
      ];
    }

    return variants.map((variant) => {
      const label = `${product.name} · ${variantLabel(variant)}`;
      return {
        key: `${product.id}:${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        label,
        search: label.toLowerCase(),
        available: variant.isAvailable && (variant.inStock ?? 0) > 0,
      };
    });
  });
};

function ProductPicker({
  value,
  variantValue,
  onChange,
  placeholder,
}: {
  value: string;
  variantValue?: string | null;
  onChange: (id: string, variantId: string | null) => void;
  placeholder: string;
}) {
  const { data: products = [], isLoading } = useProductsList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => toRows(products), [products]);

  const selected = rows.find(
    (r) => r.productId === value && r.variantId === (variantValue ?? null),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.search.includes(q)) : rows;
  }, [rows, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} flex items-center justify-between px-3.5 text-left`}
      >
        <span className={selected ? "truncate text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown size={15} className="ml-2 shrink-0 text-gray-400" />
      </button>

      {open && (
        <>
          {/* Click-away, behind the menu — a dropdown that only closes on a
              second click of its own trigger feels stuck. */}
          <button
            type="button"
            aria-label="Close product list"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="sticky top-0 border-b border-gray-100 bg-white px-3 py-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                Loading items...
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                No items match “{query}”
              </p>
            ) : (
              filtered.map((row) => {
                return (
                  <button
                    key={row.key}
                    type="button"
                    disabled={!row.available}
                    onClick={() => {
                      onChange(row.productId, row.variantId);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="truncate text-gray-700">{row.label}</span>
                    {/* {(row.variants?.length ?? 0) > 1 && (
                      <span className="text-xs text-gray-400">
                        {row?.variants?.length} variants
                      </span>
                    )} */}

                    {row.variantId && row.variantId === variantValue && (
                      <Check size={14} className="shrink-0 text-blue-600" />
                    )}
                    {!row.variantId && row.productId === value && (
                      <Check size={14} className="shrink-0 text-blue-600" />
                    )}
                    {!row.available && (
                      <span className="shrink-0 text-[11px] text-gray-400">
                        Unavailable
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Step 1 — what the customer receives.
 *
 * Every other step, and the whole preview, reads off the choice made here, so
 * this is the only step that is always open and never optional.
 */
export default function OfferDeal() {
  const { form, updateField } = useOfferForm();
  const selected = dealById(form.discountKind);
  const needsSentence = form.discountKind === "custom";

  const chooseDeal = (id: string) => {
    const deal = dealById(id);
    if (!deal) return;
    updateField("discountKind", id);
    updateField("discountType", deal.discountType);
    // A deal with no amount of its own must not inherit the last one's, or a
    // BOGO would quietly carry "15" into the payload.
    if (!deal.value) updateField("discount", 0);
  };

  return (
    <OfferStepCard
      step={1}
      title="The Deal"
      subtitle="Choose what discount or freebie your customers receive."
      icon={Tag}
      accent="emerald"
      action={
        <button
          type="button"
          onClick={() => chooseDeal("custom")}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <Plus size={15} />
          Add custom deal
        </button>
      }
    >
      {/* Deal grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DEAL_KINDS.map((deal) => {
          const active = form.discountKind === deal.id;
          return (
            <button
              key={deal.id}
              type="button"
              onClick={() => chooseDeal(deal.id)}
              aria-pressed={active}
              className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                active
                  ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <span className="text-xl leading-none">{deal.icon}</span>
              <p className="mt-2.5 text-[13px] font-bold text-gray-800">
                {deal.title}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {deal.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* What this particular deal needs. Each block is rendered only for the
          deal that uses it, so the step never shows a field the merchant has
          no reason to fill. */}
      {selected?.value && (
        <div className="mt-6 max-w-sm">
          <label className={LABEL}>
            {selected.value.label} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            {selected.value.prefix && (
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {selected.value.prefix}
              </span>
            )}
            <input
              type="number"
              min={0}
              value={form.discount || ""}
              onChange={(e) => updateField("discount", Number(e.target.value))}
              placeholder={selected.value.placeholder}
              className={`${FIELD} tabular-nums ${
                selected.value.prefix ? "pl-10" : "pl-3.5"
              } ${selected.value.suffix ? "pr-9" : "pr-3.5"}`}
            />
            {selected.value.suffix && (
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {selected.value.suffix}
              </span>
            )}
          </div>
        </div>
      )}

      {/* A custom offer has no shape of its own, so it is described in a
          sentence. Set apart from the plain fields because this one is the
          headline the customer actually reads. */}
      {needsSentence && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
          <label className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
            <Sparkles size={14} className="text-emerald-600" />
            Custom deal title or offer sentence{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.customDeal}
            onChange={(e) => updateField("customDeal", e.target.value)}
            placeholder="e.g. Free delivery on your first order over 1,000"
            className="h-11 w-full rounded-lg border border-emerald-300 bg-white px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="mt-2 text-[11px] text-gray-500">
            Type the exact deal phrase as you want customers to read it.
          </p>
        </div>
      )}

      {form.discountKind === "free-item" && (
        <div className="mt-6 max-w-sm">
          <label className={LABEL}>
            Which item is free? <span className="text-red-500">*</span>
          </label>
          <ProductPicker
            value={form.freeItemId}
            variantValue={form.freeItemVariantId || null}
            onChange={(id, variantId) => {
              updateField("freeItemId", id);
              updateField("freeItemVariantId", variantId ?? undefined);
            }}
            placeholder="Choose the free item..."
          />
        </div>
      )}

      {/* Who it's for — locked.
          Shown rather than hidden so the capability is discoverable and the
          step does not change shape when it lands, but dimmed and inert
          throughout: opacity on the group, `cursor-not-allowed`, every control
          `disabled` and out of the tab order, and `aria-hidden` so it is not
          announced as something that can be chosen. Same treatment as the
          scheduled reminders on the invoice detail page. */}
      <div
        aria-hidden
        className="mt-6 cursor-not-allowed border-t border-gray-100 pt-5 opacity-50"
      >
        <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-gray-500">
          <Lock size={12} className="shrink-0" />
          Who can use this
        </p>

        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled
              tabIndex={-1}
              className="h-8 cursor-not-allowed rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-500"
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="mt-2.5 text-[12px] text-gray-400">
          Coming soon — offers currently apply to every customer.
        </p>
      </div>
    </OfferStepCard>
  );
}
