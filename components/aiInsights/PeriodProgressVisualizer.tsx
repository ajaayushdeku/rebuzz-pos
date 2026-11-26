"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  HeartHandshake,
  LoaderCircle,
  Users,
  type LucideIcon,
  PackageSearch,
  UtensilsCrossed,
  Tags,
  ChartNoAxesCombined,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  CalendarDays,
} from "lucide-react";

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

export interface FestivalPrepProgress {
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
  itemCount: number;
}

interface PeriodProgressVisualizerProps {
  periodLabel?: string;
  isLoading: boolean;
  isGenerating: boolean;
  storedSections: Record<string, unknown>;
  missingSections: string[];
  progress: GenerationProgress | null;
  canGenerate: boolean;
  festivalPrepProgress: FestivalPrepProgress;
  onGenerate: () => void;
}

type CheckpointStatus =
  | "failed"
  | "pending"
  | "loading"
  | "generating"
  | "generated"
  | "saved";

const PERIOD_CHECKPOINTS: {
  key: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "retention", label: "Customer Retention", icon: HeartHandshake },
  { key: "menu-suggestions", label: "Menu Suggestions", icon: UtensilsCrossed },
  { key: "slow-items", label: "Slow-Moving Items", icon: PackageSearch },
  { key: "pricing", label: "Pricing Insights", icon: Tags },
  {
    key: "hour-playbook",
    label: "Hourly Sales Playbook",
    icon: Clock,
  },
  {
    key: "sales-recommendations",
    label: "Sales Recommendations",
    icon: ChartNoAxesCombined,
  },
  { key: "staffing", label: "Staffing Insights", icon: Users },
];

const STATUS_STYLES: Record<
  CheckpointStatus,
  {
    label: string;
    container: string;
    icon: string;
    dot: string;
  }
> = {
  saved: {
    label: "Restored",
    container:
      "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-400/15 dark:bg-emerald-400/[0.04]",
    icon: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  generated: {
    label: "Generated",
    container:
      "border-blue-200/80 bg-blue-50/50 dark:border-blue-400/15 dark:bg-blue-400/[0.04]",
    icon: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  loading: {
    label: "Loading saved data",
    container:
      "border-blue-200/80 bg-blue-50/50 dark:border-blue-400/15 dark:bg-blue-400/[0.04]",
    icon: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  generating: {
    label: "Generating",
    container:
      "border-violet-200/80 bg-violet-50/50 dark:border-violet-400/15 dark:bg-violet-400/[0.04]",
    icon: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  failed: {
    label: "Failed",
    container:
      "border-red-200/80 bg-red-50/50 dark:border-red-400/15 dark:bg-red-400/[0.04]",
    icon: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  pending: {
    label: "Waiting",
    container:
      "border-slate-200/80 bg-slate-50/60 dark:border-white/[0.07] dark:bg-white/[0.015]",
    icon: "text-slate-400 dark:text-slate-500",
    dot: "bg-slate-300 dark:bg-slate-600",
  },
};

export const SECTION_ACCENTS: Record<
  string,
  { icon: string; glow: string; border: string; text: string }
> = {
  retention: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    glow: "group-hover:shadow-blue-500/10",
    border: "group-hover:border-blue-300 dark:group-hover:border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  "menu-suggestions": {
    icon: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
    glow: "group-hover:shadow-pink-500/10",
    border: "group-hover:border-pink-300 dark:group-hover:border-pink-500/30",
    text: "text-pink-600 dark:text-pink-400",
  },
  "slow-items": {
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    glow: "group-hover:shadow-rose-500/10",
    border: "group-hover:border-rose-300 dark:group-hover:border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
  },
  pricing: {
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    glow: "group-hover:shadow-emerald-500/10",
    border:
      "group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },

  "hour-playbook": {
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    glow: "group-hover:shadow-violet-500/10",
    border:
      "group-hover:border-violet-300 dark:group-hover:border-violet-500/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  "sales-recommendations": {
    icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
    glow: "group-hover:shadow-cyan-500/10",
    border: "group-hover:border-cyan-300 dark:group-hover:border-cyan-500/30",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  staffing: {
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
    glow: "group-hover:shadow-orange-500/10",
    border:
      "group-hover:border-orange-300 dark:group-hover:border-orange-500/30",
    text: "text-orange-600 dark:text-orange-400",
  },
};

const STATUS_LABELS: Record<CheckpointStatus, string> = {
  saved: "Ready",
  generated: "Generated",
  generating: "Generating",
  loading: "Loading",
  pending: "Waiting",
  failed: "Failed",
};

export default function PeriodProgressVisualizer({
  periodLabel,
  isLoading,
  isGenerating,
  storedSections,
  missingSections,
  progress,
  canGenerate,
  festivalPrepProgress,
  onGenerate,
}: PeriodProgressVisualizerProps) {
  const busy = isLoading || isGenerating;

  const festivalStatus = festivalPrepProgress.isError
    ? "failed"
    : festivalPrepProgress.hasData
      ? festivalPrepProgress.isFetching
        ? "updating"
        : "ready"
      : festivalPrepProgress.isFetching
        ? "loading"
        : "pending";

  const [expanded, setExpanded] = useState(true);
  const wasBusy = useRef(busy);

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

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

  const totalCount = PERIOD_CHECKPOINTS.length;

  const percentage = Math.round((completedCount / totalCount) * 100);

  const orderCheckpoint = (key: string): [number, number] => {
    const status = getStatus(key);

    switch (status) {
      case "generated": {
        const stored = (storedSections[key] ?? null) as {
          generatedAt: string | null;
        } | null;

        const timestamp =
          progress?.succeeded.includes(key) && stored?.generatedAt
            ? Date.parse(stored.generatedAt)
            : Number.POSITIVE_INFINITY;

        return [
          0,
          Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp,
        ];
      }

      case "saved":
        return [1, 0];

      case "loading":
        return [2, 0];

      case "generating":
        return [3, 0];

      case "pending":
        return [4, 0];

      case "failed":
      default:
        return [5, 0];
    }
  };

  const orderedCheckpoints = [...PERIOD_CHECKPOINTS].sort((a, b) => {
    const [aGroup, aTime] = orderCheckpoint(a.key);
    const [bGroup, bTime] = orderCheckpoint(b.key);

    return aGroup - bGroup || aTime - bTime;
  });

  const failedCount = failedSections.size;

  const summary = busy
    ? isGenerating
      ? "Preparing your business insights"
      : "Restoring your saved insights"
    : failedCount > 0
      ? `${failedCount} section${failedCount === 1 ? "" : "s"} need attention`
      : completedCount === totalCount
        ? "Your business insights are ready"
        : `${completedCount} of ${totalCount} insight sections ready`;

  const isComplete = completedCount === totalCount && failedCount === 0;

  const showGenerate = canGenerate && !isLoading && missingSections.length > 0;

  return (
    <section className="min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {/* Icon */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-400/20 dark:from-blue-500/20 dark:to-indigo-500/15 dark:text-blue-300">
            <Sparkles
              className="relative h-[21px] w-[21px] drop-shadow-[0_1px_2px_rgba(37,99,235,0.15)]"
              strokeWidth={1.65}
            />
          </div>

          {/* Heading */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-medium tracking-[0.015em] text-slate-800 dark:text-slate-100 sm:text-[15px]">
                Insights overview
              </h3>

              {isComplete && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                  <Check className="h-3 w-3" strokeWidth={2.2} />
                  Complete
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-[11px] font-normal tracking-[0.015em] text-slate-500 dark:text-slate-400 sm:text-xs">
              {periodLabel ? `${periodLabel} · ${summary}` : summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          {showGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              aria-label={
                isGenerating
                  ? "Generating AI insights"
                  : `Generate ${missingSections.length} missing AI insight sections`
              }
              className="group inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#244074] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-950/10 transition-all hover:-translate-y-0.5 hover:bg-[#1c345f] hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:ring-offset-[#111827]"
            >
              {isGenerating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              <span>{isGenerating ? "Generating…" : "Generate insights"}</span>

              {!isGenerating && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white/15 px-1 text-[10px] font-bold tabular-nums">
                  {missingSections.length}
                </span>
              )}
            </button>
          )}

          <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {completedCount}/{totalCount}
            </span>

            <span className="text-[10px] text-slate-400">ready</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Overall progress
          </span>

          <span className="text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            {percentage}%
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={completedCount}
          aria-label="Completed AI insight sections"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#244074] via-blue-500 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist toggle */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3 dark:border-white/[0.07]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Insight sections
          </span>

          {failedCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-400/10 dark:text-red-400">
              {failedCount} failed
            </span>
          )}

          {busy && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              <LoaderCircle className="h-3 w-3 animate-spin" />
              Working
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          aria-label={
            expanded ? "Collapse insight sections" : "Expand insight sections"
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 cursor-pointer"
        >
          {expanded ? "Hide details" : "View details"}

          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expandable insight cards */}
      <div
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 ">
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {orderedCheckpoints.map((section, index) => {
              const status = getStatus(section.key);
              const failure = failedSections.get(section.key);
              const SectionIcon = section.icon;

              const accent =
                SECTION_ACCENTS[section.key] ?? SECTION_ACCENTS.retention;

              const isActive = status === "loading" || status === "generating";
              const isComplete = status === "saved" || status === "generated";
              const isFailed = status === "failed";

              return (
                <li
                  key={section.key}
                  className={`group relative isolate overflow-hidden rounded-2xl border p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg  motion-reduce:transform-none motion-reduce:transition-none ${
                    isFailed
                      ? "border-red-400/20 bg-[#211b25] dark:border-red-400/20 dark:bg-[#211b25]"
                      : "border-slate-200/80 bg-white dark:border-[#293750] dark:bg-[#182338]"
                  } ${accent.border} ${accent.glow}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  {/* Decorative background glow */}
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 -z-10 h-36 w-36 rounded-full opacity-15 blur-3xl transition-opacity duration-300 group-hover:opacity-85 ${
                      isFailed ? "bg-red-500" : accent.icon.split(" ")[0]
                    }`}
                  />

                  <div className="flex items-start gap-3">
                    {/* Large feature icon */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-[68px] w-[68px] items-center justify-center rounded-[20px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] ${
                          accent.icon
                        }`}
                      >
                        <SectionIcon
                          className={`h-8 w-8 transition-transform duration-300 ${
                            isActive ? "animate-pulse" : ""
                          }`}
                          strokeWidth={1.8}
                        />
                      </div>

                      {/* Floating status indicator */}
                      <div
                        className={`absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white shadow-sm dark:border-[#111827] ${
                          isComplete
                            ? "bg-emerald-500 text-white"
                            : isActive
                              ? "bg-blue-500 text-white"
                              : isFailed
                                ? "bg-red-500 text-white"
                                : "bg-slate-300 text-white dark:bg-slate-600"
                        }`}
                      >
                        {isComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isActive && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {isFailed && <X className="h-3.5 w-3.5" />}
                        {status === "pending" && <Clock className="h-3 w-3" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : isActive
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                : isFailed
                                  ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </span>

                        <span className="text-[10px] font-medium text-slate-400">
                          {String(index + 1).padStart(2, "0")} / 07
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                        {section.label}
                      </h4>

                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {isComplete
                          ? "Insights are ready to explore"
                          : isActive
                            ? "Analyzing your business data..."
                            : isFailed
                              ? "Generation couldn't be completed"
                              : "Waiting for generation"}
                      </p>
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-white/[0.07]">
                    <span
                      className={`text-[11px] font-semibold ${accent.text}`}
                    >
                      {section.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isComplete && (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        </>
                      )}

                      {isActive && (
                        <>
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            In progress
                          </span>
                        </>
                      )}

                      {status === "pending" && (
                        <span className="text-[10px] font-medium text-slate-400">
                          Not started
                        </span>
                      )}

                      {isFailed && (
                        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                          Needs attention
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Failure information */}
                  {failure && (
                    <div className="mt-3 rounded-xl border border-red-200/80 bg-red-100/60 px-3 py-2 dark:border-red-500/20 dark:bg-red-500/[0.06]">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400">
                        {failure.message}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}

            {/* Festival preparation — separate from period generation */}
            <li
              className={`group relative isolate overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:col-span-2 ${
                festivalStatus === "failed"
                  ? "border-red-200/80 bg-red-50/50 dark:border-red-400/20 dark:bg-red-500/[0.04]"
                  : "border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 hover:border-amber-300 dark:border-amber-400/20 dark:from-amber-400/[0.07] dark:via-[#182338] dark:to-orange-400/[0.04] dark:hover:border-amber-400/40"
              }`}
            >
              {/* Decorative glow */}
              <div
                className={`pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full opacity-20 blur-3xl ${
                  festivalStatus === "failed" ? "bg-red-500" : "bg-amber-400"
                }`}
              />

              <div className="relative flex items-start gap-3">
                {/* Festival icon */}
                <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[20px] border border-amber-200/70 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 shadow-sm shadow-amber-500/10 dark:border-amber-400/20 dark:from-amber-400/15 dark:to-orange-400/10 dark:text-amber-300">
                  <CalendarDays
                    className={`h-8 w-8 ${
                      festivalStatus === "loading" ||
                      festivalStatus === "updating"
                        ? "animate-pulse"
                        : ""
                    }`}
                    strokeWidth={1.8}
                  />

                  {/* Status indicator */}
                  <div
                    className={`absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white shadow-sm dark:border-[#111827] ${
                      festivalStatus === "ready"
                        ? "bg-emerald-500 text-white"
                        : festivalStatus === "loading" ||
                            festivalStatus === "updating"
                          ? "bg-blue-500 text-white"
                          : festivalStatus === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-slate-300 text-white dark:bg-slate-600"
                    }`}
                  >
                    {festivalStatus === "ready" && (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}

                    {(festivalStatus === "loading" ||
                      festivalStatus === "updating") && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}

                    {festivalStatus === "failed" && (
                      <X className="h-3.5 w-3.5" />
                    )}

                    {festivalStatus === "pending" && (
                      <Clock className="h-3 w-3" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        festivalStatus === "ready"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : festivalStatus === "loading" ||
                              festivalStatus === "updating"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                            : festivalStatus === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
                      }`}
                    >
                      {festivalStatus === "ready"
                        ? "Ready"
                        : festivalStatus === "updating"
                          ? "Updating"
                          : festivalStatus === "loading"
                            ? "Loading"
                            : festivalStatus === "failed"
                              ? "Failed"
                              : "Waiting"}
                    </span>

                    <span className="text-[10px] font-medium text-amber-700/70 dark:text-amber-300/60">
                      Daily insight
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
                    Festival Preparation
                  </h4>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {festivalStatus === "ready"
                      ? festivalPrepProgress.itemCount > 0
                        ? `${festivalPrepProgress.itemCount} upcoming festival${festivalPrepProgress.itemCount === 1 ? "" : "s"} with preparation recommendations`
                        : "No upcoming festivals in the current lookahead period"
                      : festivalStatus === "updating"
                        ? "Refreshing upcoming festivals and preparation recommendations..."
                        : festivalStatus === "loading"
                          ? "Checking Nepal's upcoming festival calendar..."
                          : festivalStatus === "failed"
                            ? "Festival preparation couldn't be loaded"
                            : "Waiting for festival preparation data"}
                  </p>
                </div>
              </div>

              {/* Bottom accent */}
              <div className="relative mt-4 flex items-center justify-between border-t border-amber-200/60 pt-3 dark:border-amber-400/10">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Upcoming Festival Prep
                </span>

                <div className="flex items-center gap-1.5">
                  {festivalStatus === "ready" && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Available
                      </span>
                    </>
                  )}

                  {(festivalStatus === "loading" ||
                    festivalStatus === "updating") && (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        {festivalStatus === "updating"
                          ? "Refreshing"
                          : "In progress"}
                      </span>
                    </>
                  )}

                  {festivalStatus === "failed" && (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                      Needs attention
                    </span>
                  )}

                  {festivalStatus === "pending" && (
                    <span className="text-[10px] font-medium text-slate-400">
                      Not started
                    </span>
                  )}
                </div>
              </div>
            </li>
          </ul>

          {/* Generation activity footer */}
          {progress && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.025]">
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-blue-500" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                )}

                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {progress.done} of {progress.total} generation tasks processed
                </span>
              </div>

              {progress.failed.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-[9px] font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">
                  {progress.failed.length} failed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Small completion hint when collapsed */}
      {!expanded && !busy && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
          <ArrowRight className="h-3 w-3" />
          {failedCount > 0
            ? "Expand to review sections that need attention."
            : completedCount === totalCount
              ? "All insight sections are available."
              : `${missingSections.length} sections are waiting to be generated.`}
        </div>
      )}
    </section>
  );
}
