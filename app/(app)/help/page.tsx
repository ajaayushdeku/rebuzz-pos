import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

export const metadata: Metadata = { title: "Help" };

/**
 * Help & Support.
 *
 * A placeholder for now: the route and the way in from the navbar exist, so
 * the button has somewhere to go, and what belongs on the page can be decided
 * without also deciding where it lives.
 */
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10">
      <div className="mx-auto w-full">
        {/* ── Header ── */}
        <div className="mb-5 flex flex-col gap-4 border-b border-[#e8eaed] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold md:text-2xl">
              Help &amp; Support
            </h1>
            <p className="mt-0.5 text-xs text-[#9aa0a6]">
              Guides, answers and a way to reach us.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e3e3e3] bg-white px-6 py-20 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <LifeBuoy size={24} className="text-gray-500" />
          </div>
          <p className="text-sm text-[#3c4043]">Nothing here yet</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#9aa0a6]">
            This is where help for the app will live. What goes on it is still
            being decided.
          </p>
        </div>
      </div>
    </div>
  );
}
