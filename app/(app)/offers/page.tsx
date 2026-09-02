"use client";

import { useState } from "react";
import { ListChecks, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { OfferFormProvider } from "@/providers/OfferFormContext";
import OfferDeal from "@/components/offers/OfferDeal";
import OfferConditions from "@/components/offers/OfferConditions";
import OfferWhenItRuns from "@/components/offers/OfferWhenItRuns";
import OfferPromoCode from "@/components/offers/OfferPromoCode";
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
/** The two halves of the page, for screens too narrow to hold both. */
const VIEWS = [
  { id: "build" as const, label: "Build offer", icon: ListChecks },
  { id: "preview" as const, label: "Preview", icon: Smartphone },
];

function OfferBuilder() {
  /**
   * Which half is on screen below `xl`.
   *
   * Stacked, the preview sits a full page below the form, so the one thing it
   * exists for — watching the offer change as you type — stops happening. A
   * switch keeps it one tap away instead.
   */
  const [view, setView] = useState<"build" | "preview">("build");

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="font-bold text-xl md:text-2xl truncate">
              Create an offer
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill this in once. We&apos;ll show you exactly how it looks to
              your customers.
            </p>
          </div>

          {/* Only below xl, where the two columns stack. Wide enough and both
              are on screen at once, so a switch would be a control with
              nothing to switch. */}
          <div className="flex  items-center gap-1 rounded-xl bg-[#e4f2fe]  p-1 xl:hidden">
            {VIEWS.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
                    active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/*
        <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
           
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                  <h1 className="font-bold text-xl md:text-2xl truncate">
                    Dashboard Overview
                  </h1>
                  {!isLoading && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Welcome back, {profile?.name}. Here&lsquo;s what&lsquo;s happening
                      with Rebuzz POS
                    </p>
                  )}
                </div>
        
                <div className="flex items-center gap-2">
                  <HeaderActionButton
                    variant="dashed"
                    icon={Plus}
                    label="Create Order"
                    href="/invoices/add"
                  />
                </div>
              </div> */}

        <div className="grid grid-cols-1 items-start pt-4 gap-6 xl:grid-cols-[1fr_380px]">
          {/* Left: the four steps */}
          <div
            className={cn("space-y-5 xl:block", view === "build" || "hidden")}
          >
            <OfferDeal />

            <OfferConditions />

            <OfferWhenItRuns />

            <OfferPromoCode />

            <OfferFooterActions />
          </div>

          {/* Right: the customer's view */}
          <div
            className={cn(
              "xl:sticky xl:top-4 xl:block",
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
