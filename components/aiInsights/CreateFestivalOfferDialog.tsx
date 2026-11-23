"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
} from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { OfferFormProvider, useOfferForm } from "@/providers/OfferFormContext";
import OfferDeal from "@/components/offers/OfferDeal";
import OfferConditions from "@/components/offers/OfferConditions";
import OfferWhenItRuns from "@/components/offers/OfferWhenItRuns";
import OfferPromoCode from "@/components/offers/OfferPromoCode";

import { completeFestivalPrepAction } from "@/services/apiAiInsights.client";
import { createSuggestedPromoCode } from "@/lib/offers/offerCreationDraft";
import { getVariants, variantLabel } from "@/lib/productVariants";

import type { FestivalPrep } from "@/lib/ai-insights/sections/festivalPrep";
import type { Product } from "@/lib/types/product";

type Props = {
  open: boolean;
  onClose: () => void;
  item: FestivalPrep;
  offerIdea: string;
  date: string;
  promptVersion: string;
  products: Product[];
  productsLoading: boolean;
  pendingOfferId: string | null;
  onOfferCreated: (offerId: string) => void;
  onCompleted: () => void;
};

const STEPS = [
  {
    title: "Offer details",
    description: "Choose the offer and conditions",
  },
  {
    title: "Schedule",
    description: "Choose when it runs",
  },
  {
    title: "Promo code",
    description: "Review and create your offer",
  },
];

type FestivalOfferDetails = {
  discountKind: "percentage" | "rupee" | "bogo" | "free-item";
  type: "percent" | "amount" | "bogo" | "freeItem";
  value: number;
};

function parseFestivalOfferIdea(idea: string): FestivalOfferDetails {
  const normalized = idea.toLowerCase().trim();

  // Check BOGO first so "Buy 1 Get 1 Free" is not treated
  // as a standalone free-item offer.
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

  const percentageMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);

  if (percentageMatch) {
    return {
      discountKind: "percentage",
      type: "percent",
      value: Number(percentageMatch[1]),
    };
  }

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

  // The owner can choose the discount value in the offer form.
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
  const suggestedName = idea
    .trim()
    .replace(/^\s*(?:offer\s*:\s*)?/i, "")
    .replace(
      /^\s*(?:(?:get|enjoy|receive|claim)\s+)?(?:a|an|one)?\s*(?:free|complimentary)\s+/i,
      "",
    )
    .replace(/\s+(?:with|for|on|when|after|upon|above|over|per)\b.*$/i, "")
    .trim();

  if (!suggestedName) return null;

  const normalizedSuggestion = normalizeProductName(suggestedName);
  if (!normalizedSuggestion) return null;

  const matches: { productId: string; variantId?: string }[] = [];

  for (const product of products) {
    const variants = getVariants(product);

    if (variants.length === 0) {
      if (normalizeProductName(product.name) === normalizedSuggestion) {
        matches.push({ productId: product.id });
      }

      continue;
    }

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

  // Never guess if there are zero or multiple matches.
  return matches.length === 1 ? matches[0] : null;
}

function FestivalOfferForm({
  open,
  onClose,
  item,
  offerIdea,
  date,
  promptVersion,
  products,
  productsLoading,
  pendingOfferId,
  onOfferCreated,
  onCompleted,
}: Props) {
  const { patchForm, handleSave } = useOfferForm();

  const initialized = useRef(false);

  const [activeStep, setActiveStep] = useState(pendingOfferId ? 2 : 0);
  const [offerId, setOfferId] = useState<string | null>(pendingOfferId);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [creationError, setCreationError] = useState("");

  // Restore a pending offer ID supplied by the parent.
  useEffect(() => {
    if (pendingOfferId) {
      setOfferId(pendingOfferId);
      setActiveStep(2);
    }
  }, [pendingOfferId]);

  // Prefill once, waiting for inventory so a free-item suggestion
  // can be matched against the available products and variants.
  useEffect(() => {
    if (initialized.current || productsLoading) return;

    initialized.current = true;

    const details = parseFestivalOfferIdea(offerIdea);

    const matchedFreeProduct =
      details.discountKind === "free-item"
        ? findSuggestedFreeProduct(offerIdea, products)
        : null;

    patchForm({
      name: `${item.label} - ${offerIdea}`,

      discountKind: details.discountKind,
      type: details.type,
      value: details.value,

      freeProduct: matchedFreeProduct?.productId ?? "",
      freeProductVariantId: matchedFreeProduct?.variantId,
      items: [],

      minSpend: 100,
      perCustomerLimit: 10,
      maxCap: 0,

      audience: "all",
      audienceTierId: "",

      repeatingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "10:00",
      endTime: "22:00",
      activeHours: "all-day",

      startDate: item.startDate,
      endDate: item.endDate,

      festival: item.festivalId ?? "",
      customFestival: item.festivalId ? "" : item.label,

      code: createSuggestedPromoCode(item.label, "FEST"),
      enabled: true,
    });
  }, [item, offerIdea, products, productsLoading, patchForm]);

  const completeOffer = async (id: string) => {
    setIsCompleting(true);
    setCompletionError("");

    try {
      await completeFestivalPrepAction({
        date,
        promptVersion,
        recommendationId: item.id,
        offerId: id,
      });

      onCompleted();
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : "The offer was created, but the festival insight could not be updated. Try again.",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCreateOrRetry = async () => {
    // An offer already exists: retry only the completion request.
    if (offerId) {
      await completeOffer(offerId);
      return;
    }

    if (activeStep !== STEPS.length - 1) return;

    setIsSaving(true);
    setCreationError("");
    setCompletionError("");

    try {
      const createdOffer = await handleSave();

      if (!createdOffer?._id) {
        setCreationError(
          "We couldn't create your offer. Please review the details and try again.",
        );
        return;
      }

      // Store the ID immediately. Never create another offer
      // while completion of this offer is still pending.
      setOfferId(createdOffer._id);
      onOfferCreated(createdOffer._id);

      await completeOffer(createdOffer._id);
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your offer. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isCompleting;
  const isLastStep = activeStep === STEPS.length - 1;
  const progress = (activeStep / (STEPS.length - 1)) * 100;

  const goBack = () => {
    setCreationError("");
    setActiveStep((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setCreationError("");
    setActiveStep((current) => Math.min(STEPS.length - 1, current + 1));
  };
  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Create festival offer"
      subtitle={`Set up an offer for ${item.label}`}
      icon={Gift}
      iconColor="text-emerald-600 dark:text-emerald-300"
      iconBgColor="bg-emerald-50 dark:bg-emerald-400/10"
      maxWidth="max-w-5xl"
      bodyMaxHeight="max-h-[68vh]"
      busy={busy}
      footer={
        <div className="space-y-3">
          {completionError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  The offer was created, but the festival insight wasn&apos;t
                  updated.
                </p>

                <p className="mt-1">{completionError}</p>

                <p className="mt-1">
                  Retry the update below. Your existing offer will not be
                  created again.
                </p>
              </div>
            </div>
          )}

          {offerId && !completionError && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={15} />
              Offer created. Updating festival insight...
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {!offerId && activeStep > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-[#c3ccdc] dark:hover:bg-white/10"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={offerId || isLastStep ? handleCreateOrRetry : goNext}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}

              {isSaving
                ? "Creating offer..."
                : isCompleting
                  ? "Updating insight..."
                  : offerId
                    ? "Retry insight update"
                    : isLastStep
                      ? "Create offer"
                      : "Continue"}

              {!busy && !offerId && !isLastStep && <ChevronRight size={16} />}
            </button>
          </div>

          {creationError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">Offer creation failed</p>
                <p className="mt-1">{creationError}</p>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Step {activeStep + 1} of {STEPS.length}
              </p>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-[#8996aa]">
                {STEPS[activeStep].description}
              </p>
            </div>

            <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-[#8996aa]">
              {Math.round(progress)}% complete
            </span>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
            role="progressbar"
            aria-label="Offer creation progress"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={activeStep + 1}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              const isComplete = activeStep > index;

              return (
                <button
                  key={step.title}
                  type="button"
                  disabled={busy || !!offerId}
                  onClick={() => setActiveStep(index)}
                  className="group flex min-w-0 items-center gap-2 text-left disabled:cursor-default"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-500/10"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-[#8996aa]"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 size={15} /> : index + 1}
                  </span>

                  <span
                    className={`truncate text-xs font-semibold transition ${
                      isActive
                        ? "text-emerald-700 dark:text-emerald-300"
                        : isComplete
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-[#748197]"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        {offerId ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-8 text-center dark:border-emerald-400/20 dark:bg-emerald-400/5">
            {completionError ? (
              <>
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <AlertCircle size={23} />
                </div>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Your offer is already created
                </h3>

                <p className="mt-1.5 max-w-sm text-xs leading-5 text-gray-600 dark:text-[#aab6c9]">
                  Only the festival insight update needs to be retried. Your
                  offer won&apos;t be duplicated.
                </p>
              </>
            ) : (
              <>
                <Loader2
                  size={25}
                  className="mb-3 animate-spin text-emerald-600 dark:text-emerald-300"
                />

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Finishing up your offer
                </h3>

                <p className="mt-1.5 text-xs text-gray-600 dark:text-[#aab6c9]">
                  Updating your festival preparation insight...
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="min-w-0">
            {activeStep === 0 && (
              <div className="space-y-5">
                <OfferDeal />
                <OfferConditions />
              </div>
            )}

            {activeStep === 1 && <OfferWhenItRuns />}

            {activeStep === 2 && <OfferPromoCode />}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export default function CreateFestivalOfferDialog(props: Props) {
  return (
    <OfferFormProvider>
      <FestivalOfferForm {...props} />
    </OfferFormProvider>
  );
}
