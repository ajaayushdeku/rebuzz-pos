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
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <ProviderLogo provider="gemini" size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-[13px] sm:text-[15px] font-normal text-[#3c4043] dark:text-[#e8ecf4]">
              AI Insights Progress
            </h3>
            <p className="mt-0.5 text-[11px] sm:text-xs   max-w-xl truncate  tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd]">
              {periodLabel ? `${summary} for ${periodLabel}` : summary}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300">
            {completedCount}/{PERIOD_CHECKPOINTS.length}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={
              expanded ? "Collapse progress details" : "Expand progress details"
            }
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
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

      {expanded && (
        <>
          {/* Compact cards: one column on a phone, two once there is room.
              Each row keeps its section's own header icon tinted by status, so
              the list reads as the page's sections rather than generic dots —
              only the transient states (loading/generating/failed) swap the
              icon for a spinner or alert. */}
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERIOD_CHECKPOINTS.map((section) => {
              const status = getStatus(section.key);
              const details = statusDetails[status];
              const failure = failedSections.get(section.key);
              const SectionIcon = section.icon;
              const isActive = status === "loading" || status === "generating";

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

          {/* The generate action, at the foot of the card: it only shows when
              there is actually something missing to generate, which is exactly
              when this card's checklist has pending rows — no separate banner
              needed. Hidden while the page is still reading, so the button
              cannot fire before the page knows what is missing. */}
          {canGenerate && !isLoading && missingSections.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                {isGenerating
                  ? `Generating ${missingSections.length} missing section${missingSections.length === 1 ? "" : "s"} — the checklist above fills in as each one lands.`
                  : `${missingSections.length} section${missingSections.length === 1 ? " is" : "s are"} not generated yet for ${periodLabel ?? "this period"}. Generating uses your saved AI key and runs two sections at a time.`}
              </p>
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="
    mt-2 inline-flex w-full sm:w-auto
    items-center justify-center gap-2
    rounded-xl border border-blue-200
    bg-blue-50 px-5 py-2.5
    text-[13px] font-semibold tracking-wide
    text-blue-700
    shadow-sm
    transition-all duration-200
    hover:border-blue-400 hover:bg-blue-100
    hover:shadow-md hover:shadow-blue-500/10
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-blue-500
    focus-visible:ring-offset-2
    focus-visible:ring-offset-white
    disabled:cursor-not-allowed
    disabled:opacity-50 disabled:hover:shadow-sm
    dark:border-blue-400/30
    dark:bg-blue-500/10 dark:text-blue-300
    dark:hover:border-blue-400/60
    dark:hover:bg-blue-500/20
    dark:hover:shadow-blue-400/5
    dark:focus-visible:ring-offset-gray-900
  "
                  //   style={{
                  //     background: geminiButton.bg,
                  //     color: geminiButton.ink,
                  //   }}
                  onMouseEnter={(event) => {
                    if (!isGenerating)
                      event.currentTarget.style.background = geminiButton.hover;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = geminiButton.bg;
                  }}
                >
                  {isGenerating ? (
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <ProviderLogo provider="gemini" size={16} />
                  )}
                  {isGenerating
                    ? `Generating…${progress ? ` ${progress.done} of ${progress.total}` : ""}`
                    : `Generate Insights  ( ${missingSections.length} missing )`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
