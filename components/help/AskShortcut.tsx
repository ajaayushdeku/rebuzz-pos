"use client";

import { MessagesSquare } from "lucide-react";
import HeaderActionButton from "@/components/ui/HeaderActionButton";

/**
 * The header's way into the form at the foot of the page.
 *
 * Someone who arrives already knowing they want a person reads the whole
 * page looking for the way to reach one. This is that way, in the place a
 * page's actions live.
 *
 * It scrolls rather than linking to `#ask`: a hash sets the address bar and
 * leaves a history entry, so Back would climb through every jump instead of
 * returning where the reader came from.
 */
export default function AskShortcut() {
  return (
    <HeaderActionButton
      variant="dashed"
      icon={MessagesSquare}
      hideLabelOnMobile
      label="Ask or give feedback"
      onClick={() =>
        document
          .getElementById("ask")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    />
  );
}
