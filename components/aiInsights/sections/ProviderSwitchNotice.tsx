"use client";

import { useState } from "react";
import { CheckCircle2, X, RefreshCw } from "lucide-react";

interface ProviderSwitchNoticeProps {
  fallbackFrom?: string | null;
  providerId?: string | null;
  reason?: string | null;
  switchedAt?: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  groq: "Groq",
  mistral: "Mistral AI",
  nvidia: "NVIDIA",
};

function getProviderLabel(providerId?: string | null) {
  if (!providerId) return "Unknown provider";

  return PROVIDER_LABELS[providerId.toLowerCase()] ?? providerId;
}

function getReasonLabel(reason?: string | null) {
  if (!reason) return "The previous provider could not complete the request.";

  const reasons: Record<string, string> = {
    AI_QUOTA_EXCEEDED: "The previous provider's usage quota was exhausted.",
    AI_RATE_LIMIT: "The previous provider reached its rate limit.",
    AI_UNAVAILABLE: "The previous provider was temporarily unavailable.",
    AI_MODEL_UNAVAILABLE: "The requested model was unavailable.",
    AI_PAYMENT_REQUIRED: "The previous provider requires additional billing.",
  };

  return reasons[reason] ?? reason;
}

export default function ProviderSwitchNotice({
  fallbackFrom,
  providerId,
  reason,
  switchedAt,
}: ProviderSwitchNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!fallbackFrom || !providerId || dismissed) {
    return null;
  }

  const formattedDate = switchedAt
    ? new Date(switchedAt).toLocaleString()
    : null;

  return (
    <div className="relative rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3.5 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss provider switch notification"
        className="absolute right-3 top-3 rounded-md p-1 text-emerald-700/70 transition hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              AI provider switched successfully
            </h3>

            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <RefreshCw className="h-3 w-3" />
              Automatic fallback
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/80">
            Your AI Insights request was continued using{" "}
            <strong>{getProviderLabel(providerId)}</strong> because{" "}
            <strong>{getProviderLabel(fallbackFrom)}</strong> could not complete
            it.
          </p>

          <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 dark:bg-black/10">
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              <span className="font-semibold">Reason:</span>{" "}
              {getReasonLabel(reason)}
            </p>

            {formattedDate && (
              <p className="mt-1 text-[10px] text-emerald-700/70 dark:text-emerald-300/60">
                Switched on {formattedDate}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
