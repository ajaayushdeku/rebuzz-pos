"use client";

import { useState } from "react";
import { CheckCircle2, X, RefreshCw, ArrowRight, Clock3 } from "lucide-react";

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

  if (!fallbackFrom || !providerId) {
    return null;
  }

  const formattedDate = switchedAt
    ? new Date(switchedAt).toLocaleString()
    : null;

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
        dismissed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      aria-hidden={dismissed}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative overflow-hidden border-b border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white p-3.5 dark:border-emerald-400/15 dark:from-emerald-400/[0.09] dark:via-teal-400/[0.045] dark:to-[#111827] sm:p-4">
          {/* Subtle accent */}
          <div className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 dark:from-emerald-400/80 dark:to-teal-400/70" />

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss provider switch notification"
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700/60 transition-all duration-200 hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/60 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 items-start gap-3 pr-7">
            {/* Success icon */}
            <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-emerald-200/60 bg-gradient-to-br from-white/90 to-emerald-100/80 text-emerald-600 shadow-sm shadow-emerald-500/[0.06] dark:border-emerald-400/15 dark:from-emerald-400/[0.13] dark:to-teal-400/[0.07] dark:text-emerald-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/[0.05]" />
              <CheckCircle2
                className="relative h-[21px] w-[21px]"
                strokeWidth={1.7}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-medium tracking-[0.015em] text-emerald-900 dark:text-emerald-200 sm:text-[15px]">
                  AI provider switched successfully
                </h3>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-white/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                  <RefreshCw className="h-3 w-3" />
                  Automatic fallback
                </span>
              </div>

              <p className="mt-1.5 text-[11px] leading-[1.7] text-emerald-800/90 dark:text-emerald-200/80 sm:text-xs">
                Your AI Insights request continued using{" "}
                <strong className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {getProviderLabel(providerId)}
                </strong>
                . The original provider,{" "}
                <strong className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {getProviderLabel(fallbackFrom)}
                </strong>
                , could not complete it.
              </p>

              {/* Provider transition */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg border border-emerald-200/70 bg-white/60 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 dark:border-emerald-400/15 dark:bg-white/[0.035] dark:text-slate-300">
                  {getProviderLabel(fallbackFrom)}
                </span>

                <ArrowRight
                  className="h-3.5 w-3.5 text-emerald-600/70 dark:text-emerald-300/70"
                  strokeWidth={1.8}
                />

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-100/70 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/[0.09] dark:text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {getProviderLabel(providerId)}
                </span>
              </div>

              {/* Reason and timestamp */}
              <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-emerald-200/50 bg-white/50 px-3 py-2.5 dark:border-emerald-400/10 dark:bg-black/[0.10]">
                <p className="text-[11px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Reason:
                  </span>{" "}
                  {getReasonLabel(reason)}
                </p>

                {formattedDate && (
                  <p className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700/70 dark:text-emerald-300/60">
                    <Clock3 className="h-3 w-3" />
                    Switched on {formattedDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
