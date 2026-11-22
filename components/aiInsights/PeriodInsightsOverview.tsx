"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";

import PeriodProgressVisualizer, {
  type GenerationProgress,
} from "./PeriodProgressVisualizer";
import ProviderFallbackStatus from "./ProviderFallbackStatus";

import type { AiProvider } from "@/services/apiAiKey.client";

export interface FestivalPrepProgress {
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
  itemCount: number;
}

interface PeriodInsightsOverviewProps {
  periodLabel?: string;
  isLoading: boolean;
  isGenerating: boolean;
  storedSections: Record<string, unknown>;
  missingSections: string[];
  progress: GenerationProgress | null;
  canGenerate: boolean;
  providers: AiProvider[];
  primaryProvider: string;
  providerSwitchNotice?: ReactNode;
  festivalPrepProgress: FestivalPrepProgress;
  onGenerate: () => void;
}

export default function PeriodInsightsOverview({
  periodLabel,
  isLoading,
  isGenerating,
  storedSections,
  missingSections,
  progress,
  canGenerate,
  providers,
  primaryProvider,
  festivalPrepProgress,
  providerSwitchNotice,
  onGenerate,
}: PeriodInsightsOverviewProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#111827]">
      {providerSwitchNotice}

      {/* Compact summary bar */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          isMinimized
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isMinimized}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-100/80 text-blue-600 dark:border-blue-400/15 dark:from-blue-400/[0.13] dark:to-indigo-400/[0.08] dark:text-blue-300">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium tracking-[0.01em] text-slate-800 dark:text-slate-100">
                  Insights overview
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {isGenerating
                    ? "Generating insights..."
                    : periodLabel
                      ? `${periodLabel} · Overview minimized`
                      : "Generation and provider status"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              aria-expanded={false}
              aria-label="Expand insights overview"
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 text-[11px] font-medium text-slate-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-blue-400/20 dark:hover:bg-blue-400/[0.08] dark:hover:text-blue-300 cursor-pointer"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Expand</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full overview */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          isMinimized
            ? "grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        }`}
        aria-hidden={isMinimized}
      >
        <div className="min-h-0 overflow-hidden">
          {/* Minimize control */}
          <div className="flex justify-center px-3 pt-2 sm:px-4">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              aria-expanded={true}
              aria-label="Minimize insights overview"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium tracking-wide text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              Minimize
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          {/* Generation overview */}
          <div className="min-w-0 px-3 pb-3 sm:px-4 sm:pb-4">
            <PeriodProgressVisualizer
              periodLabel={periodLabel}
              isLoading={isLoading}
              isGenerating={isGenerating}
              storedSections={storedSections}
              missingSections={missingSections}
              progress={progress}
              canGenerate={canGenerate}
              festivalPrepProgress={festivalPrepProgress}
              onGenerate={onGenerate}
            />
          </div>

          {/* Provider fallback section */}
          <div className="border-t border-slate-200/80 dark:border-white/10">
            <ProviderFallbackStatus
              providers={providers}
              primaryProvider={primaryProvider}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
