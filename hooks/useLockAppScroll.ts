"use client";

import { useEffect } from "react";

/** The app shell's scroll container, marked in `MainContent`. */
const APP_SCROLL_SELECTOR = "[data-app-scroll]";

/**
 * Freeze the page behind an overlay.
 *
 * The app shell scrolls inside `<main>`, not the window, so locking `body`
 * here would do nothing — the page would keep moving under the modal. This
 * locks whichever element is actually scrolling.
 *
 * `body` is the fallback rather than a mistake: the preview, auth and
 * onboarding routes sit outside the shell and still scroll the window, and a
 * modal used on both sides should not need to know which it is in.
 *
 * The previous value is restored rather than cleared, so two overlays open at
 * once — a confirm dialog raised from inside a modal — unwind in order instead
 * of the inner one releasing the outer one's lock.
 */
export function useLockAppScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const target =
      document.querySelector<HTMLElement>(APP_SCROLL_SELECTOR) ?? document.body;
    const previous = target.style.overflow;
    target.style.overflow = "hidden";

    return () => {
      target.style.overflow = previous;
    };
  }, [active]);
}
