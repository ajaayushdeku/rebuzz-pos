"use client";

import { Check } from "lucide-react";

import ProviderLogo from "./ProviderLogo";
import { metaFor } from "./providerMeta";
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          AI provider
        </p>
        <p className="text-[11px] text-gray-400">
          One answers your insights. A key is kept for each.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const meta = metaFor(provider.id);
          const isSelected = provider.id === selected;
          const isActive = provider.id === activeProvider;
          const hasKey = configuredProviders.includes(provider.id);

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider.id)}
              aria-current={isSelected}
              // The selected card is outlined in the provider's own colour,
              // which is the same signal its panel and buttons use below.
              style={
                isSelected
                  ? {
                      borderColor: meta.card?.border ?? meta.accent,
                      backgroundColor: meta.card?.bg ?? meta.tint,
                    }
                  : undefined
              }
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                isSelected
                  ? "shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: meta.mark?.bg ?? meta.tint }}
              >
                <ProviderLogo provider={provider.id} size={20} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-gray-900">
                  {provider.label}
                </span>
                <span className="block truncate text-[11px] text-gray-500">
                  {meta.tagline}
                </span>
              </span>

              {/* Three states, told apart at a glance: answering now, ready to
                  switch to, or nothing saved yet. */}
              {isActive ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                  <Check className="h-2.5 w-2.5" />
                  In use
                </span>
              ) : hasKey ? (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  Key saved
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-400">
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
