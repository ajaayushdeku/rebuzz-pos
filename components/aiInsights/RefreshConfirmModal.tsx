"use client";

import { RefreshCw, Loader2, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

import ModalShell from "@/components/ui/ModalShell";
import { useAiKeyStatus, useAiProviderLabel } from "@/hooks/useAiKey";
import ProviderLogo from "../settingsComponents/apiKeys/ProviderLogo";

export default function RefreshConfirmModal({
  open,
  onClose,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const { data: status } = useAiKeyStatus();
  const providerLabel = useAiProviderLabel();

  const disabled = busy;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      busy={busy}
      title="Generate a new answer?"
      subtitle="This replaces the advice shown in this section and spends one request on your AI key."
      icon={Sparkles}
      iconColor="text-[#315b9a] dark:text-[#a8c4ee]"
      iconBgColor="bg-[#eaf1fc] dark:bg-blue-400/10"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.035] dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#315b9a] px-4 py-3 text-[13px] font-bold text-white shadow-sm shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-[#284d85] hover:shadow-md hover:shadow-blue-900/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:bg-[#3b69aa] dark:hover:bg-[#4778bb]"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-35deg]" />
                Generate
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* AI provider and model */}
        <div className="space-y-2">
          {/* Provider */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white px-3.5 py-3 transition-colors dark:border-white/[0.09] dark:bg-[#191f2c]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200/70 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.045]">
              {status?.provider ? (
                <ProviderLogo provider={status.provider} size={28} />
              ) : (
                <Sparkles
                  size={21}
                  className="text-[#315b9a] dark:text-[#a8c4ee]"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500">
                AI Provider
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                {providerLabel ?? "Unknown"}
              </p>
            </div>

            {status?.configured && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-400">
                <CheckCircle2 size={11} />
                Connected
              </span>
            )}
          </div>

          {/* Model */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white px-3.5 py-3 transition-colors dark:border-white/[0.09] dark:bg-[#191f2c]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce7f7] bg-[#f1f5fc] text-[#315b9a] dark:border-blue-300/10 dark:bg-blue-400/[0.08] dark:text-[#9bb9e8]">
              <Cpu size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500">
                Selected Model
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                {status?.model ?? "Provider default"}
              </p>
            </div>

            <span className="shrink-0 rounded-md border border-[#dce7f7] bg-[#f1f5fc] px-2 py-1 text-[9px] font-bold tracking-wide text-[#315b9a] dark:border-blue-300/10 dark:bg-blue-400/[0.08] dark:text-[#9bb9e8]">
              MODEL
            </span>
          </div>

          {/* Caption */}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            <Sparkles
              size={12}
              className="text-[#7292c0] dark:text-[#819fcf]"
            />
            <span>Ready to give your insights a refresh?</span>
          </div>
        </div>

        {/* Disabled warning */}
        {status?.configured && status.enabled === false && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-300">
            AI is switched off for this business, so this request will be
            refused. Turn it back on under Settings → API Keys.
          </p>
        )}
      </div>
    </ModalShell>
  );
}
