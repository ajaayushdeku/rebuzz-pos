"use client";

import { Check, RefreshCw, Zap, ArrowUpRight } from "lucide-react";

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
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          AI provider
        </p>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Choose a provider to manage its API key and settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const meta = metaFor(provider.id);
          const isSelected = provider.id === selected;
          const isActive = provider.id === activeProvider;
          const hasKey = configuredProviders.includes(provider.id);
          const darkSignal = meta.darkAccent ?? meta.accent;

          const gradient = meta.gradient?.length
            ? `linear-gradient(135deg, ${meta.gradient.join(", ")})`
            : `linear-gradient(135deg, ${meta.accent}, ${meta.darkAccent ?? meta.accent})`;

          const darkGradient = meta.darkGradient?.length
            ? `linear-gradient(135deg, ${meta.darkGradient.join(", ")})`
            : gradient;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              aria-pressed={isSelected}
              style={
                {
                  "--provider-accent": meta.accent,
                  "--provider-dark-accent": darkSignal,
                  "--provider-gradient": gradient,
                  "--provider-dark-gradient": darkGradient,
                  "--provider-tint": meta.tint,
                  "--provider-edge": meta.card?.border ?? meta.accent,
                  "--provider-card-bg": meta.card?.bg ?? meta.tint,
                  "--provider-glow": `${meta.accent}18`,
                } as React.CSSProperties
              }
              className={`
                group relative flex min-h-[218px] flex-col overflow-hidden
                rounded-[20px] border text-left
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-xl
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-500 focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-[#111827]
                ${
                  isSelected
                    ? `
                      border-[var(--provider-edge)]
                      bg-[var(--provider-card-bg)]
                      shadow-[0_5px_20px_var(--provider-glow)]
                      dark:border-[color-mix(in_srgb,var(--provider-dark-accent)_55%,transparent)]
                      dark:bg-[#192438]
                      dark:shadow-[0_5px_24px_rgba(0,0,0,0.24)]
                    `
                    : `
                      border-slate-200 bg-white
                      shadow-[0_2px_8px_rgba(15,23,42,0.025)]
                      hover:border-slate-300
                      dark:border-[#293750] dark:bg-[#182338]
                      dark:hover:border-white/20
                    `
                }
              `}
            >
              {/* Brand accent */}
              <div
                className={`
                  absolute inset-x-0 top-0 h-[4px]
                  transition-opacity duration-300
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
                style={{
                  background: gradient,
                }}
              />

              <div className="flex flex-1 flex-col p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`
                      relative flex size-[72px] shrink-0 items-center
                      justify-center overflow-hidden rounded-[20px]
                      border border-black/[0.045]
                      shadow-[0_5px_14px_rgba(15,23,42,0.09)]
                      transition-all duration-300
                      group-hover:scale-[1.045] group-hover:shadow-lg
                      dark:border-white/[0.08]
                      ${MARK_TILE_CLASS}
                    `}
                    style={markTileVars(provider.id)}
                  >
                    {/* Soft brand glow */}
                    <span
                      className="absolute inset-0 opacity-70"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${meta.accent}20, transparent 72%)`,
                      }}
                    />

                    <span className="relative z-[1]">
                      <ProviderLogo provider={provider.id} size={37} />
                    </span>

                    {/* {isSelected && (
                      <span
                        className="
                          absolute bottom-1.5 right-1.5
                          size-2 rounded-full
                          ring-2 ring-white
                          dark:ring-[#182338]
                        "
                        style={{ background: meta.accent }}
                      />
                    )} */}
                  </div>

                  {/* Status */}
                  <div className="flex min-w-0 flex-col items-end gap-2">
                    {isActive ? (
                      <span
                        className="
                        inline-flex items-center gap-1.5
                        rounded-full border border-emerald-200
                        bg-emerald-50 px-2.5 py-1
                        text-[9px] font-bold uppercase tracking-[0.06em]
                        text-emerald-700
                        dark:border-emerald-400/25 dark:bg-emerald-400/10
                        dark:text-emerald-300
                      "
                      >
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        In use
                      </span>
                    ) : hasKey ? (
                      <span
                        className="
                        inline-flex items-center gap-1.5
                        rounded-full border border-slate-200
                        bg-slate-50 px-2.5 py-1
                        text-[9px] font-semibold text-slate-600
                        dark:border-white/10 dark:bg-white/[0.05]
                        dark:text-slate-300
                      "
                      >
                        <Check size={10} strokeWidth={2.7} />
                        Configured
                      </span>
                    ) : (
                      <span
                        className="
                        rounded-full border border-dashed
                        border-slate-300 px-2.5 py-1
                        text-[9px] font-medium text-slate-400
                        dark:border-white/15 dark:text-slate-500
                      "
                      >
                        Not configured
                      </span>
                    )}

                    {isSelected && (
                      <span
                        className="
                          flex size-7 items-center justify-center
                          rounded-full text-white shadow-sm
                          dark:text-white
                        "
                        style={{ background: meta.accent }}
                      >
                        <Check size={14} strokeWidth={2.8} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Provider name */}
                <div className="mt-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="
                      truncate text-[16px] font-bold
                      tracking-[-0.035em]
                      text-slate-800 dark:text-[#F0F4FC]
                    "
                    >
                      {provider.label}
                    </h3>

                    {isSelected && (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: meta.accent }}
                      />
                    )}
                  </div>

                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {meta.tagline}
                  </p>

                  <p className="mt-2 line-clamp-2 min-h-[32px] text-[11px] leading-[1.55] text-slate-600 dark:text-slate-300/80">
                    {meta.blurb}
                  </p>
                </div>
              </div>

              {/* Bottom capability bar */}
              <div
                className={`
                flex min-h-[43px] items-center gap-2
                border-t px-4 py-2.5
                transition-colors duration-200
                ${
                  isSelected
                    ? "border-black/[0.07] bg-white/45 dark:border-white/[0.07] dark:bg-black/10"
                    : "border-slate-100 bg-slate-50/80 dark:border-white/[0.06] dark:bg-white/[0.025]"
                }
              `}
              >
                {hasKey ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {isActive && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                        title="AI Insights will try this provider first."
                      >
                        <Check size={12} strokeWidth={2.5} />
                        Primary provider
                      </span>
                    )}

                    {provider.allowAutomaticFallback && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300"
                        title="This provider is eligible for automatic fallback when another primary provider fails."
                      >
                        <RefreshCw size={11} strokeWidth={2.3} />
                        {isActive ? "Fallback eligible" : "Automatic fallback"}
                      </span>
                    )}

                    {!isActive && !provider.allowAutomaticFallback && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <Zap size={11} />
                        Manual selection only
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Add an API key to get started
                  </span>
                )}

                <span
                  className="
                  ml-auto inline-flex shrink-0 items-center gap-1
                  text-[10px] font-semibold
                  text-slate-400 transition-all duration-200
                  group-hover:translate-x-0.5 group-hover:text-slate-600
                  dark:text-slate-500 dark:group-hover:text-slate-300
                "
                >
                  {isSelected ? "Selected" : "Configure"}
                  <ArrowUpRight size={12} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
