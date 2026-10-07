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
import PageHeader from "@/components/ui/PageHeader";

const VIEWS = [
  { id: "build" as const, label: "Build offer", icon: ListChecks },
  { id: "preview" as const, label: "Preview", icon: Smartphone },
];

function OfferBuilder() {
  const [view, setView] = useState<"build" | "preview">("build");

  return (
    <div className="min-h-screen bg-surface-page px-6 py-5 sm:py-8  md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto w-full">
        {/* The grid below brings its own pt-4, so the rule carries no
            margin of its own. */}
        <PageHeader
          title="Create an offer"
          subtitle={
            <>
              Fill this in once. We&apos;ll show you exactly how it looks to
              your customers.
            </>
          }
          spaceBelow={false}
          actions={
            /* Only below xl, where the two columns stack. Wide enough and both
               are on screen at once, so a switch would be a control with
               nothing to switch. */
            <div className="flex  items-center gap-1 rounded-xl bg-[#e4f2fe]  p-1 xl:hidden dark:bg-white/10">
              {VIEWS.map(({ id, label, icon: Icon }) => {
                const active = view === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4f2fe]",
                      active
                        ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-[#e8ecf4] dark:shadow-none"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-[#e8ecf4] dark:text-[#9aa6bd]",
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          }
        />

        <div className="grid grid-cols-1 items-start pt-4 gap-6 xl:grid-cols-[1fr_350px]">
          {/* Left: the four steps */}

          <div
            className={cn(
              "min-w-0 space-y-5 mt-2 xl:block",
              view === "build" || "hidden",
            )}
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
              "min-w-0 xl:sticky mt-2 xl:top-4 xl:block",
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
