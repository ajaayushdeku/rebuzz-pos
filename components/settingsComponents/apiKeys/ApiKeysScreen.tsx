"use client";

import { useState } from "react";

import AiKeyForm from "./AiKeyForm";
import AiQuotaMeter from "./AiQuotaMeter";
import ProviderGuide from "./ProviderGuide";
import ProviderMarkDefs from "./ProviderMarkDefs";
import ProviderPicker from "./ProviderPicker";
import { useAiKeyStatus } from "@/hooks/useAiKey";
import type { AiProvider } from "@/services/apiAiKey.client";

/**
 * The API Keys screen: which providers exist, the key for the one being
 * looked at, and how to get one.
 *
 * The selection lives here rather than inside the form, because three things
 * follow it — the list's highlight, the form, and the guide — and a guide that
 * describes a different provider from the form is worse than no guide at all.
 *
 * The choice sits across the top, and the two things a merchant reads while
 * setting one up — the form and its guide — sit side by side beneath it, each
 * with half the width. Stacks to one column on a phone.
 *
 * The form is keyed by provider so switching starts it clean: a key typed for
 * one provider must never be left in the field when another is selected.
 */

/** Until the service answers, so the list does not pop in a moment later. */
const FALLBACK_PROVIDERS: AiProvider[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-3.6-flash",
    keysUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "openrouter/free",
    keysUrl: "https://openrouter.ai/keys",
  },
];

export default function ApiKeysScreen() {
  const { data: status } = useAiKeyStatus();
  /** What the screen is showing. Null means "whichever is in use". */
  const [selected, setSelected] = useState<string | null>(null);

  const providers = status?.providers ?? FALLBACK_PROVIDERS;
  const activeProvider = status?.provider ?? "gemini";
  const current = selected ?? activeProvider;
  const provider =
    providers.find((p) => p.id === current) ?? FALLBACK_PROVIDERS[0];

  const configuredProviders =
    status?.configuredProviders ?? (status?.configured ? [activeProvider] : []);

  return (
    <div className="space-y-6">
      {/* Once for the screen: the marks in the cards and in the panel paint
          themselves from these, and two copies would be two elements sharing
          one id. */}
      <ProviderMarkDefs />

      {/* First thing on the screen: the allowance governs everything set up
          below it, and under the form it sat past the fold where the merchant
          only met it as an error. */}
      <AiQuotaMeter />

      <ProviderPicker
        providers={providers}
        selected={current}
        activeProvider={activeProvider}
        configuredProviders={configuredProviders}
        onSelect={setSelected}
      />

      {/* Three cells rather than two columns of stacked cards, so the order
          can differ per width: side by side on a wide screen, and on a phone
          form → steps → facts, which is the order they are needed in. The
          steps span both rows so they sit beside the form and the facts. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="order-1 min-w-0">
          <AiKeyForm key={provider.id} provider={provider} />
        </div>

        <div className="order-2 min-w-0 lg:sticky lg:top-4 lg:row-span-2">
          <ProviderGuide
            provider={provider.id}
            label={provider.label}
            part="steps"
          />
        </div>

        <div className="order-3 min-w-0">
          <ProviderGuide
            provider={provider.id}
            label={provider.label}
            part="facts"
          />
        </div>
      </div>
    </div>
  );
}
