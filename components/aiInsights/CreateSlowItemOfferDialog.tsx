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
import OfferPhonePreview from "@/components/offers/OfferPhonePreview";

import { completeSlowItemAction } from "@/services/apiAiInsights.client";
import { createSuggestedPromoCode } from "@/lib/offers/offerCreationDraft";

import type { SlowItemInsight } from "@/lib/ai-insights/sections/slowItems";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

type Props = {
  open: boolean;
  onClose: () => void;
  item: SlowItemInsight;
  kind: PeriodKind;
  periodId: string;
  promptVersion: string;
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

function getDefaultOfferDates() {
  const start = new Date();
  const end = new Date(start);

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

function SlowItemOfferForm({
  open,
  onClose,
  item,
  kind,
  periodId,
  promptVersion,
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

  // Keep the locally held ID synchronized with the parent.
  useEffect(() => {
    if (pendingOfferId) {
      setOfferId(pendingOfferId);
      setActiveStep(2);
    }
  }, [pendingOfferId]);

  // Prefill the existing offer form once for this selected slow item.
  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    const dates = getDefaultOfferDates();

    patchForm({
      name: `${item.name} free-item offer`,

      discountKind: "free-item",
      type: "freeItem",
      value: 0,

      freeProduct: item.productId,
      freeProductVariantId: undefined,
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

      ...dates,

      festival: "",
      customFestival: "",

      code: createSuggestedPromoCode(item.name, "FREE"),
      enabled: true,
    });
  }, [item, patchForm]);

  const completeOffer = async (id: string) => {
    setIsCompleting(true);
    setCompletionError("");

    try {
      await completeSlowItemAction({
        kind,
        id: periodId,
        promptVersion,
        suggestionId: item.id,
        actionType: "freebie-created",
        productId: item.productId,
        offerId: id,
      });

      onCompleted();
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : "The offer was created, but the insight could not be updated. Try again.",
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCreateOrRetry = async () => {
    // If an offer already exists, retry only the completion PATCH.
    if (offerId) {
      await completeOffer(offerId);
      return;
    }

    // Only create the offer from the final step.
    if (activeStep !== STEPS.length - 1) return;

    setIsSaving(true);
    setCompletionError("");

    try {
      const createdOffer = await handleSave();

      if (!createdOffer?._id) return;

      // Preserve the ID immediately so a failed PATCH never creates
      // another offer when the user retries.
      setOfferId(createdOffer._id);
      onOfferCreated(createdOffer._id);

      await completeOffer(createdOffer._id);
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isCompleting;
  const isLastStep = activeStep === STEPS.length - 1;
  const progress = (activeStep / (STEPS.length - 1)) * 100;

  const goBack = () => {
    setActiveStep((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setActiveStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create free-item offer"
      subtitle={`Set up an offer for ${item.name}`}
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
                  The offer was created, but the insight wasn&lsquo;t updated.
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
              Offer created. Updating the insight...
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-[#c3ccdc] dark:hover:bg-white/10"
              >
                Close
              </button> */}

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
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress section */}
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

          {/* Progress bar */}
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

          {/* Step indicators */}
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
                  Only the insight update needs to be retried. Your offer
                  won&lsquo;t be duplicated.
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
                  Updating your slow-moving item insight...
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

            {activeStep === 2 && (
              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  <OfferPromoCode />
                </div>

                {/* <div className="min-w-0 xl:sticky xl:top-0">
                  <OfferPhonePreview />
                </div> */}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export default function CreateSlowItemOfferDialog(props: Props) {
  return (
    <OfferFormProvider>
      <SlowItemOfferForm {...props} />
    </OfferFormProvider>
  );
}
