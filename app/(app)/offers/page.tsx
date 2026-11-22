"use client";

import { useEffect, useState } from "react";
import { ListChecks, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { OfferFormProvider, useOfferForm } from "@/providers/OfferFormContext";
import { consumeOfferCreationDraft } from "@/lib/offers/offerCreationDraft";

import OfferDeal from "@/components/offers/OfferDeal";
import OfferConditions from "@/components/offers/OfferConditions";
import OfferWhenItRuns from "@/components/offers/OfferWhenItRuns";
import OfferPromoCode from "@/components/offers/OfferPromoCode";
import OfferPhonePreview from "@/components/offers/OfferPhonePreview";
import OfferFooterActions from "@/components/offers/OfferFooterActions";
import PageHeader from "@/components/ui/PageHeader";
import { useProductsList } from "@/hooks/useProductsList";
import { getVariants, variantLabel } from "@/lib/productVariants";
import type { Product } from "@/lib/types/product";

const VIEWS = [
  { id: "build" as const, label: "Build offer", icon: ListChecks },
  { id: "preview" as const, label: "Preview", icon: Smartphone },
];

function getDefaultOfferDates() {
  const start = new Date();
  const end = new Date(start);

  // Seven calendar days, including today.
  end.setDate(end.getDate() + 6);

  const toLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toLocalDate(start),
    endDate: toLocalDate(end),
  };
}

type FestivalOfferDetails = {
  discountKind: "percentage" | "rupee" | "bogo" | "free-item";
  type: "percent" | "amount" | "bogo" | "freeItem";
  value: number;
};

function parseFestivalOfferIdea(idea: string): FestivalOfferDetails {
  const normalized = idea.toLowerCase().trim();

  // BOGO should be checked first because "Buy 1 Get 1 Free"
  // is a BOGO offer, not a standalone free-item offer.
  if (
    /\bbogo\b/.test(normalized) ||
    /\bbuy\s*1\s*get\s*1\b/.test(normalized) ||
    /\bbuy\s+one\s+get\s+one\b/.test(normalized)
  ) {
    return {
      discountKind: "bogo",
      type: "bogo",
      value: 0,
    };
  }

  // Free-item suggestions.
  if (
    (/\bfree\b|\bcomplimentary\b/.test(normalized) ||
      /निःशुल्क|निशुल्क|मुफ्त/.test(normalized)) &&
    !/\bfree\s+delivery\b/.test(normalized)
  ) {
    return {
      discountKind: "free-item",
      type: "freeItem",
      value: 0,
    };
  }

  // Explicit percentage, e.g. 10% discount.
  const percentageMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);

  if (percentageMatch) {
    return {
      discountKind: "percentage",
      type: "percent",
      value: Number(percentageMatch[1]),
    };
  }

  // Explicit currency amount.
  const amountMatch =
    normalized.match(/(?:rs\.?|npr|रु\.?)\s*([\d,]+(?:\.\d+)?)/i) ??
    normalized.match(/([\d,]+(?:\.\d+)?)\s*(?:rs\.?|rupees?|npr)\b/i);

  if (amountMatch) {
    return {
      discountKind: "rupee",
      type: "amount",
      value: Number(amountMatch[1].replace(/,/g, "")),
    };
  }

  // No explicit discount value: let the owner decide.
  return {
    discountKind: "percentage",
    type: "percent",
    value: 0,
  };
}

function normalizeProductName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

function findSuggestedFreeProduct(
  idea: string,
  products: Product[],
): { productId: string; variantId?: string } | null {
  // Extract the product name from suggestions such as:
  // "Free Chocolate Cake"
  // "Complimentary Coffee"
  // "Get a free Large Pizza"
  const suggestedName = idea
    .trim()
    .replace(/^\s*(?:offer\s*:\s*)?/i, "")
    .replace(
      /^\s*(?:(?:get|enjoy|receive|claim)\s+)?(?:a|an|one)?\s*(?:free|complimentary)\s+/i,
      "",
    )
    // Remove promotional context after the product name.
    .replace(/\s+(?:with|for|on|when|after|upon|above|over|per)\b.*$/i, "")
    .trim();

  if (!suggestedName) return null;

  const normalizedSuggestion = normalizeProductName(suggestedName);
  if (!normalizedSuggestion) return null;

  const matches: { productId: string; variantId?: string }[] = [];

  for (const product of products) {
    const variants = getVariants(product);

    // Products without variants are selectable as individual products.
    if (variants.length === 0) {
      if (normalizeProductName(product.name) === normalizedSuggestion) {
        matches.push({ productId: product.id });
      }

      continue;
    }

    // Variant products must match a specific available variant.
    for (const variant of variants) {
      const isAvailable = variant.isAvailable && (variant.inStock ?? 0) > 0;

      if (!isAvailable) continue;

      const variantName = `${product.name} ${variantLabel(variant)}`;

      if (normalizeProductName(variantName) === normalizedSuggestion) {
        matches.push({
          productId: product.id,
          variantId: variant.id,
        });
      }
    }
  }

  // Never guess when there are no matches or multiple possible matches.
  return matches.length === 1 ? matches[0] : null;
}

function OfferBuilder() {
  const [view, setView] = useState<"build" | "preview">("build");
  const { patchForm } = useOfferForm();

  const { data: products = [], isLoading: productsLoading } = useProductsList();

  useEffect(() => {
    // Wait for inventory before consuming the draft so festival offers
    // can attempt to match their suggested free item.
    if (productsLoading) return;

    const draft = consumeOfferCreationDraft();

    if (!draft) return;

    const dates = getDefaultOfferDates();

    // Defaults shared by all AI-generated offers.
    const commonDefaults = {
      minSpend: 100,
      perCustomerLimit: 10,
      maxCap: 0,

      audience: "all" as const,
      audienceTierId: "",

      repeatingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "10:00",
      endTime: "22:00",
      activeHours: "all-day" as const,

      code: "",
      enabled: true,
    };

    if (draft.source === "festival") {
      const idea = draft.offerIdea?.trim();
      const details = parseFestivalOfferIdea(idea || "");
      const matchedFreeProduct =
        details.discountKind === "free-item"
          ? findSuggestedFreeProduct(idea || "", products)
          : null;

      patchForm({
        ...commonDefaults,

        name: idea ? `${draft.label} - ${idea}` : `${draft.label} offer`,

        discountKind: details.discountKind,
        type: details.type,
        value: details.value,

        festival: draft.festivalId ?? "",
        customFestival: draft.festivalId ? "" : draft.label,

        startDate: draft.startDate,
        endDate: draft.endDate,

        freeProduct: matchedFreeProduct?.productId ?? "",
        freeProductVariantId: matchedFreeProduct?.variantId,
        items: [],

        code: draft.suggestedCode,
      });

      return;
    }

    if (draft.source === "slow-item") {
      if (draft.move === "freebie") {
        patchForm({
          ...commonDefaults,
          ...dates,

          name: `${draft.productName} free-item offer`,

          discountKind: "free-item",
          type: "freeItem",
          value: 0,

          freeProduct: draft.productId,
          freeProductVariantId: undefined,
          items: [],

          festival: "",
          customFestival: "",
          code: draft.suggestedCode,
        });

        return;
      }

      patchForm({
        ...commonDefaults,
        ...dates,

        name: `Special offer for ${draft.productName}`,

        discountKind: "percentage",
        type: "percent",
        value: 0,

        freeProduct: "",
        freeProductVariantId: undefined,
        items: [],

        festival: "",
        customFestival: "",
        code: draft.suggestedCode,
      });
    }
  }, [patchForm, products, productsLoading]);

  return (
    <div className="min-h-screen bg-surface-page px-6 py-5 sm:py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto w-full">
        <PageHeader
          title="Create an offer"
          subtitle="Create your offer and preview how customers will see it."
          spaceBelow={false}
          actionWidth="w-fit sm:w-full"
          actions={
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 sm:rounded-xl xl:hidden dark:bg-white/10">
              {VIEWS.map(({ id, label, icon: Icon }) => {
                const active = view === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:px-4",
                      active
                        ? "bg-background text-foreground shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{label}</span>
                  </button>
                );
              })}
            </div>
          }
        />

        <div className="grid grid-cols-1 items-start gap-6 pt-4 xl:grid-cols-[1fr_350px]">
          {/* Left: offer builder steps */}
          <div
            className={cn(
              "mt-2 min-w-0 space-y-5 xl:block",
              view === "build" || "hidden",
            )}
          >
            <OfferDeal />
            <OfferConditions />
            <OfferWhenItRuns />
            <OfferPromoCode />
            <OfferFooterActions />
          </div>

          {/* Right: customer preview */}
          <div
            className={cn(
              "mt-2 min-w-0 xl:sticky xl:top-4 xl:block",
              view === "preview" || "hidden",
            )}
          >
            <OfferPhonePreview />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateOfferPage() {
  return (
    <OfferFormProvider>
      <OfferBuilder />
    </OfferFormProvider>
  );
}
