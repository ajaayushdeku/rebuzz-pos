"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Lock,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import { useOfferForm, type OfferItem } from "@/providers/OfferFormContext";
import { useCurrency } from "@/providers/CurrencyContext";
import { useProductsList } from "@/hooks/useProductsList";
import OfferStepCard from "./OfferStepCard";
import { AUDIENCES, DEAL_KINDS, autoCopy, dealById } from "./offerDealConfig";
import { getVariants, productLabel, variantLabel } from "@/lib/productVariants";
import { Product } from "@/lib/types/product";

const FIELD =
  "h-11 w-full rounded-xl border border-[#dadce0] bg-white dark:bg-white/5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15";

const LABEL =
  "mb-1.5 block text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]";

/**
 * A free item to name in a suggested title.
 *
 * Passed when the item is about to change, because the title names the variant
 * and reading it off the form would label the new product with the old size.
 */
type FreeItem = { id: string; variantId?: string };

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
        <span
          className={
            selected
              ? "truncate text-[#3c4043] dark:text-[#e8ecf4]"
              : "text-[#9aa0a6] dark:text-[#9aa6bd]"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown
          size={15}
          className="ml-2 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
        />
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
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#dadce0] bg-white dark:bg-[#1b2436] shadow-lg dark:border-white/15">
            <div className="sticky top-0 border-b border-[#e8eaed] bg-white dark:bg-[#1b2436] px-3 py-2 dark:border-white/10">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full rounded-lg border border-[#dadce0] py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/15"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                Loading items...
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
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
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-[#f8f9fa] dark:hover:bg-white/5"
                  >
                    <span className="truncate text-[#3c4043] dark:text-[#e8ecf4]">
                      {row.label}
                    </span>
                    {/* {(row.variants?.length ?? 0) > 1 && (
                      <span className="text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                        {row?.variants?.length} variants
                      </span>
                    )} */}

                    {row.variantId && row.variantId === variantValue && (
                      <Check
                        size={14}
                        className="shrink-0 text-blue-600 dark:text-blue-300"
                      />
                    )}
                    {!row.variantId && row.productId === value && (
                      <Check
                        size={14}
                        className="shrink-0 text-blue-600 dark:text-blue-300"
                      />
                    )}
                    {!row.available && (
                      <span className="shrink-0 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
 * The same list, for a deal that applies to more than one item.
 *
 * Separate from `ProductPicker` rather than a `multiple` flag on it: a
 * single-select closes on choosing and shows one label, a multi-select stays
 * open, ticks rows and carries chips underneath. Sharing the body would mean a
 * branch at every one of those points.
 */
function ProductMultiPicker({
  value,
  onChange,
  placeholder,
}: {
  value: OfferItem[];
  onChange: (items: OfferItem[]) => void;
  placeholder: string;
}) {
  const { data: products = [], isLoading } = useProductsList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => toRows(products), [products]);

  /** Row keys, so a row can tell whether it is ticked in one lookup. */
  const picked = useMemo(
    () =>
      new Set(
        value.map((item) =>
          item.variantId
            ? `${item.productId}:${item.variantId}`
            : item.productId,
        ),
      ),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.search.includes(q)) : rows;
  }, [rows, query]);

  const toggle = (row: PickerRow) => {
    onChange(
      picked.has(row.key)
        ? value.filter(
            (item) =>
              !(
                item.productId === row.productId &&
                item.variantId === row.variantId
              ),
          )
        : [...value, { productId: row.productId, variantId: row.variantId }],
    );
  };

  // Chips are labelled from `rows`, so an item that has since been deleted from
  // the menu simply stops being named rather than showing a raw id.
  const chips = value
    .map((item) => {
      const key = item.variantId
        ? `${item.productId}:${item.variantId}`
        : item.productId;
      return { key, label: rows.find((r) => r.key === key)?.label };
    })
    .filter((chip): chip is { key: string; label: string } => !!chip.label);

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
                ? "truncate text-[#3c4043] dark:text-[#e8ecf4]"
                : "text-[#9aa0a6] dark:text-[#9aa6bd]"
            }
          >
            {value.length === 0
              ? placeholder
              : `${value.length} item${value.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronsUpDown
            size={15}
            className="ml-2 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]"
          />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close product list"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#dadce0] bg-white dark:bg-[#1b2436] shadow-lg dark:border-white/15">
              <div className="sticky top-0 border-b border-[#e8eaed] bg-white dark:bg-[#1b2436] px-3 py-2 dark:border-white/10">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
                  />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items..."
                    className="w-full rounded-lg border border-[#dadce0] py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/15"
                  />
                </div>
              </div>

              {isLoading ? (
                <p className="px-3 py-6 text-center text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                  Loading items...
                </p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                  No items match “{query}”
                </p>
              ) : (
                filtered.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    disabled={!row.available}
                    // The list stays open: picking several items one dropdown at
                    // a time is the thing a multi-select exists to avoid.
                    onClick={() => toggle(row)}
                    aria-pressed={picked.has(row.key)}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
                  >
                    <span className="truncate text-[#3c4043] dark:text-[#e8ecf4]">
                      {row.label}
                    </span>
                    {picked.has(row.key) && (
                      <Check
                        size={14}
                        className="shrink-0 text-blue-600 dark:text-blue-300"
                      />
                    )}
                    {!row.available && (
                      <span className="shrink-0 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                        Unavailable
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* What is chosen, spelled out under the closed field — "3 items
          selected" is a count, not an answer to "which three?". */}
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-2.5 py-1 text-[12px] text-[#3c4043] dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4]"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label}`}
                onClick={() =>
                  onChange(
                    value.filter(
                      (item) =>
                        (item.variantId
                          ? `${item.productId}:${item.variantId}`
                          : item.productId) !== chip.key,
                    ),
                  )
                }
                className="cursor-pointer text-[#9aa0a6] transition-colors hover:text-[#3c4043] dark:text-[#9aa6bd] dark:hover:text-[#e8ecf4]"
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

/**
 * Step 1 — what the customer receives.
 *
 * Every other step, and the whole preview, reads off the choice made here, so
 * this is the only step that is always open and never optional.
 */
export default function OfferDeal() {
  const { form, updateField, patchForm } = useOfferForm();
  const { currency } = useCurrency();
  const { data: products = [] } = useProductsList();
  const selected = dealById(form.discountKind);

  /** The sentence a deal writes for itself, given what it has been told. */
  const suggestedTitle = (
    dealId: string,
    amount: number,
    freeItem?: FreeItem,
  ) =>
    autoCopy({
      dealId,
      amount,
      freeItemName: productLabel(
        products,
        freeItem ? freeItem.id : form.freeProduct,
        freeItem ? freeItem.variantId : form.freeProductVariantId,
      ),
      currency: currency.symbol,
    }).headline;

  /**
   * Keep the title in step with the deal until the merchant takes it over.
   *
   * There is no "has it been edited" flag: the box still holds the suggestion
   * for the *current* settings, or it does not, and that is the same question.
   * So a changed amount rewrites "Get 10% off your order" to "Get 15% off your
   * order", but leaves "Dashain madness" alone.
   */
  const retitle = (dealId: string, amount: number, freeItem?: FreeItem) => {
    const mine = suggestedTitle(form.discountKind, form.value);
    return form.name === "" || form.name === mine
      ? { name: suggestedTitle(dealId, amount, freeItem) }
      : {};
  };

  const chooseDeal = (id: string) => {
    const deal = dealById(id);
    if (!deal) return;
    // A deal with no amount of its own must not inherit the last one's, or a
    // BOGO would quietly carry "15" into the payload. The item list goes the
    // same way: only a BOGO names the items it applies to, and a percentage
    // deal left holding them would come off those items alone.
    const amount = deal.value ? form.value : 0;
    patchForm({
      discountKind: id,
      type: deal.discountType,
      value: amount,
      ...(deal.discountType === "bogo" ? {} : { items: [] }),
      ...retitle(id, amount),
    });
  };

  return (
    <OfferStepCard
      step={1}
      title="The Deal"
      subtitle="Choose what discount or freebie your customers receive."
      icon={Tag}
      accent="emerald"
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
                  ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30 dark:bg-emerald-400/10"
                  : "border-[#e3e3e3] bg-white hover:bg-[#f8f9fa] dark:border-white/10 dark:bg-[#161d2e] dark:hover:bg-white/10"
              }`}
            >
              <span className="text-xl leading-none">{deal.icon}</span>
              <p className="mt-2.5 text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                {deal.title}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
            {selected.value.label}{" "}
            <span className="text-red-500 dark:text-red-300">*</span>
          </label>
          <div className="relative">
            {selected.value.prefix && (
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9aa0a6] dark:text-[#9aa6bd]">
                {selected.value.prefix}
              </span>
            )}
            <input
              type="number"
              min={0}
              value={form.value || ""}
              onChange={(e) => {
                const amount = Number(e.target.value);
                patchForm({
                  value: amount,
                  ...retitle(form.discountKind, amount),
                });
              }}
              placeholder={selected.value.placeholder}
              className={`${FIELD} tabular-nums ${
                selected.value.prefix ? "pl-10" : "pl-3.5"
              } ${selected.value.suffix ? "pr-9" : "pr-3.5"}`}
            />
            {selected.value.suffix && (
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9aa0a6] dark:text-[#9aa6bd]">
                {selected.value.suffix}
              </span>
            )}
          </div>
        </div>
      )}

      {/* A BOGO has no amount, so what it needs instead is the items it runs
          on: "buy one get one" on everything on the menu is not an offer, it is
          half price. Variants are listed as their own rows, but the POS stores
          products, so two sizes of one momo reach it as one id. */}
      {form.discountKind === "bogo" && (
        <div className="mt-6 max-w-sm">
          <label className={LABEL}>
            Which items is this on?{" "}
            <span className="text-red-500 dark:text-red-300">*</span>
          </label>
          <ProductMultiPicker
            value={form.items}
            onChange={(items) => updateField("items", items)}
            placeholder="Choose the items..."
          />
        </div>
      )}

      {form.discountKind === "free-item" && (
        <div className="mt-6 max-w-sm">
          <label className={LABEL}>
            Which item is free?{" "}
            <span className="text-red-500 dark:text-red-300">*</span>
          </label>
          <ProductPicker
            value={form.freeProduct}
            variantValue={form.freeProductVariantId || null}
            onChange={(id, variantId) => {
              patchForm({
                freeProduct: id,
                freeProductVariantId: variantId ?? undefined,
                ...retitle(form.discountKind, form.value, {
                  id,
                  variantId: variantId ?? undefined,
                }),
              });
            }}
            placeholder="Choose the free item..."
          />
        </div>
      )}

      {/* The title, last and set apart, because it is the one field here the
          customer actually reads — everything above only decides what it says.
          It arrives already written, so the offer has a headline even if this
          is never touched, and the preview shows whatever is in this box. */}
      {selected && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-400/25 dark:bg-emerald-400/10">
          <label className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
            <Sparkles
              size={14}
              className="text-emerald-600 dark:text-emerald-300"
            />
            Offer title
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder={suggestedTitle(form.discountKind, form.value)}
            className="h-11 w-full rounded-lg border border-emerald-300 bg-white dark:bg-white/5 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-400/40"
          />
          <p className="mt-2 text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
            This is the headline customers read, and the name you will find the
            offer under. Edit it and it stops following the deal.
          </p>
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
        className="mt-6 cursor-not-allowed border-t border-[#e8eaed] pt-5 opacity-50 dark:border-white/10"
      >
        <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#5f6368] dark:text-[#a9b4c7]">
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
              className="h-8 cursor-not-allowed rounded-lg border border-[#dadce0] bg-white dark:bg-white/5 px-4 text-[13px] font-semibold text-[#5f6368] dark:border-white/15 dark:text-[#a9b4c7]"
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="mt-2.5 text-[12px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Coming soon — offers currently apply to every customer.
        </p>
      </div>
    </OfferStepCard>
  );
}
