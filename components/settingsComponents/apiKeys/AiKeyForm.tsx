"use client";

import { useState } from "react";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import ProviderLogo from "./ProviderLogo";
import { markPaint, metaFor } from "./providerMeta";
import { ComponentHeader } from "@/components/ComponentHeader";
import {
  useAiKeyStatus,
  useAiModels,
  useRemoveAiKey,
  useSaveAiKey,
  useSwitchAiProvider,
  useUpdateAiModel,
} from "@/hooks/useAiKey";
import type { AiProvider } from "@/services/apiAiKey.client";

/**
 * Add, replace or remove the business's key for one AI provider.
 *
 * The field is write-only: it starts empty even when a key is saved, and what
 * is stored is shown only as the mask the server derives. Nothing here can
 * read a key back — no endpoint in the chain returns one.
 *
 * Which provider this is about comes from the list beside it. One provider is
 * in use at a time, but a key is kept per provider, so trying OpenRouter and
 * going back to Gemini does not mean pasting the Gemini key again.
 */
export default function AiKeyForm({ provider }: { provider: AiProvider }) {
  const { data: status, isLoading, error: statusError } = useAiKeyStatus();
  const save = useSaveAiKey();
  const remove = useRemoveAiKey();
  const switchProvider = useSwitchAiProvider();

  const [apiKey, setApiKey] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const providers = status?.providers ?? [];
  const activeProvider = status?.provider ?? "gemini";
  const selected = provider.id;
  const isActive = selected === activeProvider;
  const meta = metaFor(selected);

  // A key is stored per provider. The status describes the one in use, so any
  // other provider has only the "does it have a key" answer to go on.
  const configuredProviders =
    status?.configuredProviders ?? (status?.configured ? [activeProvider] : []);
  const hasKey = configuredProviders.includes(selected);
  const configured = isActive && (status?.configured ?? false);

  const actionError = save.error ?? remove.error ?? switchProvider.error;

  // The selector only exists once a key is stored and in use: the model list is
  // fetched from the provider with the stored key, so there is nothing to ask
  // about — and PATCH would answer 404 — without one. Switching a model never
  // touches the key itself.
  const models = useAiModels(configured, selected);
  const updateModel = useUpdateAiModel();
  const currentModel = status?.model ?? null;
  const selectableModels = models.data?.models ?? [];

  const handleSave = () => {
    const key = apiKey.trim();
    if (!key || save.isPending) return;

    setJustSaved(false);
    setConfirmingRemove(false);
    save.mutate(
      { apiKey: key, provider: selected },
      {
        onSuccess: () => {
          // Cleared at once: there is no reason for a live credential to sit in
          // component state, or in the DOM, after it has been stored.
          setApiKey("");
          setRevealed(false);
          setJustSaved(true);
        },
      },
    );
  };

  /**
   * Deliberately not a prefix check.
   *
   * Google is midway through changing its format: older keys begin `AIza`,
   * newly issued ones begin `AQ.`, and both work. OpenRouter's begin
   * `sk-or-v1-`, and that can change too. A rule naming one would reject
   * whichever half of the world it was not written for. Only what is always
   * true is checked: a key is one unbroken token, and it is long. Whether it
   * actually works is a question only the provider can answer, and the service
   * asks it before storing anything.
   */
  const trimmed = apiKey.trim();
  const looksWrong =
    trimmed.length > 0 && (/\s/.test(trimmed) || trimmed.length < 20);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center gap-2 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading key status…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: meta.mark?.bg ?? meta.tint }}
          >
            {/* The provider's own mark, in its own colours. */}
            <ProviderLogo provider={selected} size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <ComponentHeader title={provider.label} subHeader={meta.blurb} />
          </div>

          {isActive && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
              In use
            </span>
          )}
        </div>

        {/* A key is stored for this provider, but another one is answering. */}
        {!isActive && hasKey && (
          // Drawn in the provider being switched to, so the panel reads as
          // that provider throughout rather than a generic blue notice.
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset"
            style={
              {
                backgroundColor: meta.tint,
                "--tw-ring-color": meta.accent + "26",
              } as React.CSSProperties
            }
          >
            <p className="text-[12px] leading-relaxed text-gray-700">
              A key for {provider.label} is saved. AI features are using{" "}
              {providers.find((p) => p.id === activeProvider)?.label ??
                activeProvider}{" "}
              at the moment.
            </p>
            <button
              type="button"
              onClick={() => switchProvider.mutate(selected)}
              disabled={switchProvider.isPending}
              style={{
                backgroundColor: meta.button.bg,
                color: meta.button.ink,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = meta.button.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = meta.button.bg;
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {switchProvider.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ProviderLogo
                  provider={selected}
                  size={14}
                  paint={meta.button.ink}
                />
              )}
              Use {provider.label}
            </button>
          </div>
        )}

        {configured && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-green-800">
                  Key saved
                </p>
                <p className="truncate font-mono text-[11px] text-green-700">
                  {status?.maskedKey ?? "••••"}
                </p>
              </div>
            </div>
            {/* Two steps, because one click would destroy a credential that
                cannot be recovered from here or from the provider. Neutral
                until armed, so the destructive colour means "this will happen
                next" rather than decorating a button that is always present. */}
            {confirmingRemove ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {remove.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={remove.isPending}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-[12px] font-medium text-gray-500 transition hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
        )}

        {/* Model selector — only for the provider in use. The options are the
            models it reports this key can actually call, fetched with the
            stored credential; there is nothing to ask about otherwise. */}
        {configured && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="ai-model"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400"
              >
                Model
              </label>
              {models.isFetching && (
                <span className="mb-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading models…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <ProviderLogo
                provider={selected}
                size={15}
                className="pointer-events-none shrink-0"
              />
              <select
                id="ai-model"
                value={currentModel ?? ""}
                onChange={(e) => {
                  const model = e.target.value;
                  if (!model || model === currentModel) return;
                  updateModel.mutate(model);
                }}
                disabled={
                  updateModel.isPending || selectableModels.length === 0
                }
                style={{ outlineColor: meta.accent }}
                className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-[13px] font-medium text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-300/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* The stored model stays selectable even when the provider no
                    longer reports it, so the selector never shows a value the
                    user cannot see or silently clobber. */}
                {currentModel && !selectableModels.includes(currentModel) && (
                  <option value={currentModel}>{currentModel} (current)</option>
                )}
                {selectableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              {updateModel.isPending && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
              AI features run on this model. Changing it does not touch your
              key.
            </p>
            {models.error && !updateModel.error && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{(models.error as Error).message}</span>
              </p>
            )}
            {updateModel.error && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{(updateModel.error as Error).message}</span>
              </p>
            )}
            {updateModel.isSuccess && !updateModel.error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600">
                <Check className="h-3.5 w-3.5 shrink-0" />
                Model updated.
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="ai-key"
              className="block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400"
            >
              {hasKey ? "Replace key" : "API key"}
            </label>
            <a
              href={provider.keysUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-gray-500 transition hover:text-gray-800"
            >
              Get a key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="relative">
            <KeyRound
              size={15}
              stroke={markPaint(selected)}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="ai-key"
              // Masked by default. Revealing is opt-in because the most common
              // reason to type this field is pasting, not reading.
              type={revealed ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={meta.placeholder}
              className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 font-mono text-[13px] text-gray-800 outline-none transition focus:ring-2 ${
                looksWrong
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-gray-400 focus:ring-gray-300/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide API key" : "Show API key"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {looksWrong && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                That doesn&apos;t look like a complete key — it should be one
                long line with no spaces. Check you pasted the whole thing.
              </span>
            </p>
          )}

          {/* Replacing overwrites the stored key in place — there is no undo,
              and the provider will not show the old one again either, so a typo
              here loses a working key at both ends. Stated before the click. */}
          {configured && apiKey.trim() && !looksWrong && (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                This replaces your saved key{" "}
                <span className="font-mono font-semibold">
                  {status?.maskedKey ?? "••••"}
                </span>
                . It can&apos;t be undone.
              </span>
            </p>
          )}

          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKey.trim() || looksWrong || save.isPending}
              // The provider's own pairing: Google's blue takes white text,
              // OpenRouter's lime takes near-black.
              style={{
                backgroundColor: meta.button.bg,
                color: meta.button.ink,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = meta.button.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = meta.button.bg;
              }}
              className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-5 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {hasKey ? "Replacing…" : "Saving…"}
                </>
              ) : hasKey ? (
                "Replace key"
              ) : (
                `Save ${provider.label} key`
              )}
            </button>
            <button
              type="button"
              onClick={() => setApiKey("")}
              disabled={!apiKey || save.isPending}
              className="h-9 shrink-0 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {/* Saving a key also selects the provider, which is the one thing
              about this form that is not obvious from the button. */}
          {!isActive && !hasKey && (
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
              Saving a key here also switches AI features to {provider.label}.
            </p>
          )}

          {justSaved && !actionError && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Saved.
            </p>
          )}

          {/* The service's codes arrive already turned into sentences, so an
              exhausted quota reads differently from a bad key — each needs a
              different fix. */}
          {actionError && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-red-500">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{(actionError as Error).message}</span>
            </p>
          )}

          {statusError && !actionError && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{(statusError as Error).message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
