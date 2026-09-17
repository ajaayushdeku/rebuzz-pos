import type { Metadata } from "next";
import GeminiKeyForm from "@/components/settingsComponents/apiKeys/GeminiKeyForm";
import GeminiKeyGuide from "@/components/settingsComponents/apiKeys/GeminiKeyGuide";

export const metadata: Metadata = { title: "API Keys" };

/**
 * Connect the outside services the app's AI features run on.
 *
 * Only Gemini today, but laid out as a list of providers rather than a single
 * form so that adding a second one is a new card, not a redesign.
 */
export default function Page() {
  return (
    <div className="min-h-screen bg-50 px-6 py-8 md:px-10 mx-auto w-full">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold md:text-2xl">API Keys</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Connect your own AI provider to power insights and suggestions.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 lg:sticky lg:top-4">
          <GeminiKeyForm />
        </div>

        <div className="min-w-0 lg:sticky lg:top-4">
          <GeminiKeyGuide />
        </div>
      </div>
    </div>
  );
}
