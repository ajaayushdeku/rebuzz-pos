"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";

import type { AiProvider } from "@/services/apiAiKey.client";
import ProviderLogo from "../settingsComponents/apiKeys/ProviderLogo";

interface ProviderFallbackStatusProps {
  providers: AiProvider[];
  primaryProvider: string;
}

export default function ProviderFallbackStatus({
  providers,
  primaryProvider,
}: ProviderFallbackStatusProps) {
  const [expanded, setExpanded] = useState(false);

  const activeProvider = providers.find(
    (provider) => provider.id === primaryProvider,
  );

  const activeProviderLabel =
    activeProvider?.label ?? primaryProvider ?? "Unknown";

  const fallbackProviders = providers.filter(
    (provider) =>
      provider.id !== primaryProvider &&
      provider.configured === true &&
      provider.enabled === true &&
      provider.allowAutomaticFallback === true,
  );

  if (!primaryProvider) return null;

  return (
    <div className="h-full min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/[0.02]">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-2 px-3 pt-3 pb-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
      >
        {/* First row: Header */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-[13px] font-normal text-[#3c4043] dark:text-[#e8ecf4] sm:text-[15px]">
                Provider fallback
              </h3>
              <p className="max-w-xl truncate text-[11px] tracking-wide text-[#9aa0a6] dark:text-[#9aa6bd] sm:text-xs">
                Automatic switching
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {fallbackProviders.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-[9px] font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Zap className="h-3 w-3" />
                Enabled
              </span>
            )}

            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Second row: Active provider logo */}
        {!expanded && activeProvider && (
          <div className="flex w-full items-center justify-between gap-2 border-t border-slate-200/80 pt-2 dark:border-white/10">
            <p className=" text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active provider
            </p>

            <div className="flex flex-row items-center gap-1.5 ">
              <div
                title={`Active provider: ${activeProviderLabel}`}
                className="flex h-7 w-7 items-center justify-center rounded-md  "
              >
                <ProviderLogo provider={activeProvider.id} size={16} />
              </div>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {activeProviderLabel}
              </span>
            </div>
          </div>
        )}
      </button>

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
          <div className="border-t border-slate-200/80 px-3 pb-3 pt-3 dark:border-white/10">
            {/* Active provider */}
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Active provider
              </p>

              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-blue-200/70 bg-blue-50/60 px-2.5 py-2 dark:border-blue-400/15 dark:bg-blue-400/[0.05]">
                {activeProvider && (
                  <ProviderLogo provider={activeProvider.id} />
                )}

                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {activeProviderLabel}
                </span>

                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                  Primary
                </span>
              </div>
            </div>

            {/* Fallback providers */}
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Ready to take over
                </p>

                <span className="text-[10px] tabular-nums text-slate-400">
                  {fallbackProviders.length}
                </span>
              </div>

              {fallbackProviders.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {fallbackProviders.map((provider) => (
                    <div
                      key={provider.id}
                      title={`${provider.label} is ready for automatic fallback`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-200/70 bg-emerald-50/60 px-2 py-1.5 dark:border-emerald-400/15 dark:bg-emerald-400/[0.05]"
                    >
                      <ProviderLogo provider={provider.id} size={16} />

                      <span className="truncate text-[12px] font-medium text-slate-700 dark:text-slate-300">
                        {provider.label}
                      </span>

                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  No fallback providers available.
                </p>
              )}
            </div>

            {/* Explanation */}
            {fallbackProviders.length > 0 && (
              <div className="mt-3 border-t border-slate-200/70 pt-2 text-[10px] leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
                <p>
                  If your primary provider runs out of quota, hits a rate limit,
                  becomes temporarily unavailable, or cannot access the selected
                  model, AI Insights can automatically try other eligible
                  providers. The first successful alternative may become your
                  new primary provider.
                </p>

                <p className="mt-2 font-medium text-slate-600 dark:text-slate-300">
                  Automatic fallback will not be applied when:
                </p>

                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>
                    The prompt or request data is invalid or fails validation.
                  </li>
                  <li>The request uses an unsupported format or feature.</li>
                  <li>
                    The error is caused by invalid application data or
                    configuration rather than the provider.
                  </li>
                  <li>
                    No other eligible providers have valid API keys and
                    supported models.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
