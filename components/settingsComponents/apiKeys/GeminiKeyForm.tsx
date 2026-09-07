"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Sparkles, TriangleAlert } from "lucide-react";
import { GEMINI_STROKE } from "./googlePalette";
import GeminiGradientDefs from "./GeminiGradientDefs";
import { ComponentHeader } from "@/components/ComponentHeader";

/**
 * The Gemini API key form.
 *
 * Presentation only for now — nothing is sent anywhere and nothing is stored.
 * The field is built as write-only from the start (typed value held just long
 * enough to submit, never read back from a server) so that wiring it later is
 * a matter of filling in the submit handler rather than reworking how the
 * credential is handled.
 */
export default function GeminiKeyForm() {
  const [apiKey, setApiKey] = useState("");
  const [revealed, setRevealed] = useState(false);

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
   * Whether a key actually works is a question only Google can answer, so the
   * real check is the test call made when it is saved.
   */
  const trimmed = apiKey.trim();
  const looksWrong =
    trimmed.length > 0 && (/\s/.test(trimmed) || trimmed.length < 20);

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

        <div className="mt-6">
          <label
            htmlFor="gemini-key"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-gray-400"
          >
            API key
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
              disabled
              title="Saving is not connected yet"
              // Solid Google blue rather than the gradient: white 13px bold
              // over the sweep crosses the yellow stop at 1.71:1, illegible
              // exactly where it is brightest. #1967D2 measures 5.37:1 and
              // still reads as Google. The gradient stays on the hairline,
              // where nothing sits on top of it.

              className="h-9 shrink-0 cursor-not-allowed rounded-xl bg-[#1967D2] px-5 text-[13px] font-bold text-white opacity-50"
            >
              Save key
            </button>
            <button
              type="button"
              onClick={() => setApiKey("")}
              disabled={!apiKey}
              className="h-9 shrink-0 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {/* Said plainly rather than left for someone to discover by pressing
            Save and watching nothing happen. */}
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
            Saving isn&apos;t connected yet — this form is the interface only.
            Nothing you type here is stored or sent anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
