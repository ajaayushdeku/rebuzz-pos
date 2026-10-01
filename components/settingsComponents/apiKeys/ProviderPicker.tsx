"use client";

import { Check } from "lucide-react";

import ProviderLogo from "./ProviderLogo";
import { MARK_TILE_CLASS, markTileVars, metaFor } from "./providerMeta";
import type { AiProvider } from "@/services/apiAiKey.client";

/**
 * The providers to choose between, as a row of cards above the form.
 *
 * Tabs were the first attempt and would not survive five providers: they share
 * one row, so each new one makes every label narrower. A side rail was the
 * second, and cost the form a third of the screen to hold four short names.
 * Cards wrap instead — two across on a phone, three on a wide screen, more
 * rows as providers are added — and the width they leave goes to the form and
 * the guide, which are what a merchant actually reads.
 *
 * Choosing a card only decides what the screen is showing. Switching which
 * provider answers insights is a deliberate act in the panel below, so nobody
 * changes their live setup by browsing.
 */
export default function ProviderPicker({
  providers,
  selected,
  activeProvider,
  configuredProviders,
  onSelect,
}: {
  providers: AiProvider[];
  selected: string;
  /** The one actually answering insights. */
  activeProvider: string;
  /** Those that already hold a key, in use or not. */
  configuredProviders: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0a6] dark:text-[#9aa6bd]">
          AI provider
        </p>
        <p className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
          One answers your insights. A key is kept for each.
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
              aria-current={isSelected}
              // The selected card is outlined in the provider's own colour,
              // which is the same signal its panel and buttons use below. An
              // inline style cannot carry a `dark:` variant — so both themes'
              // values are declared as custom properties and the classes pick
              // one. The pale light wash becomes the same hue at low opacity,
              // which keeps the provider's identity without a light patch on a
              // dark card.
              style={
                isSelected
                  ? ({
                      "--pick-edge-light": meta.card?.border ?? meta.accent,
                      // `accent` is picked to read on white and is near-black
                      // for some providers, which on a dark card is no edge at
                      // all. `darkAccent` is that provider's own dark shade.
                      "--pick-edge-dark": `color-mix(in srgb, ${darkSignal} 60%, transparent)`,
                      "--pick-bg-light": meta.card?.bg ?? meta.tint,
                      "--pick-bg-dark": `color-mix(in srgb, ${darkSignal} 16%, transparent)`,
                    } as React.CSSProperties)
                  : undefined
              }
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                isSelected
                  ? "border-[var(--pick-edge-light)] bg-[var(--pick-bg-light)] dark:border-[var(--pick-edge-dark)] dark:bg-[var(--pick-bg-dark)]"
                  : "border-[#e3e3e3] bg-white hover:bg-[#f8f9fa] dark:border-white/10 dark:bg-[#161d2e] dark:hover:bg-white/10"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${MARK_TILE_CLASS}`}
                style={markTileVars(provider.id)}
              >
                <ProviderLogo provider={provider.id} size={20} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
                  {provider.label}
                </span>
                <span className="block truncate text-[11px] text-[#5f6368] dark:text-[#a9b4c7]">
                  {meta.tagline}
                </span>
              </span>

              {/* Three states, told apart at a glance: answering now, ready to
                  switch to, or nothing saved yet. */}
              {isActive ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-400/25 dark:text-emerald-300 dark:bg-emerald-400/10">
                  <Check className="h-2.5 w-2.5" />
                  In use
                </span>
              ) : hasKey ? (
                <span className="shrink-0 rounded-full border border-[#dadce0] bg-white dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#5f6368] dark:border-white/15 dark:text-[#a9b4c7]">
                  Key saved
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-dashed border-[#dadce0] px-2 py-0.5 text-[10px] font-medium text-[#9aa0a6] dark:border-white/15 dark:text-[#9aa6bd]">
                  No key
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
