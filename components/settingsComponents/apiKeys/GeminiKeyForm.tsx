"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { GEMINI_STROKE } from "./googlePalette";
import GeminiGradientDefs from "./GeminiGradientDefs";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiKeyStatus, useRemoveAiKey, useSaveAiKey } from "@/hooks/useAiKey";

/**
 * Add, replace or remove the business's own Gemini API key.
 *
 * The field is write-only: it starts empty even when a key is saved, and what
 * is stored is shown only as the mask the server derives. Nothing here can
 * read a key back — no endpoint in the chain returns one.
 */
export default function GeminiKeyForm() {
  const { data: status, isLoading, error: statusError } = useAiKeyStatus();
  const save = useSaveAiKey();
  const remove = useRemoveAiKey();

  const [apiKey, setApiKey] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const configured = status?.configured ?? false;
  const actionError = save.error ?? remove.error;

  const handleSave = () => {
    const key = apiKey.trim();
    if (!key || save.isPending) return;

    setJustSaved(false);
    save.mutate(key, {
      onSuccess: () => {
        // Cleared at once: there is no reason for a live credential to sit in
        // component state, or in the DOM, after it has been stored.
        setApiKey("");
        setRevealed(false);
        setJustSaved(true);
      },
    });
  };

  /**
   * Deliberately not a prefix check.
   *
   * Google is midway through changing the format: older keys begin `AIza`,
   * newly issued ones begin `AQ.`, and both work — the Gemini endpoint has
   * never cared about the prefix. A rule naming one would reject whichever
   * half of the world it was not written for, and the format can change again.
   * Only what is always true is checked: a key is one unbroken token, and it
   * is long.
   *
   * Whether a key actually works is a question only Google can answer. That
   * check is paused server-side for now, so a key that passes this shape test
   * is stored without being tried — it may still fail when an AI feature runs.
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
      <GeminiGradientDefs />
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100/30">
            {/* The colour is on the icon's own strokes, not behind it —
                Gemini's blue → violet → rose sweep. A gradient is invisible at
                16px, so the mark is a little larger and drawn at a lighter
                weight to let the colours read across each stroke. */}
            <Sparkles
              size={20}
              strokeWidth={1.75}
              stroke={GEMINI_STROKE}
              aria-hidden
            />
          </div>

          <ComponentHeader
            title="Google Gemini"
            subHeader="Powers AI features across your dashboard"
          />
        </div>

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
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remove.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Remove
            </button>
          </div>
        )}

        <div className="mt-6">
          <label
            htmlFor="gemini-key"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400"
          >
            {configured ? "Replace key" : "API key"}
          </label>

          <div className="relative">
            <KeyRound
              size={15}
              stroke={GEMINI_STROKE}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="gemini-key"
              // Masked by default. Revealing is opt-in because the most common
              // reason to type this field is pasting, not reading.
              type={revealed ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key…"
              className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 font-mono text-[13px] text-gray-800 outline-none transition focus:ring-2 ${
                looksWrong
                  ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-[#4285F4] focus:ring-[#4285F4]/20"
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

          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKey.trim() || looksWrong || save.isPending}
              // Solid Google blue rather than the gradient: white 13px bold
              // over the sweep crosses the yellow stop at 1.71:1, illegible
              // exactly where it is brightest. #1967D2 measures 5.37:1 and
              // still reads as Google.
              className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#1967D2] px-5 text-[13px] font-bold text-white transition hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save key"
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
