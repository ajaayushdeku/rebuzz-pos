"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { createOffer, OfferFormData } from "@/services/apiOffers.client";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Discount type as shown in the UI (human-readable).
 * Maps to "percent" or "amount" in the API.
 */
export type DiscountType = "percentage" | "fixed" | "bogo";

/** Audience segment id (UI only). Widened to string for the richer card grid. */
export type OfferSegment = string;

export type PromoMode = "auto" | "custom";
export type UsesPerCustomer = "unlimited" | "once" | "limit";
export type ItemScope = "all" | "category" | "specific";
export type FestivalTab = "all" | "nepali" | "hindu" | "intl";
export type ActiveHours = "all-day" | "happy" | "lunch" | "evening";

export interface OfferFormState {
  // ── Fields sent to the API (see OfferFormData) ──
  cardName: string;
  discountType: DiscountType;
  discount: number;
  hasKey: string; // promo code
  keykey: string;
  hasValueFor: string; // specific-customer search
  segment: OfferSegment;
  startDate: string;
  endDate: string;
  /** Stored as day names ("Mon") — mapped to 0-6 integers for the API */
  repeatingDays: string[];
  note: string;
  enabled: boolean;
  productId: string;

  // ── UI-only state (presentational, NOT sent to the API) ──
  template: string;
  discountKind: string;
  promoMode: PromoMode;
  usesPerCustomer: UsesPerCustomer;
  usesLimit: number;
  itemScope: ItemScope;
  category: string;
  sendTriggers: string[];
  festival: string;
  festivalTab: FestivalTab;
  activeHours: ActiveHours;
  channels: string[];
}

const INITIAL_STATE: OfferFormState = {
  cardName: "",
  discountType: "percentage",
  discount: 0,
  hasKey: "",
  keykey: "",
  hasValueFor: "",
  segment: "",
  startDate: "",
  endDate: "",
  repeatingDays: [],
  note: "",
  enabled: true,
  productId: "",

  // UI-only
  template: "",
  discountKind: "",
  promoMode: "auto",
  usesPerCustomer: "unlimited",
  usesLimit: 1,
  itemScope: "all",
  category: "",
  sendTriggers: [],
  festival: "",
  festivalTab: "all",
  activeHours: "all-day",
  channels: [],
};

// ── API mapping helpers ─────────────────────────────────────────────────────

/** Map UI discount type to API value */
function mapDiscountType(type: DiscountType): string {
  switch (type) {
    case "percentage":
      return "percent";
    case "fixed":
      return "amount";
    case "bogo":
      return "amount"; // fallback
    default:
      return "amount";
  }
}

/** Day name to number map */
const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Map day-name strings to 0-6 integers */
function mapRepeatingDays(days: string[]): number[] {
  return days.map((d) => DAY_MAP[d] ?? 0);
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
  const [isSaving, setIsSaving] = useState(false);

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
    if (!form.cardName.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (form.discount <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (!form.productId) {
      toast.error("Please select a product for this offer");
      return;
    }

    setIsSaving(true);
    try {
      const payload: OfferFormData = {
        hasKey: form.hasKey,
        keykey: form.keykey,
        hasValueFor: form.hasValueFor,
        endDate: form.endDate,
        cardName: form.cardName,
        discountType: mapDiscountType(form.discountType),
        discount: form.discount,
        startDate: form.startDate,
        note: form.note,
        enabled: form.enabled,
        repeatingDays: mapRepeatingDays(form.repeatingDays),
        productId: form.productId,
      };

      await createOffer(payload);
      toast.success("Offer created successfully!");
      resetForm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create offer",
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, resetForm]);

  return (
    <OfferFormContext.Provider
      value={{ form, updateField, patchForm, resetForm, isSaving, handleSave }}
    >
      {children}
    </OfferFormContext.Provider>
  );
}
