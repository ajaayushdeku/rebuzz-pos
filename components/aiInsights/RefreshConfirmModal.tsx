"use client";

import { RefreshCw, Loader2, Gauge, Clock3, Cpu, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { useAiQuota } from "@/hooks/useAiQuota";
import { useAiKeyStatus, useAiProviderLabel } from "@/hooks/useAiKey";
import { unlockLabel } from "@/components/offers/useAiFillLock";

/**
 * Asked before a Refresh, because a Refresh is the one action here that spends
 * from the hourly allowance on the merchant's own key — everything else on the
 * page is served from the day's saved answer at no cost.
 *
 * It states the four things that decide whether the spend is worth it: how many
 * requests are left, when the next one frees up, and which provider and model
 * will answer. Those come from the same two queries the settings screen reads,
 * so the numbers here and the meter there cannot disagree.
 */
function Fact({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** For a value that is not known rather than not set. */
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-[#9aa6bd]">
        <Icon
          size={14}
          className="shrink-0 text-gray-400 dark:text-[#7b869b]"
        />
        {label}
      </span>
      <span
        className={`text-right text-[12px] font-semibold tabular-nums ${
          muted
            ? "text-gray-400 dark:text-[#7b869b]"
            : "text-gray-900 dark:text-[#e8ecf4]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function RefreshConfirmModal({
  open,
  onClose,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** A refresh is already running — the confirm button waits it out. */
  busy?: boolean;
}) {
  const { data: quota } = useAiQuota();
  const { data: status } = useAiKeyStatus();
  // The same label the card footers use, resolved from the service's own
  // catalogue rather than a list here.
  const providerLabel = useAiProviderLabel();

  // `remaining === 0` is the one case where confirming can only fail: the
  // service answers INSIGHTS_RATE_LIMIT and serves the old answer back.
  const spent = quota?.remaining === 0;
  const disabled = spent || busy;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={busy}
      title="Generate a new answer?"
      subtitle="This replaces the advice shown in this section and spends one request on your AI key."
      icon={RefreshCw}
      iconColor="text-blue-600 dark:text-[#a8c4ee]"
      iconBgColor="bg-blue-50 dark:bg-blue-400/10"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-[#c3ccdc] dark:hover:border-white/25 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-500"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-3.5 dark:divide-white/10 dark:border-white/15">
        <Fact
          icon={Gauge}
          label="Requests left this hour"
          value={
            quota
              ? quota.remaining === 0
                ? "None left"
                : `${quota.remaining} of ${quota.limit}`
              : "Unknown"
          }
          muted={!quota}
        />
        <Fact
          icon={Clock3}
          label="Next one frees up"
          value={quota ? unlockLabel(quota.resetAt) : "Unknown"}
          muted={!quota}
        />
        <Fact
          icon={Sparkles}
          label="Provider"
          value={providerLabel ?? "Unknown"}
          muted={!providerLabel}
        />
        <Fact
          icon={Cpu}
          label="Model"
          value={status?.model ?? "Provider default"}
          muted={!status?.model}
        />
      </div>

      {spent && (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600 dark:border-red-400/25 dark:bg-red-400/10 dark:text-[#f87171]">
          The hourly allowance is used up, so a new answer cannot be generated
          yet. The advice on screen stays as it is
          {quota ? ` until ${unlockLabel(quota.resetAt)}` : ""}.
        </p>
      )}

      {!spent && status?.configured && status.enabled === false && (
        <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300">
          AI is switched off for this business, so this request will be refused.
          Turn it back on under Settings → API Keys.
        </p>
      )}
    </ModalShell>
  );
}
