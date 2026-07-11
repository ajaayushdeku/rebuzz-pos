"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { OfferFormProvider, useOfferForm } from "@/providers/OfferFormContext";
import OfferSection from "@/components/offers/OfferSection";
import OfferTemplates from "@/components/offers/OfferTemplates";
import OfferDiscount from "@/components/offers/OfferDiscount";
import OfferDetails from "@/components/offers/OfferDetails";
import OfferItems from "@/components/offers/OfferItems";
import OfferAudience, {
  AUDIENCE_SEGMENTS,
} from "@/components/offers/OfferAudience";
import OfferSchedule from "@/components/offers/OfferSchedule";
import OfferChannels from "@/components/offers/OfferChannels";
import OfferPreviewCard from "@/components/offers/OfferPreviewCard";
import OfferEstimatedCost from "@/components/offers/OfferEstimatedCost";
import OfferChecklist, {
  useOfferChecklist,
} from "@/components/offers/OfferChecklist";
import OfferSmartSuggestions from "@/components/offers/OfferSmartSuggestions";
import OfferFooterActions from "@/components/offers/OfferFooterActions";

function OfferBuilder() {
  const { form } = useOfferForm();
  const { steps, done, total } = useOfferChecklist();

  const scopeLabel =
    form.itemScope === "all"
      ? "All items"
      : form.itemScope === "category"
        ? form.category || "A category"
        : "Specific items";
  const segmentLabel = AUDIENCE_SEGMENTS.find(
    (s) => s.id === form.segment,
  )?.label;

  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-xl md:text-2xl truncate">
                Create Offer
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Rebuzz POS Campaign Builder
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < done ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left: builder */}
          <div className="space-y-4">
            <OfferTemplates />

            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-gray-700">
                Build your offer
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                {done} of {total} done
              </span>
            </div>

            <OfferSection
              title="What's the discount?"
              complete={steps.discount}
              defaultOpen
              summary={
                form.discountKind
                  ? `${form.discountKind} · ${form.discount || 0}`
                  : undefined
              }
            >
              <OfferDiscount />
            </OfferSection>

            <OfferSection
              title="Offer details"
              complete={steps.details}
              summary={form.cardName || undefined}
            >
              <OfferDetails />
            </OfferSection>

            <OfferSection
              title="Which items?"
              complete={steps.items}
              summary={scopeLabel}
            >
              <OfferItems />
            </OfferSection>

            <OfferSection
              title="Who gets it?"
              complete={steps.audience}
              summary={segmentLabel}
            >
              <OfferAudience />
            </OfferSection>

            <OfferSection
              title="When does it run?"
              complete={steps.schedule}
              summary={
                form.startDate && form.endDate
                  ? `${form.startDate} → ${form.endDate}`
                  : undefined
              }
            >
              <OfferSchedule />
            </OfferSection>

            <OfferSection
              title="How do customers hear about it?"
              complete={steps.channels}
              summary={
                form.channels.length > 0
                  ? `${form.channels.length} channels selected`
                  : undefined
              }
            >
              <OfferChannels />
            </OfferSection>
          </div>

          {/* Right: sidebar */}
          <div className="sticky top-6 space-y-4">
            <OfferPreviewCard />
            <OfferEstimatedCost />
            <OfferChecklist />
            <OfferFooterActions />
            <OfferSmartSuggestions />
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
