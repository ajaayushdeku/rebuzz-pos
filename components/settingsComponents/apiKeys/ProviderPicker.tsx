"use client";

import { Check, RefreshCw, Zap } from "lucide-react";

import ProviderLogo from "./ProviderLogo";
import { MARK_TILE_CLASS, markTileVars, metaFor } from "./providerMeta";
import type { AiProvider } from "@/services/apiAiKey.client";

export default function ProviderPicker({
  providers,
  selected,
  activeProvider,
  configuredProviders,
  onSelect,
}: {
  providers: AiProvider[];
  selected: string;
  activeProvider: string;
  configuredProviders: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0a6] dark:text-[#9aa6bd]">
          AI provider
        </p>

        <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          Choose a provider to manage its API key and settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const meta = metaFor(provider.id);
          const isSelected = provider.id === selected;
          const isActive = provider.id === activeProvider;
          const hasKey = configuredProviders.includes(provider.id);
          const darkSignal = meta.darkAccent ?? meta.accent;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              aria-pressed={isSelected}
              style={
                isSelected
                  ? ({
                      "--pick-edge-light": meta.card?.border ?? meta.accent,
                      "--pick-edge-dark": `color-mix(in srgb, ${darkSignal} 65%, transparent)`,
                      "--pick-bg-light": meta.card?.bg ?? meta.tint,
                      "--pick-bg-dark": `color-mix(in srgb, ${darkSignal} 13%, transparent)`,
                    } as React.CSSProperties)
                  : undefined
              }
              className={`
                group relative flex min-h-[112px] flex-col rounded-2xl
                border p-3.5 text-left
                transition-all duration-200 ease-out
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-500 focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-[#111827]
                ${
                  isSelected
                    ? "border-[var(--pick-edge-light)] bg-[var(--pick-bg-light)] shadow-sm dark:border-[var(--pick-edge-dark)] dark:bg-[var(--pick-bg-dark)]"
                    : "border-[#e3e3e3] bg-white hover:-translate-y-0.5 hover:border-[#c6cbd2] hover:shadow-sm dark:border-white/10 dark:bg-[#161d2e] dark:hover:border-white/20 dark:hover:bg-[#1b2539]"
                }
              `}
            >
              {/* Provider identity and active status */}
              <div className="flex w-full items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`
                      flex h-11 w-11 shrink-0 items-center justify-center
                      rounded-xl border border-black/[0.04]
                      shadow-sm dark:border-white/[0.06]
                      ${MARK_TILE_CLASS}
                    `}
                    style={markTileVars(provider.id)}
                  >
                    <ProviderLogo provider={provider.id} size={21} />
                  </span>

                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[#30343b] dark:text-[#edf1f8]">
                      {provider.label}
                    </span>

                    <span className="mt-0.5 block truncate text-[11px] text-[#737982] dark:text-[#a9b4c7]">
                      {meta.tagline}
                    </span>
                  </div>
                </div>

                {/* Configuration status */}
                {isActive ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Check size={10} strokeWidth={2.8} />
                    In use
                  </span>
                ) : hasKey ? (
                  <span className="shrink-0 rounded-full border border-[#dadce0] bg-[#f8f9fa] px-2 py-1 text-[9px] font-semibold text-[#626a75] dark:border-white/10 dark:bg-white/5 dark:text-[#a9b4c7]">
                    Key saved
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-dashed border-[#dadce0] px-2 py-1 text-[9px] font-medium text-[#8b929c] dark:border-white/15 dark:text-[#9aa6bd]">
                    No key
                  </span>
                )}
              </div>

              {/* Provider capabilities */}
              {hasKey && (
                <div className="mt-auto flex min-h-[27px] flex-wrap items-center justify-between gap-1.5 pt-3">
                  {isActive && (
                    <span
                      className="
                        inline-flex items-center gap-1.5 rounded-lg
                        border border-emerald-200 bg-emerald-50
                        px-2 py-1 text-[10px] font-semibold text-emerald-700
                        dark:border-emerald-400/20 dark:bg-emerald-400/[0.08]
                        dark:text-emerald-300
                  "
                      title="This is the currently selected provider. AI Insights will try this provider first."
                    >
                      <Check size={11} strokeWidth={2.5} />
                      Primary provider
                    </span>
                  )}

                  {provider.allowAutomaticFallback && (
                    <span
                      className="
                        inline-flex items-center gap-1.5 rounded-lg
                        border border-violet-200/80 bg-violet-50
                        px-2 py-1 text-[10px] font-medium text-violet-700
                        dark:border-violet-400/20 dark:bg-violet-400/[0.08]
                        dark:text-violet-300
                      "
                      title={
                        isActive
                          ? "This provider can also be used as an automatic fallback if another provider is selected as primary in the future."
                          : "This provider is eligible to be selected automatically when the current primary provider fails."
                      }
                    >
                      <RefreshCw size={11} strokeWidth={2.2} />
                      {isActive ? "Fallback eligible" : "Fallback enabled"}
                    </span>
                  )}

                  {!isActive && !provider.allowAutomaticFallback && (
                    <span
                      className="
                        inline-flex items-center gap-1.5 rounded-lg
                        border border-[#e3e3e3] bg-[#f8f9fa]
                        px-2 py-1 text-[10px] font-medium text-[#737982]
                        dark:border-white/10 dark:bg-white/[0.04]
                        dark:text-[#9aa6bd]
                    "
                      title="This provider will not be selected automatically as a fallback. You can still select it manually."
                    >
                      <Zap size={11} />
                      Manual selection only
                    </span>
                  )}

                  {/* Selection indicator */}
                  <span
                    className={`
                    flex h-[21px] w-[21px] shrink-0 items-center
                    justify-center rounded-full border transition-all duration-200
                    ${
                      isSelected
                        ? "border-[#244074] bg-[#244074] text-white dark:border-blue-400 dark:bg-blue-500"
                        : "border-[#d5d9df] text-transparent group-hover:border-[#9aa3b1] dark:border-white/20 dark:group-hover:border-white/40"
                    }
                  `}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
