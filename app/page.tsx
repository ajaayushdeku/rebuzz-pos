import { cookies } from "next/headers";

import HomeNavbar from "@/components/home/HomeNavbar";
import InvoiceAiHero from "@/components/home/sections/InvoiceAiHero";
import { InvoiceCreditWorkflowSection } from "@/components/home/InvoiceCreditWorkflowSection";
import AiRecommendationsSection from "@/components/home/sections/AiRecommendationsSection";
import BusinessToolsSection from "@/components/home/BusinessToolsSection";
import AiTrustSetupSection from "@/components/home/AiTrustSetupSection";
import ProductExamplesSection from "@/components/home/sections/ProductExamplesSection";
import FinalSignupSection from "@/components/home/sections/FinalSignupSection";
import PricingSection from "@/components/home/sections/PricingSection";
import GlobalAboutSection from "@/components/home/GlobalAboutSection";
import GlobalFaqSection from "@/components/home/sections/GlobalFaqSection";
import HomeFooter from "@/components/home/HomeFooter";
import AiInsightsSection from "@/components/home/sections/AiInsightsSection";
import { hasSavedAiKey } from "@/lib/ai-insights/hasSavedAiKey.server";
import { AiInsightsProvider } from "@/components/aiInsights/AiInsightsProvider";
import { collectBriefingData } from "@/lib/ai-insights/collectBriefingData.server";

/**
 * The marketing page.
 *
 * Each band is its own component in `components/home/sections`, so this file is the
 * running order and nothing else: what a visitor meets, in the sequence they
 * meet it. The sections that read differently for a signed-in visitor take
 * the token; the rest never needed to know.
 */
const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const APIKeyActive: boolean = await hasSavedAiKey();
  const briefingData = await collectBriefingData();

  return (
    // The page scrolls inside itself, as the app shell does, and hides the
    // bar while doing it: with nothing drawn there is nothing to appear on
    // one page and vanish on the next. Wheel, touch, keyboard and drag all
    // still scroll it.
    <div className="scrollbar-hide h-dvh overflow-y-auto bg-white dark:bg-[#0f1420]">
      <HomeNavbar token={token} />
      <InvoiceAiHero token={token} />
      {/* <InvoiceCreditWorkflowSection token={token} /> */}

      <AiInsightsProvider briefingData={briefingData}>
        <AiInsightsSection isAPIKeySet={APIKeyActive} />
      </AiInsightsProvider>

      <AiRecommendationsSection token={token} />
      {/* <BusinessToolsSection token={token} />
      <GlobalAboutSection />
      <AiTrustSetupSection token={token} /> */}
      <ProductExamplesSection token={token} />
      <PricingSection />

      <GlobalFaqSection />
      <FinalSignupSection token={token} />
      <HomeFooter token={token} />
    </div>
  );
};

export default Page;
