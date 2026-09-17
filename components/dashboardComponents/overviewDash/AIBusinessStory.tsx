"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Hourglass,
  Flag,
  Settings,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";

/**
 * Colour segments come from the model, so the palette lives here rather than
 * in the model output. Green/red read as performance, and both get a soft
 * highlight wash so the movement is scannable without shouting.
 */
const TEXT_COLORS = {
  default: "text-gray-700",
  green: "text-green-700 font-semibold",
  red: "text-red-600 font-semibold",
};

const SEGMENT_MARKERS = {
  default: "",
  green: "bg-green-100/70 rounded-[3px] box-decoration-clone",
  red: "bg-red-100/70 rounded-[3px] box-decoration-clone",
};

type AiSegments = {
  text: string;
  color: "default" | "green" | "red";
}[];

/**
 * Render the story text with its colour segments and blank-line breaks.
 *
 * A blank line is treated as a paragraph break â€” the model uses it to separate
 * the headline sentence from the supporting detail, and collapsing it into a
 * stray <br> made the card read as one undifferentiated wall of text.
 */

// function StoryBody({ segments }: { segments: AiSegments }) {
//   const paragraphs: React.ReactNode[][] = [[]];

//   segments.forEach((seg, i) => {
//     // Break after a sentence-ending period, but NOT decimal values like 10.00
//     const lines = seg.text.split(/(?<=\.)\s+(?=[A-Z])/);

//     lines.forEach((line, j) => {
//       if (line.trim() === "") {
//         paragraphs.push([]);
//         return;
//       }

//       if (j > 0) {
//         paragraphs[paragraphs.length - 1].push(<br key={`br-${i}-${j}`} />);
//       }

//       const paragraph = paragraphs[paragraphs.length - 1];
//       const lastNode = paragraph[paragraph.length - 1];

//       // Every span is trimmed, so two spans pushed back to back would render
//       // as "end.Next sentence" with no gap. Re-insert the separator the trim
//       // removed — but not after a <br>, where the line already breaks.
//       if (lastNode && lastNode.type !== "br") {
//         paragraph.push(" ");
//       }

//       paragraph.push(
//         <span
//           key={`${i}-${j}`}
//           className={`${TEXT_COLORS[seg.color]} ${SEGMENT_MARKERS[seg.color]}`}
//         >
//           • {line.trim()}
//         </span>,
//       );
//     });
//   });

//   const blocks = paragraphs.filter((p) => p.length > 0);

//   return (
//     <div className="space-y-3">
//       {blocks.map((parts, i) => (
//         <p key={i} className="text-sm leading-7 tracking-[0.1px]">
//           {parts}
//         </p>
//       ))}
//     </div>
//   );
// }
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
          className={`block  w-fit ${TEXT_COLORS[seg.color]} `}
        >
          <span className="mr-2">•</span>
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
        <p key={i} className="text-sm leading-7 tracking-[0.5px]">
          {parts}
        </p>
      ))}
    </div>
  );
}

/** Small read-only chip used in the header strip. */
function MetaChip({
  icon,
  children,
  tone = "violet",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "violet" | "gray";
}) {
  const tones = {
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    gray: "bg-gray-50 border-gray-200 text-gray-500",
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
  const { status, data, error, model, regenerate } = useAiInsightsResult();

  const story = data?.story;
  const needsSetup =
    error?.code === "NOT_CONFIGURED" || error?.code === "AI_DISABLED";

  // The status strip summarises the model's own output, so it doubles as a
  // quick health read: how much was said, and whether anything is flagged.
  const metrics = story
    ? [
        { label: "passages", value: story.segments.length },
        {
          label: "highlights",
          value: story.segments.filter((s) => s.color === "green").length,
        },
        {
          label: "watch-outs",
          value: story.segments.filter((s) => s.color === "red").length,
        },
      ]
    : [];

  return (
    <div className="relative w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/25">
            <Sparkles size={16} className="text-white" />
          </div>
          <ComponentHeader
            title={story?.title ?? "AI Business Story"}
            subHeader={
              story?.subtitle ?? "Synthesizing sales, inventory & customers"
            }
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={regenerate}
            title="Generate again"
            aria-label="Generate again"
            className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
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
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Status strip â€” vibe and summary counts in one scannable row */}
      {!collapsed && story && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          {story.vibe && (
            <MetaChip icon={<Sparkles size={11} />}>{story.vibe}</MetaChip>
          )}
          {metrics.map((m) => (
            <MetaChip key={m.label} tone="gray">
              <span className="text-gray-900">{m.value}</span>
              {m.label}
            </MetaChip>
          ))}
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div className="px-6 pb-5">
          {status === "loading" && (
            <div className="space-y-2.5" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 bg-gray-100 rounded animate-pulse"
                  style={{ width: `${100 - i * 12}%` }}
                />
              ))}
              <p className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                <Hourglass size={12} className="animate-pulse" />
                Reading today&apos;s numbersâ€¦
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border-gray-100 bg-gray-50/70 px-5 py-5 text-center">
              <p className="text-sm text-gray-600">{error?.message}</p>
              {needsSetup ? (
                <a
                  href="/settings/api-keys"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4 py-2 transition-colors"
                >
                  <Settings size={13} /> Open API key settings
                </a>
              ) : (
                <button
                  onClick={regenerate}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4 py-2 transition-colors"
                >
                  <RefreshCw size={12} /> Try again
                </button>
              )}
            </div>
          )}

          {status === "success" && story && (
            <>
              <StoryBody segments={story.segments} />

              {/* Priority block â€” omitted when the model found nothing pressing */}
              {story.priority && (
                <div className="mt-5 flex gap-3 rounded-xl border-amber-200 bg-amber-50/70 p-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Flag size={14} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      {story.priority.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                      {story.priority.text}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {status === "success" && !story && (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-500">
                The AI returned no story this time.
              </p>
              <button
                onClick={regenerate}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-2 transition-colors"
              >
                <RefreshCw size={12} /> Generate again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-3 items-center justify-between gap-2">
        <span className="inline-flex items-center  gap-1.5 text-[11px] text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          {model ? `Generated with ${model}` : "Generated by Gemini"}
        </span>
        <a
          href="/records"
          className="inline-flex items-center gap-1  ml-2 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          See full business details
          <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
