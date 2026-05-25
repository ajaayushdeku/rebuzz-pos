"use client";

import { OfferFormProvider } from "@/providers/OfferFormContext";
import OfferBasicInfo from "@/components/offers/OfferBasicInfo";
import OfferAudience from "@/components/offers/OfferAudience";
import OfferSchedule from "@/components/offers/OfferSchedule";
import OfferPreviewCard from "@/components/offers/OfferPreviewCard";
import OfferFooterActions from "@/components/offers/OfferFooterActions";
import OfferSummaryStatus from "@/components/offers/OfferSummaryStatus";
import OfferProductSelector from "@/components/offers/OfferProductSelector";
import { fetchOffers } from "@/services/apiOffers.client";

export default function CreateOfferPage() {
  const offers = fetchOffers();
  console.log("Offer Cards:", offers);
  return (
    <OfferFormProvider>
      <div className="min-h-screen bg-[#f5f6fa]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <h1 className="md:text-4xl text-3xl font-bold text-gray-900">
              Create New Offer Card
            </h1>
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
            {/* Left Side */}
            <div className="space-y-6">
              <OfferBasicInfo />
              <OfferProductSelector />
              <OfferAudience />
              <OfferSchedule />
              <OfferFooterActions />
            </div>

            {/* Right Side */}
            <div className="sticky top-6 space-y-4">
              <OfferPreviewCard />
              <OfferSummaryStatus />
            </div>
          </div>
        </div>
      </div>
    </OfferFormProvider>
  );
}
