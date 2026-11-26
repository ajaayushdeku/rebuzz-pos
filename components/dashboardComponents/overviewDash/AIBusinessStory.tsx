"use client";

import { useState } from "react";

import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Hourglass,
  Flag,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";
import AiInsightsErrorState from "@/components/aiInsights/AiInsightsErrorState";

/**
 * Colour segments come from the model, so the palette lives here rather than
 * in the model output. Green/red read as performance, and both get a soft
 * highlight wash so the movement is scannable without shouting.
 */
const TEXT_COLORS = {
  default: "text-gray-700 dark:text-[#c3ccdc]",
  green: "text-green-700 font-semibold dark:text-emerald-300",
  red: "text-red-600 font-semibold dark:text-red-300",
};

const SEGMENT_MARKERS = {
  default: "",
  green:
    "bg-green-100/70 rounded-[3px] box-decoration-clone dark:bg-emerald-400/15",
  red: "bg-red-100/70 rounded-[3px] box-decoration-clone dark:bg-red-400/15",
};

type AiSegments = {
  text: string;
  color: "default" | "green" | "red";
}[];

/**
 * Render the story text with its colour segments and blank-line breaks.
 *
 * A blank line is treated as a paragraph break — the model uses it to separate
 * the headline sentence from the supporting detail, and collapsing it into a
 * stray <br> made the card read as one undifferentiated wall of text.
 */

type ChipTone = "violet" | "gray" | "green" | "red";

function StoryBody({ segments }: { segments: AiSegments }) {
  const paragraphs: React.ReactNode[][] = [[]];

  segments.forEach((seg, i) => {
    const lines = seg.text.split(/(?<=\.)\s+(?=[A-Z])/);

    lines.forEach((line, j) => {
      if (line.trim() === "") {
        paragraphs.push([]);
        return;
      }

      paragraphs[paragraphs.length - 1].push(
        <span
          key={`${i}-${j}`}
          className={`block w-fit ${TEXT_COLORS[seg.color]}`}
        >
          <span className="mr-1">•</span>
          <span
            className={`px-2 ${TEXT_COLORS[seg.color]} w-fit ${SEGMENT_MARKERS[seg.color]}`}
          >
            {line.trim()}
          </span>
        </span>,
      );
    });
  });

  const blocks = paragraphs.filter((p) => p.length > 0);

  return (
    <div className="space-y-3">
      {blocks.map((parts, i) => (
        <p key={i} className="text-[13px] leading-7 tracking-[0.5px]">
          {parts}
        </p>
      ))}
    </div>
  );
}

/**
 * Small read-only chip used in the header strip.
 */
function MetaChip({
  icon,
  children,
  tone = "violet",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: ChipTone;
}) {
  const tones: Record<ChipTone, string> = {
    violet:
      "bg-violet-50 border-violet-100 text-violet-700 dark:bg-violet-400/10 dark:border-violet-400/20 dark:text-violet-300",
    gray: "bg-gray-50 border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/15 dark:text-[#c3ccdc]",
    green:
      "bg-green-50 border-green-200 text-green-700 dark:bg-emerald-400/10 dark:border-emerald-400/25 dark:text-emerald-300",
    red: "bg-red-50 border-red-200 text-red-600 dark:bg-red-400/10 dark:border-red-400/25 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

export default function AIBusinessStory() {
  const [collapsed, setCollapsed] = useState(false);

  const { status, data, error, model, regenerate, newSalesCount } =
    useAiInsightsResult();

  const story = data?.story;

  // The status strip summarises the model's own output.
  const metrics: { label: string; value: number; tone: ChipTone }[] = story
    ? [
        { label: "passages", value: story.segments.length, tone: "gray" },
        {
          label: "highlights",
          value: story.segments.filter((s) => s.color === "green").length,
          tone: "green",
        },
        {
          label: "watch-outs",
          value: story.segments.filter((s) => s.color === "red").length,
          tone: "red",
        },
      ]
    : [];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#e3e3e3] bg-white dark:border-white/10 dark:bg-[#161d2e]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4285F4] via-[#8E63CE] to-[#D96570] shadow-sm shadow-[#8E63CE]/25">
            <Sparkles size={16} className="text-white" />
          </div>

          <div className="min-w-0">
            <h3 className="text-[15px] font-normal text-[#3c4043] dark:text-[#e8ecf4]">
              {story?.title ?? "AI Business Story"}
            </h3>
            <p className="mt-0.5 text-xs tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
              {story?.subtitle ?? "Synthesizing sales, inventory & customers"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {newSalesCount > 0 && (
            <div className="inline-flex items-center gap-1.5">
              <div
                title={`${newSalesCount} new ${newSalesCount === 1 ? "sale" : "sales"} since this insight was generated`}
                aria-label={`${newSalesCount} new ${newSalesCount === 1 ? "sale" : "sales"} since insight generation`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-50 to-white px-2 py-1 shadow-sm dark:border-blue-400/20 dark:from-blue-400/10 dark:to-blue-400/5"
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
              </div>

              <ArrowRight
                size={15}
                strokeWidth={2.5}
                className="animate-[bounce-right_1s_ease-in-out_infinite] text-blue-500 dark:text-blue-400"
              />
            </div>
          )}
          <button
            onClick={regenerate}
            title="Generate again"
            aria-label="Generate again"
            className={`relative cursor-pointer rounded-lg p-1.5 text-[#9aa0a6] transition-colors hover:bg-violet-50 hover:text-violet-600 dark:text-[#9aa6bd] dark:hover:bg-violet-400/15 dark:hover:text-violet-300 ${
              newSalesCount > 0
                ? "animate-pulse text-emerald-600 dark:text-emerald-400"
                : ""
            }`}
          >
            <RefreshCw
              size={14}
              className={status === "loading" ? "animate-spin" : undefined}
            />
          </button>

          <button
            onClick={() => setCollapsed((p) => !p)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand story" : "Collapse story"}
            className="cursor-pointer rounded-lg p-1.5 text-[#9aa0a6] transition-colors hover:bg-[#f1f3f4] hover:text-[#3c4043] dark:text-[#9aa6bd] dark:hover:bg-white/10 dark:hover:text-[#e8ecf4]"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Animated content */}
      <div
        className={`mt-2 grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div
          className={`min-h-0 overflow-hidden transition-[opacity,transform] duration-200 ease-in-out motion-reduce:transition-none ${
            collapsed
              ? "translate-y-[-6px] opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {/* Status strip */}
          {story && (
            <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
              {story.vibe && (
                <MetaChip icon={<Sparkles size={11} />}>{story.vibe}</MetaChip>
              )}

              {metrics.map((m) => (
                <MetaChip key={m.label} tone={m.tone}>
                  <span className="font-bold">{m.value}</span>
                  {m.label}
                </MetaChip>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="px-6 ">
            <div className="px-2 pb-5">
              {status === "loading" && (
                <div className="space-y-2.5" aria-busy>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3.5 bg-gray-100 rounded animate-pulse dark:bg-white/10"
                      style={{ width: `${100 - i * 12}%` }}
                    />
                  ))}

                  <p className="flex items-center gap-1.5 pt-1 text-xs text-[#9aa0a6] dark:text-[#9aa6bd]">
                    <Hourglass size={12} className="animate-pulse" />
                    Reading today&apos;s numbers ¦
                  </p>
                </div>
              )}

              {status === "error" && (
                <AiInsightsErrorState error={error} onRetry={regenerate} />
              )}

              {status === "success" && story && (
                <>
                  <StoryBody segments={story.segments} />

                  {story.priority && (
                    <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/25 dark:bg-amber-400/10">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 dark:bg-amber-400/15">
                        <Flag
                          size={14}
                          className="text-amber-600 dark:text-amber-300"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          {story.priority.label}
                        </p>
                        <p className="mt-1 text-[13px] tracking-wide text-gray-700 leading-relaxed dark:text-[#c3ccdc]">
                          {story.priority.text}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {status === "success" && !story && (
                <div className="py-6 text-center">
                  <p className="text-sm text-[#3c4043] dark:text-[#e8ecf4]">
                    The AI returned no story this time.
                  </p>

                  <button
                    onClick={regenerate}
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-[11px] text-[#3c4043] transition-colors hover:bg-[#f8f9fa] dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <RefreshCw size={12} /> Generate again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-3 dark:border-white/10 dark:bg-white/5">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-[#8b929e] dark:text-[#9aa6bd]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          {model ? `Generated with ${model}` : "Generated by Gemini"}
        </span>
      </div>
    </div>
  );
}
