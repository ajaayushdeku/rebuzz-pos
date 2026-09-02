"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

import { useOfferForm } from "@/providers/OfferFormContext";
import { useProductsList } from "@/hooks/useProductsList";
import OfferStepCard from "./OfferStepCard";
import { DEAL_KINDS, SCOPES, dealById } from "./offerDealConfig";

const FIELD =
  "h-11 w-full rounded-xl border border-gray-200 bg-white text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const LABEL = "mb-1.5 block text-[13px] font-medium text-gray-700";

/**
 * A searchable product dropdown.
 *
 * Two fields on this step pick a product for different reasons — the item a
 * deal applies to, and the item given away by a free-item deal — so it takes
 * its value and setter rather than reading the form itself.
 */
function ProductPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const { data: products = [], isLoading } = useProductsList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = products.find((p) => p.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
  }, [products, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} flex items-center justify-between px-3.5 text-left`}
      >
        <span className={selected ? "truncate text-gray-900" : "text-gray-400"}>
          {selected ? selected.name : placeholder}
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
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="truncate text-gray-700">{p.name}</span>
                  {p.id === value && (
                    <Check size={14} className="shrink-0 text-blue-600" />
                  )}
                </button>
              ))
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
  const needsSentence =
    form.discountKind === "custom" || form.discountKind === "combo";

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
      title="The deal"
      subtitle="Choose what discount or freebie your customers receive."
      icon={Tag}
      iconBg="bg-emerald-100"
      iconColor="text-emerald-600"
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

      {/* A custom offer has no shape of its own, and a combo's shape lives in
          the wording ("2 momos + a Coke"), so both are described in a
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
            onChange={(id) => updateField("freeItemId", id)}
            placeholder="Choose the free item..."
          />
        </div>
      )}

      {/* Applies to */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className={LABEL}>Applies to</p>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((scope) => {
            const active = form.itemScope === scope.id;
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => updateField("itemScope", scope.id)}
                aria-pressed={active}
                className={`h-8 cursor-pointer rounded-lg px-4 text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-emerald-700 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>

        {form.itemScope === "category" && (
          <div className="mt-4 max-w-sm">
            <label className={LABEL}>Category name</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="e.g. MoMo &amp; Noodles"
              className={`${FIELD} px-3.5`}
            />
          </div>
        )}

        {form.itemScope === "specific" && (
          <div className="mt-4 max-w-sm">
            <label className={LABEL}>Which item?</label>
            <ProductPicker
              value={form.productId}
              onChange={(id) => updateField("productId", id)}
              placeholder="Choose an item..."
            />
          </div>
        )}
      </div>
    </OfferStepCard>
  );
}
