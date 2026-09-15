"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Flag,
  Settings,
  RefreshCw,
} from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";

const TEXT_COLORS = {
  default: "text-gray-800",
  green: "text-green-600",
  red: "text-red-500",
};

/** Render the story text with its colour segments and blank-line breaks. */
function StoryBody({ segments }: { segments: AiSegments }) {
  const parts: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    seg.text.split("\n").forEach((line, j) => {
      if (j > 0) parts.push(<br key={`br-${i}-${j}`} />);
      if (line) {
        parts.push(
          <span key={`${i}-${j}`} className={TEXT_COLORS[seg.color]}>
            {line}
          </span>,
        );
      }
    });
  });
  return <p className="text-sm leading-relaxed">{parts}</p>;
}

type AiSegments = {
  text: string;
  color: "default" | "green" | "red";
}[];

export default function AIBusinessStory() {
  const [collapsed, setCollapsed] = useState(false);
  const { status, data, error, model, regenerate } = useAiInsightsResult();

  console.log(
    "AIBusinessStory status:",
    status,
    "error:",
    error,
    "model:",
    model,
  );
  console.log("AIBusinessStory data:", data);

  const story = data?.story;
  const needsSetup =
    error?.code === "NOT_CONFIGURED" || error?.code === "AI_DISABLED";

  return (
    <div className="relative bg-white w-full lg:w-[80%] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-violet-600" />
          </div>
          <ComponentHeader
            title={story?.title ?? "AI Business Story"}
            subHeader={
              story?.subtitle ?? "Synthesizing sales, inventory & customers"
            }
          />
        </div>

        <div className="flex items-center gap-2">
          {story?.vibe && (
            <span className="text-xs font-semibold bg-amber-50 border border-amber-100 text-amber-700 rounded-full px-3 py-1">
              {story.vibe}
            </span>
          )}
          <button
            onClick={regenerate}
            title="Generate again"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw
              size={14}
              className={status === "loading" ? "animate-spin" : undefined}
            />
          </button>
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-6 pb-4">
          {status === "loading" && (
            <div className="space-y-2.5" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 bg-gray-100 rounded animate-pulse"
                  style={{ width: `${100 - i * 12}%` }}
                />
              ))}
              <p className="text-xs text-gray-400 pt-1">
                Reading today&apos;s numbers…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600">{error?.message}</p>
              {needsSetup ? (
                <a
                  href="/settings/api-keys"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors"
                >
                  <Settings size={13} /> Open API key settings
                </a>
              ) : (
                <button
                  onClick={regenerate}
                  className="mt-3 text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {status === "success" && story && (
            <>
              <StoryBody segments={story.segments} />

              {/* Priority block — omitted when the model found nothing pressing */}
              {story.priority && (
                <div className="mt-5 border-l-4 border-amber-400 pl-4 py-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flag size={13} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500">
                      {story.priority.label}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {story.priority.text}
                  </p>
                </div>
              )}
            </>
          )}

          {status === "success" && !story && (
            <p className="text-sm text-gray-500 py-4 text-center">
              The AI returned no story this time. Try generating again.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {model ? `Generated with ${model}` : "Generated by Gemini"}
        </span>
        <button className="text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors">
          Show more to see full business details
        </button>
      </div>
    </div>
  );
}
