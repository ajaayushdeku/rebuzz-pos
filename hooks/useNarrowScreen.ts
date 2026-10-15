"use client";

import { useEffect, useState } from "react";

/** Below Tailwind's `sm`. */
const NARROW_QUERY = "(max-width: 639px)";

/**
 * Whether the viewport is narrower than `sm`.
 *
 * Read in JS rather than CSS because the document previews use it to decide a
 * *width* they hand to a component — `PhoneFrame`'s `width` prop — not a class
 * they paint with. A media query cannot set a prop.
 *
 * Starts false, so the server render and the first client render agree, then
 * corrects on mount. That is the same shape the dashboard charts use for their
 * own breakpoint reads, and it keeps the `setState` out of the effect body,
 * where `react-hooks/set-state-in-effect` would flag it.
 */
export function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const update = () => setNarrow(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return narrow;
}
