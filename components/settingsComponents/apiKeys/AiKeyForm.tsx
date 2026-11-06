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
  X,
} from "lucide-react";

import ProviderLogo from "./ProviderLogo";
import { FilterSelect } from "@/components/ui/FilterSelect";
import {
  MARK_TILE_CLASS,
  markPaint,
  markTileVars,
  metaFor,
} from "./providerMeta";
import {
  useAiKeyStatus,
  useAiModels,
  useRemoveAiKey,
  useSaveAiKey,
  useSwitchAiProvider,
  useUpdateAiFallbackPreference,
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
  const updateFallback = useUpdateAiFallbackPreference();

  const [apiKey, setApiKey] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const providers = status?.providers ?? [];
  const activeProvider = status?.provider ?? "gemini";
  const selected = provider.id;
  const isActive = selected === activeProvider;
  const meta = metaFor(selected);
  /** The provider's own colour, in the shade that reads on a dark card. */
  const darkSignal = meta.darkAccent ?? meta.accent;

  // A key is stored per provider. The status describes the one in use, so any
  // other provider has only the "does it have a key" answer to go on.
  const configuredProviders =
    status?.configuredProviders ?? (status?.configured ? [activeProvider] : []);
  const hasKey = configuredProviders.includes(selected);
  const fallbackEnabled = provider.allowAutomaticFallback ?? false;
  const configured = isActive && (status?.configured ?? false);
  const connectionLabel = configured
    ? "Connected · In use"
    : hasKey
      ? "Key saved"
      : "Not connected";

  const actionError = save.error ?? remove.error ?? switchProvider.error;

  // The selector only exists once a key is stored and in use: the model list is
  // fetched from the provider with the stored key, so there is nothing to ask
  // about — and PATCH would answer 404 — without one. Switching a model never
  // touches the key itself.
  const models = useAiModels(configured, selected);
  const updateModel = useUpdateAiModel();
  const currentModel = status?.model ?? null;
  const selectableModels = models.data?.models ?? [];

  /**
   * The models to offer, current one first when the provider has stopped
   * reporting it.
   *
   * Carried over from the native select's `<option>` for the same reason: the
   * stored model must stay visible and selected, or the control would show a
   * different model from the one actually in use and the next change would
   * clobber it silently.
   */
  const modelOptions = [
    ...(currentModel && !selectableModels.includes(currentModel)
      ? [{ value: currentModel, label: `${currentModel} (current)` }]
      : []),
    ...selectableModels.map((model) => ({ value: model, label: model })),
  ];

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
      <div className="flex min-h-28 items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading key status…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-card dark:border-white/15">
      <div className="bg-gradient-to-br from-blue-50 via-violet-50/50 to-card p-5 dark:from-blue-950/40 dark:via-violet-950/20 dark:to-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${MARK_TILE_CLASS}`}
              style={markTileVars(selected)}
            >
              {/* The provider's own mark, in its own colours. */}
              <ProviderLogo provider={selected} size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                {provider.label}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:line-clamp-none">
                {meta.blurb}
              </p>
            </div>
          </div>

          <span
            role="status"
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              configured
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : hasKey
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                  : "border-border bg-background/70 text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                configured
                  ? "bg-emerald-500"
                  : hasKey
                    ? "bg-amber-500"
                    : "bg-slate-400"
              }`}
            />
            {connectionLabel}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {/* A key is stored for this provider, but another one is answering. */}
        {!isActive && hasKey && (
          // Drawn in the provider being switched to, so the panel reads as
          // that provider throughout rather than a generic blue notice.
          // `meta.tint` is a pale wash, which would be a light patch on a dark
          // card — and an inline style cannot carry a `dark:` variant. So both
          // fills are declared as custom properties and the classes pick one:
          // the brand's own tint in light, the same hue at low opacity in dark.
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--panel-light)] px-3.5 py-3 ring-1 ring-[var(--ring-light)] ring-inset dark:bg-[var(--panel-dark)] dark:ring-[var(--ring-dark)]"
            style={
              {
                "--panel-light": meta.tint,
                // `darkAccent`, not `accent`: the latter is near-black for some
                // providers, so both its wash and its ring would be invisible.
                "--panel-dark": `color-mix(in srgb, ${darkSignal} 16%, transparent)`,
                "--ring-light": meta.accent + "26",
                "--ring-dark": darkSignal + "59",
              } as React.CSSProperties
            }
          >
            <p className="text-[12px] leading-relaxed text-[#3c4043] dark:text-[#e8ecf4]">
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
              className="flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-3 dark:border-emerald-400/25 dark:from-emerald-400/10 dark:to-teal-400/5">
            <div className="flex min-w-0 items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-600 dark:text-emerald-300" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-green-800 dark:text-emerald-200">
                  Key saved
                </p>
                <p className="truncate font-mono text-[11px] text-green-700 dark:text-emerald-300">
                  {status?.maskedKey ?? "••••"}
                </p>
              </div>
            </div>
            {/* Two steps, because one click would destroy a credential that
                cannot be recovered from here or from the provider. Neutral
                until armed, so the destructive colour means "this will happen
                next" rather than decorating a button that is always present. */}
            {confirmingRemove ? (
              <div className="flex flex-col sm:flex-row shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-red-600 bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-red-600/15 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-rose-500"
                >
                  {remove.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  )}
                  Remove key
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={remove.isPending}
                  className="flex min-h-9 items-center gap-1.5 cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingRemove(true)}
                className="flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-gradient-to-r from-white to-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-red-900 dark:from-red-950/30 dark:to-red-950/60 dark:text-red-300"
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Remove
              </button>
            )}
          </div>
        )}
        {hasKey && (
          <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3 dark:border-white/15 dark:bg-white/5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
                    Allow automatic fallback
                  </p>

                  {fallbackEnabled && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      Enabled
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] leading-relaxed text-[#80868b] dark:text-[#9aa6bd]">
                  Allow AI features to use {provider.label} automatically when
                  your preferred AI provider becomes unavailable.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={fallbackEnabled}
                aria-label={`Allow ${provider.label} as an automatic fallback`}
                disabled={updateFallback.isPending}
                onClick={() =>
                  updateFallback.mutate({
                    providerId: selected,
                    allowAutomaticFallback: !fallbackEnabled,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fallbackEnabled
                    ? "bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                {updateFallback.isPending ? (
                  <Loader2 className="absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 animate-spin text-white" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      fallbackEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                )}
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-400/10">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />

              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                When enabled, requests may use this provider&lsquo;s API quota
                or paid credits. Only enable providers you are comfortable using
                automatically.
              </p>
            </div>

            {updateFallback.error && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-300">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{(updateFallback.error as Error).message}</span>
              </p>
            )}

            {updateFallback.isSuccess && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5 shrink-0" />
                Fallback preference updated.
              </p>
            )}
          </div>
        )}

        {/* Model selector — only for the provider in use. The options are the
            models it reports this key can actually call, fetched with the
            stored credential; there is nothing to ask about otherwise. */}
        {configured && (
          <div className="mt-3 rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3 dark:border-white/15 dark:bg-white/5">
            <div className="flex items-center justify-between gap-2">
              {/* A span, not a <label htmlFor>: the control is a button now,
                  and a label cannot point at one. FilterSelect's `ariaLabel`
                  carries the name instead. */}
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-[#9aa0a6] dark:text-[#9aa6bd]">
                Model
              </span>
              {models.isFetching && (
                <span className="mb-1.5 flex items-center gap-1 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
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
              {/* The same dropdown the invoice and dashboard filters use, so
                  a select looks like a select everywhere in the app. Model ids
                  are identifiers, hence `preserveCase` — "Gemini-3.6-flash" is
                  not the name of anything. */}
              <FilterSelect
                value={currentModel ?? ""}
                options={modelOptions}
                onChange={(model) => {
                  if (!model || model === currentModel) return;
                  updateModel.mutate(model);
                }}
                disabled={
                  updateModel.isPending || selectableModels.length === 0
                }
                preserveCase
                placeholder={
                  models.isFetching ? "Loading models…" : "No models available"
                }
                ariaLabel="Model"
                className="min-w-0 flex-1"
              />
              {updateModel.isPending && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#9aa0a6] dark:text-[#9aa6bd]" />
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
              AI features run on this model. Changing it does not touch your
              key.
            </p>
            {models.error && !updateModel.error && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-300">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{(models.error as Error).message}</span>
              </p>
            )}
            {updateModel.error && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-300">
                <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{(updateModel.error as Error).message}</span>
              </p>
            )}
            {updateModel.isSuccess && !updateModel.error && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 dark:text-emerald-300">
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
              className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[#9aa0a6] dark:text-[#9aa6bd]"
            >
              {hasKey ? "Replace key" : "API key"}
            </label>
            <a
              href={provider.keysUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-[#5f6368] transition hover:text-[#3c4043] dark:hover:text-[#e8ecf4] dark:text-[#a9b4c7]"
            >
              Get a key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="relative">
            <KeyRound
              size={15}
              stroke={markPaint(selected)}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa0a6] dark:text-[#9aa6bd]"
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
              className={`h-11 w-full rounded-xl border bg-white dark:bg-white/5 pl-10 pr-11 font-mono text-[13px] text-[#3c4043] outline-none transition focus:ring-2 ${
                looksWrong
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/20 dark:focus:border-red-400/60 dark:border-red-400/40"
                  : "border-[#dadce0] focus:border-gray-400 focus:ring-gray-300/40 dark:focus:ring-white/20 dark:focus:border-white/30 dark:border-white/15"
              } dark:text-[#e8ecf4]`}
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide API key" : "Show API key"}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-[#9aa0a6] transition hover:bg-[#f1f3f4] hover:text-[#5f6368] dark:hover:text-[#e8ecf4] dark:hover:bg-white/10 dark:text-[#9aa6bd]"
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {looksWrong && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-300">
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
            <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 dark:bg-amber-400/10">
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
              className="group flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {hasKey ? "Replacing…" : "Saving…"}
                </>
              ) : hasKey ? (
                <>
                  <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Replace key
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Save {provider.label} key
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setApiKey("")}
              disabled={!apiKey || save.isPending}
              className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          {/* Saving a key also selects the provider, which is the one thing
              about this form that is not obvious from the button. */}
          {!isActive && !hasKey && (
            <p className="mt-3 text-[11px] leading-relaxed text-[#9aa0a6] dark:text-[#9aa6bd]">
              Saving a key here also switches AI features to {provider.label}.
            </p>
          )}

          {justSaved && !actionError && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-green-600 dark:text-emerald-300">
              <Check className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Saved.
                {/* Said at the moment it happens: a model the merchant never
                    picked should not first appear in an insight's footer. */}
                {save.data?.fellBackFrom && save.data.model && (
                  <>
                    {" "}
                    Using <span className="font-mono">{save.data.model}</span>,
                    because{" "}
                    <span className="font-mono">{save.data.fellBackFrom}</span>{" "}
                    isn&apos;t available on your plan.
                  </>
                )}
              </span>
            </p>
          )}

          {/* The service's codes arrive already turned into sentences, so an
              exhausted quota reads differently from a bad key — each needs a
              different fix. */}
          {actionError && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-300">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{(actionError as Error).message}</span>
            </p>
          )}

          {statusError && !actionError && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200 dark:bg-amber-400/10">
              <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{(statusError as Error).message}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
