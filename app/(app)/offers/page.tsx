"use client";

import { OfferFormProvider } from "@/providers/OfferFormContext";
import OfferStepCard from "@/components/offers/OfferStepCard";
import OfferDeal from "@/components/offers/OfferDeal";
import OfferConditions from "@/components/offers/OfferConditions";
import OfferDetails from "@/components/offers/OfferDetails";
import OfferAudience from "@/components/offers/OfferAudience";
import OfferSchedule from "@/components/offers/OfferSchedule";
import OfferChannels from "@/components/offers/OfferChannels";
import OfferPhonePreview from "@/components/offers/OfferPhonePreview";
import OfferFooterActions from "@/components/offers/OfferFooterActions";

/**
 * Build an offer, with the customer's view of it beside the form.
 *
 * Four steps rather than six collapsible sections: the deal chosen in step one
 * decides what the rest of the form even asks, so the steps read in order and
 * stay open. The preview is not decoration — it is the offer, so a merchant
 * writes the words their customers read instead of filling in fields and
 * hoping.
 */
function OfferBuilder() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="mb-6 border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-blue-600 md:text-[28px]">
            Create an offer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill this in once. We&apos;ll show you exactly how it looks to your
            customers.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
          {/* Left: the four steps */}
          <div className="space-y-5">
            <OfferDeal />

            <OfferConditions />

            <OfferStepCard
              step={3}
              title="Who gets it, and when"
              subtitle="Pick the customers and the dates this offer runs."
            >
              <div className="space-y-6">
                {/* Parked here until steps 3 and 4 have designs of their own —
                    the offer's private name and its promo code still have to
                    live somewhere for a save to work. */}
                <OfferDetails />
                <div className="border-t border-gray-100 pt-6">
                  <OfferAudience />
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <OfferSchedule />
                </div>
              </div>
            </OfferStepCard>

            <OfferStepCard
              step={4}
              title="How customers hear about it"
              subtitle="Choose where this offer is shown."
            >
              <OfferChannels />
            </OfferStepCard>
          </div>

          {/* Right: the customer's view */}
          <div className="space-y-4 xl:sticky xl:top-4">
            <OfferPhonePreview />
            <OfferFooterActions />
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
