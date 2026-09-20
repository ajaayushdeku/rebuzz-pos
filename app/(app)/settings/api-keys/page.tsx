import type { Metadata } from "next";
import ApiKeysScreen from "@/components/settingsComponents/apiKeys/ApiKeysScreen";

export const metadata: Metadata = { title: "API Keys" };

/**
 * Connect the outside services the app's AI features run on.
 *
 * The screen itself is a client component: which provider is being set up
 * drives the list, the form and the guide together, and that is state. Adding
 * a fourth provider is a row in the list, not a redesign.
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

      <div className="mt-6">
        <ApiKeysScreen />
      </div>
    </div>
  );
}
