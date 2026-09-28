import { cookies } from "next/headers";

import HomeNavbar from "@/components/home/HomeNavbar";
import HomeHero from "@/components/home/HomeHero";
import CapabilityBand from "@/components/home/CapabilityBand";
import FeatureGrid from "@/components/home/FeatureGrid";
import PricingSection from "@/components/home/PricingSection";
import AboutSection from "@/components/home/AboutSection";
import FaqSection from "@/components/home/FaqSection";
import HomeFooter from "@/components/home/HomeFooter";

/**
 * The marketing page.
 *
 * Each band is its own component in `components/home`, so this file is the
 * running order and nothing else: what a visitor meets, in the sequence they
 * meet it. The sections that read differently for a signed-in visitor take
 * the token; the rest never needed to know.
 */
const Page = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    // The page scrolls inside itself, as the app shell does, and hides the
    // bar while doing it: with nothing drawn there is nothing to appear on
    // one page and vanish on the next. Wheel, touch, keyboard and drag all
    // still scroll it.
    <div className="scrollbar-hide h-dvh overflow-y-auto bg-white">
      <HomeNavbar token={token} />
      <HomeHero token={token} />
      <CapabilityBand />
      <FeatureGrid token={token} />
      <PricingSection />
      <AboutSection />
      <FaqSection />
      <HomeFooter token={token} />
    </div>
  );
};

export default Page;
