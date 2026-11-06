"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceScreenshot from "@/public/InvoiceScreenshot.png";
import AiBusinessStory from "@/public/ai-business-story.png";
import { DARK_GRID_STYLE, GRID_STYLE } from "../content";
import { COMPANY } from "../content";
import NavbarWelcome from "../../NavbarWelcome";
import { useState } from "react";

const highlights = [
  "Sales forecasts and product recommendations",
  "Menu, pricing, and stock guidance",
  "Customer retention message drafts",
];

const getPreviewStyle = (id: number, activePreview: number) => {
  const slot = (id - activePreview + 3) % 3;

  const positions = [
    {
      left: "0%",
      top: "0%",
      width: "88%",
      zIndex: 30,
      opacity: 1,
      scale: 1,
    },
    {
      left: "38%",
      top: "27%",
      width: "62%",
      zIndex: 20,
      opacity: 0.96,
      scale: 0.96,
    },
    {
      left: "0%",
      top: "60%",
      width: "34%",
      zIndex: 10,
      opacity: 0.88,
      scale: 0.92,
    },
  ];

  const position = positions[slot];

  return {
    left: position.left,
    top: position.top,
    width: position.width,
    zIndex: position.zIndex,
    opacity: position.opacity,
    transform: `translate3d(0, 0, 0) scale(${position.scale})`,
    transformOrigin: "top left",

    transition:
      "left 1500ms cubic-bezier(0.22, 1, 0.36, 1), top 1500ms cubic-bezier(0.22, 1, 0.36, 1), width 1500ms cubic-bezier(0.22, 1, 0.36, 1), transform 1500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1500ms ease, box-shadow 500ms ease, border-color 500ms ease",

    transitionDelay: "80ms",
  };
};

export default function InvoiceAiHero({ token }: { token?: string }) {
  const [activePreview, setActivePreview] = useState(0);

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

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:px-12 md:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24">
        <div className="lg:col-span-6">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#244074]/25 bg-[#244074]/10 px-3 py-1 text-[11px] font-semibold leading-4 text-[#244074] dark:text-[#7ba2e3] sm:text-xs">
            <Zap size={11} aria-hidden="true" />
            <span className="sm:hidden">AI insights for your POS data</span>
            <span className="hidden sm:inline">
              Turn your business POS data into AI-powered guidance
            </span>
          </span>

          <div className="mt-5 flex flex-col items-left gap-0.5">
            {token && <NavbarWelcome />}
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tighter text-[#1b2537] sm:text-5xl lg:text-[3.5rem] dark:text-[#e8ecf4]">
              Make more of your POS data.
              <span className="mt-1 block text-[#244074] dark:text-[#7ba2e3]">
                Put AI to work for growth.
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-lg text-[14px] leading-relaxed text-gray-500 sm:text-[17px] dark:text-[#9aa6bd]">
            Use your Rebuzz POS sales and customer data to get forecasts,
            product and menu suggestions, pricing and stock guidance, and
            customer retention insights with ready-to-use message drafts. Turn
            those signals into practical strategies and make decisions faster.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-xl bg-[#244074] px-7 text-base font-semibold text-white shadow-lg shadow-[#244074]/20 transition-all hover:bg-[#1b3159] hover:shadow-[#244074]/30"
            >
              <Link
                href={token ? "/dashboard" : "/signup"}
                className="flex items-center justify-center gap-2"
              >
                {token ? "Go to dashboard" : "Start for free"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-gray-200 bg-white px-7 text-base font-medium text-gray-700 transition-colors hover:bg-[#E26924] hover:text-white dark:border-white/10 dark:bg-[#0f1420] dark:text-[#c3ccdc] dark:hover:text-white"
            >
              <Link href={token ? "/dashboard/ai-insights" : "#ai-insights"}>
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

          {/* {(() => {
            const previews = [
              {
                id: 0,
                label: "POS dashboard",
              },
              {
                id: 1,
                label: "AI insights",
              },
              {
                id: 2,
                label: "Rebuzz on YouTube",
              },
            ];

            return null;
          })()} */}

          <div className="relative mx-auto w-full max-w-3xl">
            <div className="relative aspect-[1.18] w-full sm:aspect-[1.2]">
              {/* POS Dashboard */}
              <div
                onClick={() => setActivePreview(0)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePreview(0);
                  }
                }}
                aria-label="Focus POS dashboard preview"
                className={`absolute cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-xl ring-1 ring-gray-900/5  dark:bg-[#0f1420] ${
                  activePreview === 0
                    ? "border-[#244074]/50 shadow-2xl shadow-[#244074]/20 ring-2 ring-[#244074]/20"
                    : "border-gray-200 shadow-lg dark:border-white/10"
                }`}
                style={getPreviewStyle(0, activePreview)}
              >
                <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5 sm:px-4 sm:py-2.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200 dark:bg-[#0f1420] dark:text-[#a9b4c7] dark:ring-white/20 sm:ml-3 sm:text-[11px]">
                    Business POS overview
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

              {/* AI Business Insights */}
              <div
                onClick={() => setActivePreview(1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePreview(1);
                  }
                }}
                aria-label="Focus AI business insights preview"
                className={`absolute cursor-pointer overflow-hidden rounded-xl border bg-white shadow-2xl ring-1 ring-gray-900/5  dark:bg-[#0f1420] sm:rounded-2xl ${
                  activePreview === 1
                    ? "border-[#244074]/50 shadow-2xl shadow-[#244074]/20 ring-2 ring-[#244074]/20"
                    : "border-gray-200 dark:border-white/10"
                }`}
                style={getPreviewStyle(1, activePreview)}
              >
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0f1420] sm:px-4">
                  <span className="flex min-w-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#244074] dark:text-[#7ba2e3] sm:text-[10px]">
                    <Sparkles size={13} />
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

              {/* YouTube Preview */}
              <div
                className={`absolute aspect-[4/3] overflow-hidden rounded-xl border border-white/20 bg-[#102447] shadow-2xl ring-1 ring-gray-900/5  sm:rounded-2xl ${
                  activePreview === 2
                    ? "shadow-2xl shadow-[#244074]/30 ring-2 ring-[#244074]/30"
                    : ""
                }`}
                style={getPreviewStyle(2, activePreview)}
              >
                <Link
                  href={COMPANY.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Browse Rebuzz on YouTube"
                  className="group absolute inset-0 flex flex-col justify-between p-3 text-white sm:p-4"
                >
                  <Image
                    src={AiBusinessStory}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 35vw, 20vw"
                    className="object-cover opacity-45 transition-transform duration-500 group-hover:scale-105"
                  />

                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#102447] via-[#102447]/45 to-[#102447]/10"
                  />

                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#244074] shadow-lg transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <Play size={15} fill="currentColor" />
                  </span>

                  <span className="relative">
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:text-[10px]">
                      Rebuzz on YouTube
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-tight sm:text-sm">
                      Browse videos
                    </span>
                  </span>
                </Link>

                {/* Focus YouTube without opening it */}
                <button
                  type="button"
                  onClick={() => setActivePreview(2)}
                  aria-label="Focus YouTube preview"
                  className="absolute inset-0 z-10 cursor-pointer"
                />
              </div>
            </div>

            {/* Circular focus selector */}
            <div className="relative z-40  flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                {[
                  { id: 0, label: "POS dashboard" },
                  { id: 1, label: "AI insights" },
                  { id: 2, label: "YouTube" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePreview(item.id)}
                    aria-label={`Focus ${item.label}`}
                    aria-pressed={activePreview === item.id}
                    className={`group flex h-9 items-center justify-center rounded-full transition-all duration-700 ease-in-out motion-reduce:duration-0 ${
                      activePreview === item.id
                        ? "bg-[#244074] px-4 shadow-lg shadow-[#244074]/20"
                        : "w-9 border border-gray-200 bg-white hover:border-[#244074]/40 hover:bg-[#244074]/5 dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    {activePreview === item.id ? (
                      <span className="whitespace-nowrap text-[10px] font-semibold text-white">
                        {item.label}
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-gray-400 transition-colors group-hover:bg-[#E26924]" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-center text-[11px] text-gray-500 dark:text-[#9aa6bd]">
                Select a preview to bring it into focus
              </p>
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
