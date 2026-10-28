"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Flag,
  AlertTriangle,
  TrendingUp,
  MessageSquareText,
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
      "border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]",
    iconClass: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  },
  {
    color: "green",
    title: "Positive Highlights",
    emptyMessage: "No positive highlights have been reported for this period.",
    icon: TrendingUp,
    containerClass:
      "border-emerald-200 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-400/[0.05]",
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  {
    color: "red",
    title: "Needs Attention",
    emptyMessage: "Nothing requiring special attention has been highlighted.",
    icon: AlertTriangle,
    containerClass:
      "border-red-200 bg-red-50/60 dark:border-red-400/20 dark:bg-red-400/[0.05]",
    iconClass: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  },
];

export default function HomeAiBusinessStory() {
  const { status, data } = useAiInsightsResult();
  const story = data?.story;

  //   console.log("Busines AI Story:", story);

  const isLoading = status === "loading";
  const hasStory = status === "success" && !!story;

  return (
    <section className="mx-auto w-full max-w-7xl pt-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1420]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
            <Sparkles size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-[#e8ecf4]">
              {story?.title ?? "Your Business at a Glance"}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#9aa6bd]">
              {story?.vibe ?? "AI-powered business summary"}
            </p>
          </div>

          {story?.view === "live" && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              Live
            </span>
          )}
        </div>

        {/* Story segments grouped by color */}
        <div className="space-y-5 p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/10"
                >
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : hasStory ? (
            segmentTypes.map((type) => {
              const Icon = type.icon;
              const segments = story.segments.filter(
                (segment) => segment.color === type.color,
              );

              return (
                <div
                  key={type.color}
                  className={`rounded-xl border px-4 py-2 ${type.containerClass}`}
                >
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${type.iconClass}`}
                    >
                      <Icon size={16} />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#e8ecf4]">
                      {type.title}
                    </h4>
                    {/* <span className="ml-auto text-xs text-gray-500 dark:text-[#9aa6bd]">
                      {segments.length}
                    </span> */}
                  </div>

                  {/* {segments.length > 0 ? (
                    <div className="space-y-3">
                      {segments.map((segment, index) => (
                        <p
                          key={`${type.color}-${index}`}
                          className="text-sm leading-6 text-gray-700 dark:text-[#c3ccdc]"
                        >
                          {segment.text}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-gray-500 dark:text-[#9aa6bd]">
                      {type.emptyMessage}
                    </p>
                  )} */}
                  {(() => {
                    const segment = segments[0];

                    return segment ? (
                      <p className="line-clamp-2 text-[13px] leading-6 text-gray-700 dark:text-[#c3ccdc]">
                        {segment.text}
                      </p>
                    ) : (
                      <p className="text-[13px] leading-6 text-gray-500 dark:text-[#9aa6bd]">
                        {type.emptyMessage}
                      </p>
                    );
                  })()}
                </div>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-[#9aa6bd]">
              Business insights are not available right now. Please try again
              later.
            </p>
          )}

          {/* Recommended action */}
          {hasStory && story.priority && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.07]">
              <Flag
                size={16}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  {story.priority.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-[#c3ccdc]">
                  {story.priority.text}
                </p>
              </div>
            </div>
          )}

          <div className=" w-full flex justify-end">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-lg text-[13px] hover:underline font-semibold text-[#244074] transition-colors hover:text-blue-700 dark:text-[#8eaff0] dark:hover:text-blue-300"
            >
              Read Full Story
              <ArrowRight
                size={16}
                className="transition-transform duration-300 ease-out group-hover:translate-x-1.5 group-hover:scale-110 motion-reduce:transform-none"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
