"use client";

import { LifeBuoy } from "lucide-react";

import { AI_TROUBLE_SECTION_ID } from "./aiTroubleAnchor";

/**
 * Takes the page to the help note at the foot of it.
 *
 * In the header rather than beside the note, because it answers a question
 * asked somewhere else entirely: a merchant arrives here from an insight that
 * failed, and the advice is below three cards they have no reason to read. The
 * top of the page is where they are already looking.
 *
 * A real anchor, not a button with a handler: it works before the JavaScript
 * loads, the target shows in the status bar on hover, and middle-clicking does
 * something sensible. The handler only upgrades the jump to a smooth one.
 */
export default function AiTroubleJumpLink() {
  const jump = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(AI_TROUBLE_SECTION_ID);
    // No target — let the href do whatever it can rather than swallowing the
    // click. This is the case where the note was renamed or removed.
    if (!target) return;

    event.preventDefault();

    // Smooth unless the reader has asked for less movement, in which case a
    // long animated scroll is the exact thing they turned off.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });

    // Scrolling moves the page but not the keyboard's place in it, so a
    // keyboard or screen-reader user would be left where they started. The note
    // carries tabIndex={-1} to be focusable for exactly this.
    target.focus({ preventScroll: true });

    // Leaves the hash behind without a second jump, so a reload or a shared
    // link lands on the note.
    window.history.replaceState(null, "", `#${AI_TROUBLE_SECTION_ID}`);
  };

  return (
    <a
      href={`#${AI_TROUBLE_SECTION_ID}`}
      onClick={jump}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#dadce0] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#5f6368] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#a9b4c7] dark:hover:border-blue-400/40 dark:hover:bg-blue-400/15 dark:hover:text-[#a8c4ee]"
    >
      <LifeBuoy className="h-3.5 w-3.5 shrink-0" aria-hidden />
      AI not answering?
    </a>
  );
}
