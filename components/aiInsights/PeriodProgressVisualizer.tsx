"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  HeartHandshake,
  LoaderCircle,
  Database,
  Users,
  type LucideIcon,
  PackageSearch,
  UtensilsCrossed,
  Tags,
  ChartNoAxesCombined,
  Sparkles,
} from "lucide-react";

import ProviderLogo from "@/components/settingsComponents/apiKeys/ProviderLogo";
import ProviderMarkDefs from "@/components/settingsComponents/apiKeys/ProviderMarkDefs";
import { metaFor } from "@/components/settingsComponents/apiKeys/providerMeta";
import { GEMINI_GRADIENT } from "@/components/settingsComponents/apiKeys/googlePalette";

export interface GenerationProgress {
  total: number;
  done: number;
  succeeded: string[];
  active: string[];
  failed: {
    section: string;
    code: string;
    message: string;
  }[];
}

interface PeriodProgressVisualizerProps {
  periodLabel?: string;
  isLoading: boolean;
  isGenerating: boolean;
  storedSections: Record<string, unknown>;
  missingSections: string[];
  progress: GenerationProgress | null;
  /**
   * The generate action lives here now, not in a banner above: it only makes
   * sense when there is something missing, and the checklist right above it
   * is what names those things. Rendered only when `canGenerate` — the page
   * passes an admin-gated handler and nothing otherwise.
   */
  canGenerate: boolean;
  onGenerate: () => void;
}

type CheckpointStatus =
  | "failed"
  | "pending"
  | "loading"
  | "generating"
  | "generated"
  | "saved";

const PERIOD_CHECKPOINTS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "retention", label: "Customer Retention", icon: HeartHandshake },
  { key: "menu-suggestions", label: "Menu Suggestions", icon: UtensilsCrossed },
  { key: "slow-items", label: "Slow-Moving Items", icon: PackageSearch },
  { key: "pricing", label: "Pricing Insights", icon: Tags },
  { key: "hour-playbook", label: "Hourly Sales Playbook", icon: Clock },
  {
    key: "sales-recommendations",
    label: "Sales Recommendations",
    icon: ChartNoAxesCombined,
  },
  { key: "staffing", label: "Staffing Insights", icon: Users },
];

export default function PeriodProgressVisualizer({
  periodLabel,
  isLoading,
  isGenerating,
  storedSections,
  missingSections,
  progress,
  canGenerate,
  onGenerate,
}: PeriodProgressVisualizerProps) {
  /**
   * The card stays on screen for the whole life of the page — during the
   * initial read, during a generation run, and after everything is settled —
   * so the fetch/generate journey is visible in both cases. What collapses is
   * the checklist, not the card: expanded while anything is in flight, then
   * left to the reader (auto-collapsed once everything is restored/generated
   * so a finished page reads clean, one click to reopen).
   */
  const busy = isLoading || isGenerating;
  const [expanded, setExpanded] = useState(true);
  const wasBusy = useRef(busy);

  // Gemini's own button colours for the generate action, matching the key
  // screen: solid brand blue, white ink, darker hover. Read from the provider
  // meta rather than hardcoded so a theme change propagates.
  const geminiButton = metaFor("gemini").button;

  // While work is in flight the detail is forced open — a collapsed card
  // would hide the very progress it exists to show. When work settles
  // (busy → idle) it auto-collapses once so a finished period reads clean;
  // manual toggles in between are left alone.
  useEffect(() => {
    if (busy) {
      setExpanded(true);
    } else if (wasBusy.current) {
      setExpanded(false);
    }
    wasBusy.current = busy;
  }, [busy]);

  const failedSections = new Map(
    (progress?.failed ?? []).map((failure) => [failure.section, failure]),
  );

  const getStatus = (key: string): CheckpointStatus => {
    if (failedSections.has(key)) return "failed";

    if (progress?.succeeded.includes(key)) return "generated";

    if (storedSections[key]) return "saved";

    if (isLoading) return "loading";

    if (isGenerating && progress?.active.includes(key)) {
      return "generating";
    }

    return "pending";
  };

  const completedCount = PERIOD_CHECKPOINTS.filter((section) => {
    const status = getStatus(section.key);
    return status === "saved" || status === "generated";
  }).length;

  const percentage = Math.round(
    (completedCount / PERIOD_CHECKPOINTS.length) * 100,
  );

  // Order the checkpoints by how quickly the data for each one arrived, so the
  // card reads fastest-to-slowest: generated, restored, loading, generating,
  // pending, then failed. Mirrors the ordering in AiInsightsScreen.
  const orderCheckpoint = (key: string): [number, number] => {
    const status = getStatus(key);
    switch (status) {
      case "generated": {
        // The stored section's `generatedAt` is the timestamp of when the data
        // was produced (it predates the visualizer's own progress object). Since
        // `storedSections` is typed `Record<string, unknown>` but the parent
        // passes `insights.data.sections` (which is `Record<string, StoredSection>`),
        // cast it to read the timestamp.
        const stored = (storedSections[key] ?? null) as
          | { generatedAt: string | null }
          | null;
        const timestamp =
          progress?.succeeded.includes(key) && stored?.generatedAt
            ? Date.parse(stored.generatedAt)
            : Number.POSITIVE_INFINITY;
        return [
          0,
          Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp,
        ];
      }
      case "saved": {
        // Restored from storage is the next fastest — it needs no network.
        return [1, 0];
      }
      case "loading": {
        // Currently being fetched.
        return [2, 0];
      }
      case "generating": {
        // Actively generating right now.
        return [3, 0];
      }
      case "pending": {
        // Not started yet.
        return [4, 0];
      }
      case "failed": {
        // Errored last — pull these to the bottom.
        return [5, 0];
      }
      default: {
        return [5, 0];
      }
    }
  };

  const orderedCheckpoints = PERIOD_CHECKPOINTS.sort((a, b) => {
    const [aGroup, aTime] = orderCheckpoint(a.key);
    const [bGroup, bTime] = orderCheckpoint(b.key);
    return aGroup - bGroup || aTime - bTime;
  });

  const statusDetails: Record<
    CheckpointStatus,
    {
      label: string;
      className: string;
      iconClassName: string;
      dotClassName: string;
    }
  > = {
    saved: {
      label: "Restored",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      iconClassName:
        "border-emerald-500/25  text-emerald-600 dark:text-emerald-400",
      dotClassName: "bg-emerald-500",
    },
    generated: {
      label: "Generated",
      className:
        "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      iconClassName: "border-blue-500/25  text-blue-600 dark:text-blue-400",
      dotClassName: "bg-blue-500",
    },
    loading: {
      label: "Loading…",
      className:
        "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      iconClassName: "border-blue-500/25 text-blue-600 dark:text-blue-400",
      dotClassName: "bg-blue-500",
    },
    generating: {
      label: "Generating…",
      className:
        "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
      iconClassName:
        "border-violet-500/25 text-violet-600 dark:text-violet-400",
      dotClassName: "bg-violet-500",
    },
    failed: {
      label: "Failed",
      className:
        "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
      iconClassName: "border-red-500/25 text-red-600 dark:text-red-400",
      dotClassName: "bg-red-500",
    },
    pending: {
      label: "Pending",
      className:
        "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
      iconClassName:
        "border-gray-300 text-gray-500 dark:border-gray-700  dark:text-gray-400",
      dotClassName: "bg-gray-300 dark:bg-gray-600",
    },
  };

  // Collapsed one-liner: what the card says when the checklist is tucked away.
  const summary = busy
    ? isGenerating
      ? "Generating insights…"
      : "Loading saved insights…"
    : failedSections.size > 0
      ? `${failedSections.size} section${failedSections.size === 1 ? "" : "s"} failed`
      : completedCount === PERIOD_CHECKPOINTS.length
        ? "All sections ready"
        : `${completedCount} of ${PERIOD_CHECKPOINTS.length} sections ready`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      {/* The sweep the mark strokes itself with lives in the document here, so
          `fill="url(#…)"` resolves on this page — the API Keys screen mounts
          its own copy, but that tree is not present here. */}
      <ProviderMarkDefs />
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <Sparkles
              className="h-[21px] w-[21px] text-violet-500 drop-shadow-[0_2px_5px_rgba(139,92,246,0.35)]"
              strokeWidth={2}
              aria-hidden="true"
              style={{
                stroke: "url(#ai-icon-gradient)",
              }}
            />
            <svg width="0" height="0" aria-hidden="true">
              <defs>
                <linearGradient
                  id="ai-icon-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="50%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1 text-[13px] sm:text-[15px] font-normal text-[#3c4043] dark:text-[#e8ecf4]">
              AI Insights Progress
            </h3>
            <p className="mt-0.5 text-[11px] sm:text-xs   max-w-xl truncate  tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
              {periodLabel ? `${summary} for ${periodLabel}` : summary}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {canGenerate && !isLoading && missingSections.length > 0 && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              aria-label={
                isGenerating
                  ? "Generating AI insights"
                  : `Generate ${missingSections.length} missing AI insight sections`
              }
              className=" 
                group relative inline-flex min-h-9 cursor-poicale-[0.98]
                focus-visible:ring-offset-2
                focus-visible:ring-2 focus-visible:ring-violet-500
                disabled:cursor-wait disablnter
                rounded-lg border border-violet-600/20
                items-center justify-center gap-2 overflow-hidden
                px-3.5 py-2 text-xs font-semibold text-white
                bg-gradient-to-r from-violet-600 to-indigo-600
                transition-all duration-200 ease-out
                shadow-md shadow-violet-600/15
                hover:border-violet-500
                hover:-translate-y-0.5
                hover:shadow-lg hover:shadow-violet-600/25
                hover:from-violet-700 hover:to-indigo-700
                focus-visible:outline-none
                active:translate-y-0 active:sed:opacity-70
                focus-visible:ring-offset-white
                disabled:hover:shadow-md
                disabled:hover:translate-y-0
                dark:from-violet-500 dark:to-indigo-500
                dark:border-violet-400/25
                dark:hover:from-violet-400 dark:hover:to-indigo-400
                dark:shadow-violet-500/10
                dark:focus-visible:ring-offset-[#161d2e]
                dark:hover:shadow-violet-400/20
              "
            >
              {/* Subtle shine effect */}
              <span
                aria-hidden="true"
                className="
                group-hover:opacity-100
                pointer-events-none absolute inset-0
                bg-gradient-to-r from-transparent
                via-white/10 to-transparent
                opacity-0 transition-opacity duration-200
                "
              />

              {isGenerating ? (
                <LoaderCircle
                  className="relative h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <div className="flex shrink-0 items-center justify-center">
                  <Sparkles
                    className="h-4 w-4 text-white drop-shadow-[0_2px_5px_rgba(139,92,246,0.35)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
              )}

              <span className="relative hidden sm:inline">
                {isGenerating ? "Generating insights…" : "Generate insights"}
              </span>

              <span className="relative sm:hidden">
                {isGenerating ? "Generating…" : "Generate"}
              </span>

              {!isGenerating && missingSections.length > 0 && (
                <span
                  className="
                  tabular-nums text-white
                  relative inline-flex min-w-5 h-5 items-center
                  justify-center rounded-md border border-white/20
                  bg-white/15 px-1 text-[10px] font-bold
                  "
                >
                  {missingSections.length}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            {" "}
            <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">
              {completedCount}/{PERIOD_CHECKPOINTS.length}
            </span>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? "Collapse progress details"
                  : "Expand progress details"
              }
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                  expanded ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={PERIOD_CHECKPOINTS.length}
        aria-valuenow={completedCount}
        aria-label="Completed AI insight sections"
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, background: GEMINI_GRADIENT }}
        />
      </div>

      <div
        aria-hidden={!expanded}
        className={`
    grid transition-[grid-template-rows,opacity]
    duration-300 ease-in-out
    motion-reduce:transition-none
    ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
  `}
      >
        <div className="min-h-0 overflow-hidden">
          <>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {orderedCheckpoints.map((section) => {
                const status = getStatus(section.key);
                const details = statusDetails[status];
                const failure = failedSections.get(section.key);
                const SectionIcon = section.icon;
                const isActive =
                  status === "loading" || status === "generating";

                return (
                  <li
                    key={section.key}
                    className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-3 ${details.className}`}
                  >
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-black/20">
                      {isActive ? (
                        <LoaderCircle
                          className="h-4 w-4 animate-spin"
                          aria-hidden
                        />
                      ) : status === "failed" ? (
                        <CircleAlert className="h-4 w-4" aria-hidden />
                      ) : status === "saved" ? (
                        <Database className="h-4 w-4" aria-hidden />
                      ) : status === "generated" ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : (
                        <SectionIcon className="h-4 w-4" aria-hidden />
                      )}
                      {/* Live dot so the state reads at a glance on a small screen. */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-900 ${details.dotClassName}`}
                        aria-hidden
                      />

                      {!isActive && (
                        <span
                          className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 ${details.iconClassName}`}
                        >
                          {" "}
                          <SectionIcon className="h-2.5 w-2.5" aria-hidden />
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-gray-900 dark:text-gray-100">
                        {section.label}
                      </span>
                      <span className="block text-[11px] font-medium opacity-80">
                        {details.label}
                      </span>
                      {failure && (
                        <span className="mt-0.5 block truncate text-[11px] text-red-600 dark:text-red-400">
                          {failure.message || "Unable to prepare this section."}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            {progress && expanded && (
              <p className="mt-3 border-t border-gray-200 pt-3 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:text-xs">
                {progress.done} of {progress.total} generation tasks processed
                {progress.failed.length > 0 &&
                  ` · ${progress.failed.length} failed`}
              </p>
            )}
          </>
        </div>
      </div>
    </section>
  );
}
