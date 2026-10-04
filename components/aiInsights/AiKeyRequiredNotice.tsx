import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";

/**
 * Stands in for the whole AI Insights page when no provider key is saved.
 *
 * The page is reachable by URL and from the menu, and without a key every one
 * of its eight sections can only be refused — so the page used to answer with
 * eight copies of the same "Connect your AI key" panel, which reads as eight
 * things being broken rather than one thing not set up yet.
 *
 * Violet and `KeyRound` deliberately: that is the tone `AiInsightsErrorState`
 * gives set-up the merchant finishes, as against red for something wrong and
 * amber for something temporary. Same meaning, same colour, wherever it shows.
 *
 * `Link`, not a plain anchor, so the trip to settings and back is client-side
 * and whatever the page has already loaded survives it.
 */
export default function AiKeyRequiredNotice() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-violet-100 bg-violet-50/50 px-5 py-5 dark:border-violet-400/20 dark:bg-violet-400/10"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-400/15"
          aria-hidden
        >
          <KeyRound
            size={20}
            className="text-violet-600 dark:text-violet-300"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#3c4043] dark:text-[#e8ecf4]">
            Connect an AI key to switch insights on
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#5f6368] dark:text-[#c3ccdc]">
            This page reads your own sales, menu, customers and staff, and asks
            an AI provider to make sense of them. It runs on your key, so
            nothing here can be generated until one is saved.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5f6368] dark:text-[#a9b4c7]">
            Google Gemini and OpenRouter both have a free tier, and creating a
            key takes about a minute — the settings page has the steps for
            whichever you pick.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href="/settings/api-keys"
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Add your API key
              <ArrowRight size={13} />
            </Link>

            <span className="text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
              All eight sections on this page wait on it.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
