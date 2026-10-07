"use client";

import {
  CalendarDays,
  Gift,
  Loader2,
  SlidersHorizontal,
  Tag,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { toBsLabel } from "@/lib/nepaliDate";
import { useCurrency } from "@/providers/CurrencyContext";
import { hasAmount } from "@/services/apiOffers.client";
import type {
  DiscountType,
  Offer,
  OfferFormData,
} from "@/services/apiOffers.client";
import {
  DAY_CHIPS,
  TYPE_LABEL,
  toDateInput,
  toTimeInput,
} from "./offerDisplay";
import { ProductIdMultiPicker, ProductIdPicker } from "./ProductIdPicker";

/**
 * Every field the POS stores for an offer, in the builder's own order.
 *
 * The same four groups as the create form — the deal, its conditions, when it
 * runs, its code — so a merchant who built the offer recognises the screen that
 * changes it. Flattened into one dialog rather than four steps, because editing
 * is finding one field, not being walked through fourteen.
 */
export type OfferEditForm = {
  name: string;
  type: DiscountType;
  value: number;
  products: string[];
  freeProduct: string;
  minSpend: number;
  perCustomerLimit: number;
  startDate: string;
  endDate: string;
  days: number[];
  startTime: string;
  endTime: string;
  code: string;
  enabled: boolean;
};

export const EMPTY_EDIT_FORM: OfferEditForm = {
  name: "",
  type: "percent",
  value: 0,
  products: [],
  freeProduct: "",
  minSpend: 0,
  perCustomerLimit: 0,
  startDate: "",
  endDate: "",
  days: [],
  startTime: "",
  endTime: "",
  code: "",
  enabled: true,
};

/**
 * A stored offer as the form holds it.
 *
 * Dates and times go through the input normalisers: the POS answers with full
 * ISO timestamps, and a `<input type="date">` shows nothing at all for one of
 * those — which is why the dates looked empty on an offer that had them.
 */
export function toEditForm(offer: Offer): OfferEditForm {
  return {
    name: offer.name ?? "",
    type: offer.type,
    value: offer.value ?? 0,
    products: offer.products ?? [],
    freeProduct: offer.freeProduct ?? "",
    minSpend: offer.minSpend ?? 0,
    perCustomerLimit: offer.perCustomerLimit ?? 0,
    startDate: toDateInput(offer.startDate),
    endDate: toDateInput(offer.endDate),
    days: offer.days ?? [],
    startTime: toTimeInput(offer.startTime),
    endTime: toTimeInput(offer.endTime),
    code: offer.code ?? "",
    enabled: offer.enabled,
  };
}

/**
 * The form as the POS wants it.
 *
 * A field only travels if the chosen type has any use for it: a percentage deal
 * sends no `products` and no `freeProduct`, a BOGO sends no `value`. Otherwise an
 * offer edited from a free item into a discount would keep pointing at the item
 * it used to give away, and the POS would hold two contradictory descriptions of
 * the same offer.
 *
 * Zeroes and empty strings become `undefined` for the same reason as in the
 * builder — absent means "no limit", 0 means something else entirely — and
 * `JSON.stringify` drops undefined keys, so those never reach the API.
 */
export function toUpdatePayload(form: OfferEditForm): OfferFormData {
  return {
    name: form.name.trim(),
    type: form.type,
    value: hasAmount(form.type) && form.value > 0 ? form.value : undefined,
    products:
      form.type === "bogo" && form.products.length > 0
        ? form.products
        : undefined,
    freeProduct:
      form.type === "freeItem" && form.freeProduct
        ? form.freeProduct
        : undefined,
    minSpend: form.minSpend > 0 ? form.minSpend : undefined,
    perCustomerLimit:
      form.perCustomerLimit > 0 ? form.perCustomerLimit : undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    days:
      form.days.length > 0 ? [...form.days].sort((a, b) => a - b) : undefined,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    code: form.code.trim() || undefined,
    enabled: form.enabled,
  };
}

/**
 * Changing the type drops what the new one cannot use.
 *
 * The same rule as picking a different card in the builder: a BOGO's item list
 * must not ride along into a percentage deal, where the discount would come off
 * those items alone, and an amount must not survive into a deal that has none.
 */
export function applyTypeChange(
  form: OfferEditForm,
  type: DiscountType,
): OfferEditForm {
  return {
    ...form,
    type,
    value: hasAmount(type) ? form.value : 0,
    products: type === "bogo" ? form.products : [],
    freeProduct: type === "freeItem" ? form.freeProduct : "",
  };
}

/**
 * What is wrong with the edit, or null when it can be saved.
 *
 * One at a time and in the order the fields appear, so the message points at
 * what to look at rather than listing every fault at once.
 */
export function editProblem(form: OfferEditForm): string | null {
  if (!form.name.trim()) return "An offer needs a name";

  if (hasAmount(form.type)) {
    if (form.value <= 0) return "Enter how much comes off";
    if (form.type === "percent" && form.value >= 100) {
      return "A percentage discount has to be under 100";
    }
  }

  if (form.type === "bogo" && form.products.length === 0) {
    return "Pick the items buy one, get one applies to";
  }

  if (form.type === "freeItem" && !form.freeProduct) {
    return "Pick the item customers get free";
  }

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    return "The end date is before the start date";
  }

  if (Boolean(form.startTime) !== Boolean(form.endTime)) {
    return "Set both daily hours, or neither";
  }

  return null;
}

const input =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]";

const label =
  "mb-1.5 block text-[12px] font-medium text-[#3c4043] dark:text-[#e8ecf4]";

const hint = "mt-1.5 text-[11px] text-gray-400 dark:text-[#7b869b]";

/** The deal types, in the order the builder offers them. */
const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as DiscountType[]).map(
  (type) => ({ value: type, label: TYPE_LABEL[type] }),
);

/**
 * The same day in Bikram Sambat, under a date input.
 *
 * A date picker can only speak the Gregorian calendar, and the offers it dates
 * are set against Dashain and Tihar. Printing the BS day underneath is the
 * cheapest way to let someone check they picked the right one without opening a
 * converter.
 */
function BsNote({ value }: { value: string }) {
  const bs = toBsLabel(value);
  if (!bs) return null;

  return (
    <p className="mt-1.5 text-[11px] text-gray-400 dark:text-[#7b869b]">{bs}</p>
  );
}

/** A group of fields, titled the way the builder titles its steps. */
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-100 pt-5 first:border-0 first:pt-0 dark:border-white/10">
      <div className="mb-3.5 flex items-center gap-2.5">
        <Icon
          size={17}
          className="mt-0.5 shrink-0 text-gray-400 dark:text-[#9aa6bd]"
        />
        <div>
          <h4 className="text-[13px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
            {title}
          </h4>
          <p className="text-[11px] text-gray-400 dark:text-[#7b869b]">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

const EditOfferModal = ({
  open,
  onOpenChange,
  offer,
  form,
  onFormChange,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null while nothing is being edited — the modal renders closed. */
  offer: Offer | null;
  form: OfferEditForm;
  onFormChange: (form: OfferEditForm) => void;
  onSave: () => void;
  isPending: boolean;
}) => {
  const { currency } = useCurrency();
  if (!offer) return null;

  const problem = editProblem(form);
  const set = <K extends keyof OfferEditForm>(
    key: K,
    value: OfferEditForm[K],
  ) => onFormChange({ ...form, [key]: value });

  const toggleDay = (day: number) =>
    set(
      "days",
      form.days.includes(day)
        ? form.days.filter((kept) => kept !== day)
        : [...form.days, day],
    );

  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      busy={isPending}
      maxWidth="max-w-2xl"
      title="Edit offer"
      subtitle={`Created ${new Date(offer.createdAt).toLocaleDateString("en-GB")}`}
      icon={Gift}
      iconColor="text-blue-600 dark:text-[#7ba2e3]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      footer={
        <div className="flex items-center justify-between gap-3">
          {/* The reason Save is off, where the eye already is when it does not
              respond — a disabled button with no explanation reads as broken. */}
          <p className="text-[11px] text-red-500 dark:text-[#f87171]">
            {problem ?? ""}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isPending || problem !== null}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <Section
          icon={Tag}
          title="The deal"
          subtitle="What the customer receives, and what it is called."
        >
          <div className="space-y-4">
            <div>
              <label className={label}>Offer title</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Get 15% off your order"
                className={input}
              />
              <p className={hint}>
                The headline customers read, and the name you find it under.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                {/* A plain caption, not a `<label>`: FilterSelect renders a
                    button, which `htmlFor` cannot point at — `ariaLabel` names
                    it instead. */}
                <p className={label}>Deal type</p>
                {/* The app's own select rather than a native one, so it matches
                    the filters on the invoice table — and because a native
                    dropdown cannot be styled to sit level with the inputs
                    beside it across browsers. `preserveCase` because these are
                    sentences: capitalising would give "Buy 1, Get 1". */}
                <FilterSelect
                  value={form.type}
                  options={TYPE_OPTIONS}
                  // Changing this clears whatever the new type cannot use, so
                  // the fields below are never left holding a stale answer.
                  onChange={(next) =>
                    onFormChange(applyTypeChange(form, next as DiscountType))
                  }
                  ariaLabel="Deal type"
                  preserveCase
                  buttonClassName="h-11 pl-3.5 pr-3 text-[13px] text-[#3c4043] dark:text-[#e8ecf4]"
                />
              </div>

              {/* Only the deals that carry a figure get the field — an amount
                  box on a BOGO invites a number it cannot use. */}
              {hasAmount(form.type) && (
                <div>
                  <label className={label}>
                    {form.type === "percent"
                      ? "Discount percentage"
                      : `Discount amount (${currency.symbol})`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={form.value || ""}
                      onChange={(e) => set("value", Number(e.target.value))}
                      placeholder={form.type === "percent" ? "15" : "100"}
                      className={`${input} tabular-nums ${form.type === "percent" ? "pr-9" : ""}`}
                    />
                    {form.type === "percent" && (
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[#9aa6bd]">
                        %
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {form.type === "bogo" && (
              <div>
                <label className={label}>
                  Which items is this on?{" "}
                  <span className="text-red-500 dark:text-red-300">*</span>
                </label>
                <ProductIdMultiPicker
                  value={form.products}
                  onChange={(products) => set("products", products)}
                  placeholder="Choose the items..."
                />
              </div>
            )}

            {form.type === "freeItem" && (
              <div>
                <label className={label}>
                  Which item is free?{" "}
                  <span className="text-red-500 dark:text-red-300">*</span>
                </label>
                <ProductIdPicker
                  value={form.freeProduct}
                  onChange={(id) => set("freeProduct", id)}
                  placeholder="Choose the free item..."
                />
                <p className={hint}>
                  Stored as the product. Which variant is free is not something
                  the POS keeps.
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section
          icon={SlidersHorizontal}
          title="Conditions"
          subtitle="Both optional. Leave blank for no limit."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>
                Minimum order spend ({currency.symbol})
              </label>
              <input
                type="number"
                min={0}
                value={form.minSpend || ""}
                onChange={(e) => set("minSpend", Number(e.target.value))}
                placeholder="No minimum"
                className={`${input} tabular-nums`}
              />
            </div>
            <div>
              <label className={label}>Limit per customer</label>
              <input
                type="number"
                min={0}
                value={form.perCustomerLimit || ""}
                onChange={(e) =>
                  set("perCustomerLimit", Number(e.target.value))
                }
                placeholder="No limit"
                className={`${input} tabular-nums`}
              />
            </div>
          </div>
        </Section>

        <Section
          icon={CalendarDays}
          title="When it runs"
          subtitle="Leave a field empty and that limit does not apply."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Starts</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={input}
                />
                <BsNote value={form.startDate} />
              </div>
              <div>
                <label className={label}>Ends</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  className={input}
                />
                <BsNote value={form.endDate} />
              </div>
            </div>

            <div>
              <label className={label}>Days of the week</label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_CHIPS.map((day) => {
                  const on = form.days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      aria-pressed={on}
                      className={`h-9 w-12 cursor-pointer rounded-lg border text-[12px] font-semibold transition-colors ${
                        on
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-400/15 dark:text-blue-300"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-[#9aa6bd] dark:hover:bg-white/10"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className={hint}>
                {form.days.length === 0 || form.days.length === 7
                  ? "Every day."
                  : "Only on the days picked."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Daily from</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Daily until</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className={input}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          icon={Ticket}
          title="Code and status"
          subtitle="What customers type, and whether it is running."
        >
          <div className="space-y-4">
            <div>
              <label className={label}>Promo code</label>
              <input
                value={form.code}
                // Upper-cased on the way in, as in the builder: a code is read
                // off a receipt and typed back, and "dashain15" failing to match
                // is not a mistake worth letting a customer make.
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="DASHAIN15"
                className={`${input} font-mono tracking-wider sm:max-w-xs`}
              />
            </div>

            <button
              type="button"
              onClick={() => set("enabled", !form.enabled)}
              aria-pressed={form.enabled}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 px-3.5 py-3 text-left transition-colors hover:bg-gray-50 dark:border-white/15 dark:hover:bg-white/5"
            >
              <span>
                <span className="block text-[12px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                  {form.enabled ? "Live" : "Paused"}
                </span>
                <span className="block text-[11px] text-gray-400 dark:text-[#7b869b]">
                  {form.enabled
                    ? "Customers can use this offer now."
                    : "Saved, but not applied at the till."}
                </span>
              </span>
              {/* A switch, not a checkbox: this is a thing being turned on, and
                  the row is the hit target. */}
              <span
                aria-hidden
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  form.enabled
                    ? "bg-emerald-500"
                    : "bg-gray-300 dark:bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    form.enabled ? "left-[1.125rem]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </Section>
      </div>
    </ModalShell>
  );
};

export default EditOfferModal;
