import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

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
        <PageHeader
          title="Help & Support"
          subtitle="Guides, answers and a way to reach us."
        />

        {/* With a plain header above, the empty state is what tells the reader
            the page is unfinished — so it carries the mark and the sentence,
            in the shape the app's other empty states use. */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e3e3e3] bg-white px-6 py-24 text-center">
          {/* A ring rather than a filled disc: the same mark, a touch lighter
              on a card that is mostly empty space. */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#e8eaed] bg-[#f8f9fa]">
            <LifeBuoy size={22} className="text-[#9aa0a6]" />
          </div>
          <p className="text-[15px] font-normal text-[#3c4043]">
            Nothing here yet
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#9aa0a6]">
            This is where help for the app will live. What goes on it is still
            being decided.
          </p>
        </div>
      </div>
    </div>
  );
}
