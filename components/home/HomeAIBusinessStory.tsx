"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Flag,
  AlertTriangle,
  TrendingUp,
  MessageSquareText,
  ShoppingCart,
} from "lucide-react";

import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";

type SegmentColor = "default" | "green" | "red";

const segmentTypes: {
  color: SegmentColor;
  title: string;
  emptyMessage: string;
  icon: typeof Sparkles;
  containerClass: string;
  iconClass: string;
}[] = [
  {
    color: "default",
    title: "Business Overview",
    emptyMessage: "No general business updates are available right now.",
    icon: MessageSquareText,
    containerClass:
      "border-gray-200/80 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.025]",
    iconClass: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  },
  {
    color: "green",
    title: "Positive Highlights",
    emptyMessage: "No positive highlights have been reported for this period.",
    icon: TrendingUp,
    containerClass:
      "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-400/20 dark:bg-emerald-400/[0.035]",
    iconClass:
      "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  {
    color: "red",
    title: "Needs Attention",
    emptyMessage: "Nothing requiring special attention has been highlighted.",
    icon: AlertTriangle,
    containerClass:
      "border-red-200/70 bg-red-50/40 dark:border-red-400/20 dark:bg-red-400/[0.035]",
    iconClass:
      "bg-red-100/80 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  },
];

export default function HomeAiBusinessStory() {
  const { status, data, newSalesCount } = useAiInsightsResult();

  const story = data?.story;

  const isLoading = status === "loading";
  const hasStory = status === "success" && !!story;

  return (
    <section className="mx-auto w-full max-w-7xl pt-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1420]">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.07] sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4285F4] via-[#8E63CE] to-[#D96570] shadow-sm shadow-[#8E63CE]/20">
            <Sparkles size={18} className="text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold tracking-tight text-gray-900 dark:text-[#e8ecf4]">
              {story?.title ?? "Your Business at a Glance"}
            </h3>
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-[#9aa6bd]">
              {story?.vibe ?? "AI-powered business summary"}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {newSalesCount > 0 && (
              <span
                title={`${newSalesCount} new ${newSalesCount === 1 ? "sale" : "sales"} since this insight was generated`}
                aria-label={`${newSalesCount} new ${newSalesCount === 1 ? "sale" : "sales"}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-50 to-white px-2.5 py-1.5 shadow-sm dark:border-blue-400/20 dark:from-blue-400/10 dark:to-blue-400/5"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-500/15 dark:bg-blue-400 dark:ring-blue-400/20" />
                </span>

                <ShoppingCart
                  size={12}
                  strokeWidth={2.2}
                  className="text-blue-700 dark:text-blue-300"
                />

                <span className="text-xs font-bold tabular-nums text-blue-800 dark:text-blue-300">
                  {newSalesCount}
                </span>

                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                  {newSalesCount === 1 ? "New Sale" : "New Sales"}
                </span>
              </span>
            )}

            {story?.view === "live" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Story segments */}
        <div className="space-y-4 px-5 pt-5 pb-3 sm:space-y-5 sm:px-6 sm:pt-6 sm:pb-4">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="space-y-3 rounded-xl border border-gray-200/80 p-4 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
                    <div className="h-3.5 w-36 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                  </div>
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : hasStory ? (
            segmentTypes.map((type) => {
              const Icon = type.icon;

              const segment = story.segments.find(
                (item) => item.color === type.color,
              );

              return (
                <div
                  key={type.color}
                  className={`rounded-xl border px-4 py-3 transition-colors duration-200 ${type.containerClass}`}
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${type.iconClass}`}
                    >
                      <Icon size={15} strokeWidth={2} />
                    </div>

                    <h4 className="text-[13px] font-semibold tracking-tight text-gray-900 dark:text-[#e8ecf4]">
                      {type.title}
                    </h4>
                  </div>

                  {segment ? (
                    <p className="line-clamp-2 pl-[42px] text-[13px] leading-[1.7] text-gray-600 dark:text-[#c3ccdc]">
                      {segment.text}
                    </p>
                  ) : (
                    <p className="pl-[42px] text-[12px] leading-relaxed text-gray-400 dark:text-[#8793a8]">
                      {type.emptyMessage}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-white/10">
              <Sparkles
                size={20}
                className="mx-auto mb-2 text-gray-400 dark:text-gray-500"
              />
              <p className="text-sm font-medium text-gray-600 dark:text-[#c3ccdc]">
                Business insights are temporarily unavailable.
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-[#8793a8]">
                Please check back later.
              </p>
            </div>
          )}

          {/* Recommended action */}
          {hasStory && story.priority && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.055]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 dark:bg-amber-400/10">
                <Flag
                  size={15}
                  className="text-amber-600 dark:text-amber-300"
                />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                  {story.priority.label}
                </p>

                <p className="mt-1 text-[13px] leading-relaxed text-gray-700 dark:text-[#c3ccdc]">
                  {story.priority.text}
                </p>
              </div>
            </div>
          )}

          {/* Footer link */}
          <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/[0.07]">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-md text-[12px] font-semibold text-[#244074] transition-colors hover:text-blue-600 dark:text-[#8eaff0] dark:hover:text-blue-300"
            >
              Read Full Story
              <ArrowRight
                size={15}
                className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
