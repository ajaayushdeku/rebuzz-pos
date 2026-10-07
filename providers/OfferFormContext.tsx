"use client";

import { createContext, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";

import { useCreateOffer } from "@/hooks/useOffers";
import { hasAmount } from "@/services/apiOffers.client";
import type { DiscountType, OfferFormData } from "@/services/apiOffers.client";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The deal shapes the API accepts.
 *
 * Re-exported from the service rather than declared again here. A second copy
 * is how `DealKind.discountType` came to hold `"percentage"` and `"fixed"`
 * while the API was being sent `"percent"` and `"amount"`: two unions with the
 * same name and nothing forcing them to agree.
 */
export type { DiscountType };

/**
 * Who an offer is for.
 *
 * Replaces the old item scope: an offer is now targeted by customer rather
 * than by what is on the bill. UI-only — `OfferFormData` has nowhere to put it
 * yet, which is why the audience picker is shown locked.
 */
export type CustomerAudience =
  "all" | "first-time" | "loyalty-tier" | "birthday";

export type ActiveHours = "all-day" | "happy" | "lunch" | "evening";

/**
 * One thing on the menu the offer involves, as the pickers deal in it.
 *
 * The variant is kept even though `OfferFormData.products` is a flat list of
 * product ids, because the picker lists "Momo · Large" as its own row and has
 * to be able to show which row was ticked when it is reopened.
 */
export type OfferItem = { productId: string; variantId: string | null };

/**
 * Everything the builder holds.
 *
 * The fields the POS stores are named exactly as `OfferFormData` names them, so
 * a reader can line the two up without a translation table. The exceptions are
 * deliberate and listed below: `repeatingDays` is `["Fri", "Sat"]` because that
 * is what the day chips in step 3 toggle, while the API wants `[5, 6]`, and the
 * UI-only half describes the offer in ways the POS has no field for yet.
 *
 * `toPayload` is the only place the two meet.
 */
export interface OfferFormState {
  // ── Stored by the POS (same names as OfferFormData) ──

  /**
   * What this offer is called — and, because the POS stores no second line of
   * copy, the headline customers read as well. Step 1 fills it with the
   * sentence the chosen deal writes for itself and lets the merchant edit it.
   *
   * `offerName` still falls back to the occasion or the promo code, so an
   * offer saved before the title was touched is not left nameless.
   */
  name: string;
  /** Which deal was chosen, as the API names it. Set from `DealKind`. */
  type: DiscountType;
  /** How much comes off — a percentage or a rupee amount, by `type`. */
  value: number;
  /** The product a "Free item" deal gives away — what they GET. */
  freeProduct: string;
  /** The bill has to reach this before the offer applies. 0 = no minimum. */
  minSpend: number;
  /** How many times one customer may use it. 0 = no limit. */
  perCustomerLimit: number;
  startDate: string;
  endDate: string;
  /**
   * The window within each day the offer is live, as "HH:MM" 24-hour strings.
   * Both empty means all day, which is why they are strings rather than a
   * pair of numbers with a zero that would read as midnight.
   */
  startTime: string;
  endTime: string;
  /** The promo code customers type at the till. */
  code: string;
  /**
   * Whether the offer goes live on save.
   *
   * True, because this builder's one API call is "Create offer" — saving a
   * draft is a separate button that never reaches the POS. It used to default
   * to false, which made every created offer dead at the till.
   */
  enabled: boolean;

  // ── Mapped on the way out ──

  /**
   * Day names, Mon–Sun, as step 3's chips produce them.
   *
   * Names rather than the API's numbers because the chips, the quick picks
   * ("Weekdays"), the AI fill and the preview all read and write them as
   * labels. `mapRepeatingDays` turns them into `days` at save time.
   */
  repeatingDays: string[];
  /**
   * The menu items the offer involves, which become `products`.
   *
   * A list of pairs rather than the API's flat product ids, so the picker can
   * tick the exact row that was chosen; `productsFor` flattens it and drops the
   * variants, which the POS has no field for. Only the BOGO deal collects these
   * — a percentage or rupee discount comes off the bill, not off a named item.
   */
  items: OfferItem[];

  // ── UI-only: presentational, or no field in OfferFormData yet ──

  /** The deal card that is selected — `DealKind.id`, not the API's `type`. */
  discountKind: string;
  /** Which variant of `freeProduct` is given away. The POS stores the product only. */
  freeProductVariantId?: string;
  audience: CustomerAudience;
  /** The tier id an audience of "loyalty-tier" targets. */
  audienceTierId: string;
  /**
   * The most a percentage deal may take off one bill. Percentage-only: a flat
   * Rs discount already has a ceiling, which is the discount itself.
   *
   * Collected and shown in the preview, but the POS has no field for it, so it
   * does not survive a save yet.
   */
  maxCap: number;
  /** Id of a festival picked from the list, or "" when none is. */
  festival: string;
  /**
   * An occasion the merchant named themselves — a store anniversary, a local
   * fair. Only one of this and `festival` is ever set: an offer runs for one
   * occasion, and holding both would leave the preview and the promo code to
   * guess which one was meant.
   */
  customFestival: string;
  activeHours: ActiveHours;
}

const INITIAL_STATE: OfferFormState = {
  name: "",
  // Overwritten the moment a deal is picked, which has to happen before the
  // form can be saved at all — a placeholder, not a default.
  type: "percent",
  value: 0,
  freeProduct: "",
  minSpend: 0,
  perCustomerLimit: 0,
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  code: "",
  enabled: true,

  repeatingDays: [],
  items: [],

  // UI-only
  discountKind: "",
  audience: "all",
  audienceTierId: "",
  maxCap: 0,
  festival: "",
  customFestival: "",
  activeHours: "all-day",
};

// ── API mapping ───────────────────────────────────────────────────────────────

/** Day name to the number the API uses, Sunday being 0. */
const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Day names to 0-6 integers.
 *
 * A name the map does not know is dropped rather than defaulting to 0, which
 * would quietly schedule the offer on Sunday. Step 3's chips can only produce
 * known names, but the AI fill writes `repeatingDays` straight from a model's
 * answer, and that is where an unexpected spelling would come from.
 */
function mapRepeatingDays(days: string[]): number[] {
  return days
    .map((day) => DAY_MAP[day])
    .filter((day): day is number => day !== undefined);
}

/** "dashain" → "Dashain", for naming an offer after the occasion it runs for. */
function titleCase(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * What to call this offer.
 *
 * Step 1's title box fills `name` in as soon as a deal is picked, so it is
 * almost always the answer. The rest is a safety net for an offer that somehow
 * reaches Create with the box emptied: the occasion first, since an offer built
 * around Dashain is "Dashain" to everyone, then the promo code.
 */
function offerName(form: OfferFormState): string {
  return (
    [form.name, form.customFestival, titleCase(form.festival), form.code]
      .map((candidate) => candidate.trim())
      .find(Boolean) ?? ""
  );
}

/**
 * The products the offer involves, as the API wants them.
 *
 * Deduplicated, because the picker lists each variant as its own row: ticking
 * "Momo · Large" and "Momo · Small" is two rows but one product, and `products`
 * holds product ids. The variant each row named is lost here — the POS has no
 * field for it.
 */
function productsFor(form: OfferFormState): string[] {
  return [...new Set(form.items.map((item) => item.productId))];
}

/**
 * The form as the POS wants it.
 *
 * Empty strings and zeroes become `undefined` rather than being sent as
 * themselves, because each optional field here means "no limit" when absent and
 * something quite different at 0 — a `perCustomerLimit` of 0 is an offer nobody
 * may use. `JSON.stringify` drops undefined keys, so an untouched field never
 * reaches the API at all.
 */
function toPayload(form: OfferFormState): OfferFormData {
  const days = mapRepeatingDays(form.repeatingDays);
  const products = productsFor(form);

  return {
    name: offerName(form),
    type: form.type,
    value: hasAmount(form.type) ? form.value : undefined,
    products: products.length > 0 ? products : undefined,
    freeProduct: form.freeProduct || undefined,
    minSpend: form.minSpend > 0 ? form.minSpend : undefined,
    perCustomerLimit:
      form.perCustomerLimit > 0 ? form.perCustomerLimit : undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    days: days.length > 0 ? days : undefined,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    code: form.code.trim() || undefined,
    enabled: form.enabled,
  };
}

/**
 * The first thing wrong with the form, as a sentence to show the merchant, or
 * null when it is ready to save.
 *
 * One at a time and in step order, so the message points at the step to open
 * rather than listing four faults at once. Only the fields the chosen deal
 * actually uses are checked — a BOGO has no amount, and demanding one would
 * make it unsaveable.
 */
function firstProblem(form: OfferFormState): string | null {
  if (!form.discountKind) return "Choose a deal first";

  if (!offerName(form)) {
    return "Name this offer — an occasion, a custom deal sentence or a promo code will do";
  }

  if (hasAmount(form.type)) {
    if (form.value <= 0) return "Enter how much comes off";
    if (form.type === "percent" && form.value >= 100) {
      return "A percentage discount has to be under 100";
    }
  }

  if (form.type === "freeItem" && !form.freeProduct) {
    return "Pick the item customers get free";
  }

  if (form.type === "bogo" && form.items.length === 0) {
    return "Pick the items buy one, get one applies to";
  }

  // Both are ISO "YYYY-MM-DD", so comparing them as strings compares them as
  // dates.
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    return "The end date is before the start date";
  }

  return null;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface OfferFormContextValue {
  form: OfferFormState;
  updateField: <K extends keyof OfferFormState>(
    key: K,
    value: OfferFormState[K],
  ) => void;
  /** Merge several fields at once (e.g. applying a ready-made preset). */
  patchForm: (partial: Partial<OfferFormState>) => void;
  resetForm: () => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;
}

const OfferFormContext = createContext<OfferFormContextValue | null>(null);

export function useOfferForm() {
  const ctx = useContext(OfferFormContext);
  if (!ctx)
    throw new Error("useOfferForm must be used within OfferFormProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function OfferFormProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<OfferFormState>(INITIAL_STATE);
  /**
   * Saving goes through the mutation rather than calling `createOffer`
   * straight, so a new offer invalidates the offers list and appears on the
   * offers page; called directly it saved and left the list stale. The toasts
   * come from there too, which is why this only reports its own validation.
   *
   * `mutateAsync` is destructured because it is stable across renders while the
   * mutation object is not — `handleSave` would be rebuilt on every render if
   * it depended on the whole thing.
   */
  const { mutateAsync, isPending } = useCreateOffer();

  const updateField = useCallback(
    <K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const patchForm = useCallback((partial: Partial<OfferFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_STATE);
  }, []);

  const handleSave = useCallback(async () => {
    const problem = firstProblem(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      await mutateAsync(toPayload(form));
      resetForm();
    } catch {
      // The mutation has already said what went wrong. The form is left as it
      // was so one field can be fixed and Create pressed again — which is why
      // the reset sits inside the success path rather than in a `finally`.
    }
  }, [form, mutateAsync, resetForm]);

  return (
    <OfferFormContext.Provider
      value={{
        form,
        updateField,
        patchForm,
        resetForm,
        isSaving: isPending,
        handleSave,
      }}
    >
      {children}
    </OfferFormContext.Provider>
  );
}
