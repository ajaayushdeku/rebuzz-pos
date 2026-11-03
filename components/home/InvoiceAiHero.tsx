import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceScreenshot from "@/public/InvoiceScreenshot.png";
import AiBusinessStory from "@/public/ai-business-story.png";
import { DARK_GRID_STYLE, GRID_STYLE } from "./content";
import NavbarWelcome from "../NavbarWelcome";

const guestHighlights = [
  "Create invoices and manage customer credit",
  "AI insights from sales and inventory data",
  "Track stock, payments, and daily sales",
  "Multi-currency support for growing businesses",
];

const signedInHighlights = [
  "Create invoices and manage customer credit",
  "Review AI insights from your business data",
  "Track stock, payments, and sales",
  "Turn business trends into practical next steps",
];

export default function InvoiceAiHero({ token }: { token?: string }) {
  const highlights = token ? signedInHighlights : guestHighlights;

  return (
    <section className="relative -mt-[61px] overflow-hidden border-b border-gray-100 bg-[#f7f8fb] pt-[61px] dark:border-white/10 dark:bg-[#131a29]">
      <div
        aria-hidden
        className="absolute inset-0 dark:hidden"
        style={GRID_STYLE}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden dark:block"
        style={DARK_GRID_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#244074]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-[#E26924]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white dark:to-[#0f1420]"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:px-16 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#244074]/25 bg-[#244074]/10 px-3 py-1 text-xs font-semibold text-[#244074] dark:text-[#7ba2e3]">
            <Zap size={11} aria-hidden="true" />
            Invoicing and AI insights for growing businesses worldwide
          </span>

          <div className="mt-5 flex flex-col items-left gap-0.5">
            {token && <NavbarWelcome />}
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tighter text-[#1b2537] sm:text-5xl lg:text-[3.5rem] dark:text-[#e8ecf4]">
              Invoices for today.
              <span className="mt-1 block text-[#244074] dark:text-[#7ba2e3]">
                AI insights for what&apos;s next.
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-500 md:text-lg dark:text-[#9aa6bd]">
            Create invoices, manage customer credit, and track inventory in one
            POS. Rebuzz turns your sales data into business insights and
            practical suggestions for your next decision.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-xl bg-[#244074] px-7 text-base font-semibold text-white shadow-lg shadow-[#244074]/20 transition-all hover:bg-[#1b3159] hover:shadow-[#244074]/30"
            >
              <Link
                href={token ? "/invoices/add" : "/signup"}
                className="flex items-center justify-center gap-2"
              >
                {token ? "Create an invoice" : "Start for free"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-gray-200 bg-white px-7 text-base font-medium text-gray-700 transition-colors hover:bg-[#E26924] hover:text-white dark:border-white/10 dark:bg-[#0f1420] dark:text-[#c3ccdc] dark:hover:text-white"
            >
              <Link
                href={token ? "/dashboard/ai-insights" : "#ai-insights"}
              >
                {token ? "Explore AI insights" : "See AI insights"}
              </Link>
            </Button>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#a9b4c7]"
              >
                <CheckCircle2
                  size={14}
                  aria-hidden="true"
                  className="shrink-0 text-[#E26924]"
                />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-6 lg:-mr-10 xl:-mr-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[#244074]/10 blur-2xl"
          />

          <div className="relative mx-auto w-full max-w-2xl pb-20 pt-2 sm:pb-24">
            <div className="relative z-0 w-[94%] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 ring-1 ring-gray-900/5 dark:border-white/10 dark:bg-[#0f1420]">
              <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5 sm:px-4 sm:py-2.5">
                <span className="h-2 w-2 rounded-full bg-red-400 sm:h-2.5 sm:w-2.5" />
                <span className="h-2 w-2 rounded-full bg-yellow-400 sm:h-2.5 sm:w-2.5" />
                <span className="h-2 w-2 rounded-full bg-green-400 sm:h-2.5 sm:w-2.5" />
                <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200 dark:bg-[#0f1420] dark:text-[#a9b4c7] dark:ring-white/20 sm:ml-3 sm:text-[11px]">
                  Invoicing &amp; sales overview
                </span>
              </div>
              <Image
                src={InvoiceScreenshot}
                placeholder="blur"
                quality={85}
                alt="Rebuzz POS sales dashboard with sales and order overview"
                className="h-auto w-full"
                priority
                sizes="(max-width: 1024px) 90vw, 48vw"
              />
            </div>

            <div className="absolute bottom-0 right-0 z-10 w-[76%] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/20 ring-1 ring-gray-900/5 dark:border-white/10 dark:bg-[#0f1420] sm:-right-2 sm:w-[70%] sm:rounded-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0f1420] sm:px-4">
                <span className="flex min-w-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#244074] dark:text-[#7ba2e3] sm:text-[10px]">
                  <Sparkles size={13} aria-hidden="true" />
                  <span className="truncate">AI business insights</span>
                </span>
                <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                  Sample data
                </span>
              </div>
              <Image
                src={AiBusinessStory}
                alt="Sample Rebuzz POS AI insights showing business trends and a suggested action"
                className="h-auto w-full"
                quality={85}
                sizes="(max-width: 1024px) 70vw, 34vw"
              />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-gray-500 dark:text-[#9aa6bd]">
            Product previews shown with sample business data.
          </p>
        </div>
      </div>
    </section>
  );
}
