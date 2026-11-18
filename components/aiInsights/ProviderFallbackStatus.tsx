"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  GitBranch,
  ShieldCheck,
  Zap,
} from "lucide-react";

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

  console.log("Provider:", activeProvider);
  const activeProviderLabel =
    activeProvider?.label ?? primaryProvider ?? "Unknown";

  const fallbackProviders = providers.filter(
    (provider) =>
      provider.id !== primaryProvider &&
      provider.configured === true &&
      provider.enabled === true &&
      provider.allowAutomaticFallback === true,
  );

  if (primaryProvider == null) return null;

  const hasFallbacks = fallbackProviders.length > 0;

  return (
    <section className="relative h-full min-w-0 overflow-hidden  bg-gradient-to-br from-white via-white to-blue-50/60   dark:from-[#151e30] dark:via-[#111827] dark:to-blue-950/20">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/[0.08] blur-3xl dark:bg-blue-400/[0.10]" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-indigo-400/[0.07] blur-3xl" />

      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="relative flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-blue-50/40 dark:hover:bg-white/[0.025]"
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Main icon */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-400/20 dark:from-blue-500/20 dark:to-indigo-500/15 dark:text-blue-300">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />

            {/* <span
              className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-white dark:border-[#151e30] ${
                hasFallbacks ? "bg-emerald-500" : "bg-slate-400"
              }`}
            /> */}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-medium tracking-[0.015em] text-slate-800 dark:text-slate-100 sm:text-[15px]">
                Provider protection
              </h3>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide ${
                  hasFallbacks
                    ? "border-emerald-200/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300"
                    : "border-slate-200/70 bg-slate-50 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasFallbacks ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {hasFallbacks ? "Protected" : "No backup"}
              </span>
            </div>

            <p className="mt-1 truncate text-[11px] font-normal tracking-[0.015em] text-slate-500 dark:text-slate-400 sm:text-xs">
              Automatic provider switching
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-lg font-bold leading-none tabular-nums text-slate-800 dark:text-slate-100">
              {fallbackProviders.length}
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Backups
            </p>
          </div>

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition-all duration-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 ${
              expanded
                ? "rotate-180 border-blue-200 text-blue-600 dark:border-blue-400/20 dark:text-blue-400"
                : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Compact provider overview */}
      {!expanded && (
        <div className="relative px-4 pb-4">
          <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-white/[0.07] dark:bg-black/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex   h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-400/10">
                  {activeProvider && (
                    <ProviderLogo
                      provider={activeProvider.id}
                      size={24}
                      paint={"#6f6a6a"}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Primary provider
                  </p>
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {activeProviderLabel}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg border border-blue-200/70 bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-700 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-blue-300">
                Active
              </span>
            </div>

            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-slate-200 dark:from-blue-400/30 dark:to-white/10" />
              <GitBranch className="h-3.5 w-3.5 rotate-90 text-slate-400" />
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-emerald-200 dark:from-white/10 dark:to-emerald-400/20" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <Zap className="h-3.5 w-3.5" />
                </div>

                <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Automatic backup providers
                </span>
              </div>

              <span className="shrink-0 text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {fallbackProviders.length} ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      <div
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="relative border-t border-slate-200/80 px-4 pb-4 pt-4 dark:border-white/[0.08]">
            {/* Provider route */}
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Provider routing
              </p>
            </div>

            {/* Primary provider node */}
            <div className="relative rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3 dark:border-blue-400/20 dark:from-blue-500/[0.09] dark:to-indigo-500/[0.05]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200/70 bg-white shadow-sm dark:border-blue-400/15 dark:bg-white/[0.06]">
                  {activeProvider && (
                    <ProviderLogo
                      provider={activeProvider.id}
                      size={24}
                      paint={"#6f6a6a"}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Primary provider
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                    {activeProviderLabel}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-[9px] font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                  <CircleDot className="h-3 w-3" />
                  Primary
                </span>
              </div>
            </div>

            {/* Connection */}
            <div className="flex h-8 items-center pl-8">
              <div className="relative h-full w-px bg-gradient-to-b from-blue-300 to-emerald-300 dark:from-blue-400/40 dark:to-emerald-400/40">
                <ArrowDown className="absolute -bottom-1 -left-[6.5px] h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="ml-3 text-[9px] font-medium text-slate-400">
                If the primary provider cannot complete a request
              </span>
            </div>

            {/* Fallback providers */}
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-400/15 dark:bg-emerald-400/[0.035]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                    <Zap className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Backup providers
                    </p>
                    <p className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70">
                      Eligible for automatic switching
                    </p>
                  </div>
                </div>

                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-[10px] font-bold tabular-nums text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                  {fallbackProviders.length}
                </span>
              </div>

              {hasFallbacks ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {fallbackProviders.map((provider, index) => (
                    <div
                      key={index}
                      title={`${provider.label} is ready for automatic fallback`}
                      className="group/provider flex min-w-0 items-center gap-2 rounded-lg border border-emerald-200/70 bg-white/80 px-2.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.035] dark:hover:border-emerald-400/30"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-transform duration-200 group-hover/provider:scale-105 dark:bg-emerald-400/[0.08]">
                        <ProviderLogo
                          provider={provider.id}
                          size={19}
                          paint={"#6f6a6a"}
                        />
                      </div>

                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {provider.label}
                      </span>

                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-white/60 px-3 py-3 dark:border-emerald-400/15 dark:bg-white/[0.02]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No eligible backup providers. Configure and enable automatic
                    fallback for another provider to add protection.
                  </p>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/[0.07] dark:bg-white/[0.025]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  How automatic fallback works
                </p>
              </div>

              <p className="mt-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                If the primary provider runs out of quota, hits a rate limit,
                becomes temporarily unavailable, or cannot access the selected
                model, AI Insights can automatically try other eligible
                providers. The first successful alternative may become your new
                primary provider.
              </p>

              <div className="my-3 h-px bg-slate-200 dark:bg-white/[0.08]" />

              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                Fallback is not triggered for:
              </p>

              <ul className="mt-2 space-y-2">
                {[
                  "Invalid prompts or request data that fail validation.",
                  "Unsupported request formats or features.",
                  "Invalid application data or configuration errors unrelated to the provider.",
                  "Requests where no other eligible provider has a valid API key and supported model.",
                ].map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400"
                  >
                    <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
