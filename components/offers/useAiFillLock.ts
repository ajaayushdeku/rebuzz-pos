"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Locks the AI Fill button while the business's AI quota is used up.
 *
 * Pressing it again would only fail the same way, so the button dims and says
 * why and until when instead. Remembered in this browser, so a reload does not
 * hand back a button that cannot work; it unlocks itself when the time is up.
 */

export interface AiFillLock {
  /** When the button may be tried again, epoch ms. */
  until: number;
  /** Why it is locked, for the hover message. */
  reason: string;
}

const STORAGE_KEY = "rebuzz:offer-ai-fill-lock";

const MINUTE_MS = 60_000;

/**
 * How long each quota answer locks the button for.
 *
 * The app's own hourly limit says exactly when it frees up (`retryAfter`).
 * Google's per-minute limit clears within a minute. Google's daily quota gives
 * no time, so the button is tried again after an hour rather than kept locked
 * for a day that might already be nearly over.
 */
export function lockFor(
  code: string,
  retryAfterSeconds: number | undefined,
): AiFillLock | null {
  const now = Date.now();
  // A service from before the second provider still answers GEMINI_*.
  switch (code.replace(/^GEMINI_/, "AI_")) {
    case "INSIGHTS_RATE_LIMIT":
      return {
        until: now + Math.max(1, retryAfterSeconds ?? 3600) * 1000,
        reason: "AI requests for this hour are used up.",
      };
    case "AI_RATE_LIMIT":
      return {
        until: now + Math.max(1, retryAfterSeconds ?? 60) * 1000,
        reason: "Your AI provider is getting too many requests from your key.",
      };
    case "AI_QUOTA_EXCEEDED":
      return {
        until: now + 60 * MINUTE_MS,
        reason: "Your key's usage limit is reached.",
      };
    default:
      return null;
  }
}

/** "in 12 min", "in 45 sec", "at 3:40 PM". */
export function unlockLabel(until: number): string {
  const left = until - Date.now();
  if (left <= MINUTE_MS) return `in ${Math.max(1, Math.ceil(left / 1000))} sec`;
  if (left <= 60 * MINUTE_MS) return `in ${Math.ceil(left / MINUTE_MS)} min`;
  return `at ${new Date(until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

/*
 * The lock lives in localStorage, read through useSyncExternalStore: the
 * server renders it unlocked, the browser then shows what is stored, and a
 * lock set in another tab shows here too.
 */
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedLock: AiFillLock | null = null;
/** Stand-in for localStorage when the browser blocks it. */
let memoryLock: string | null = null;

function readStored(): AiFillLock | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private window or blocked storage: only this visit's lock counts.
    raw = memoryLock;
  }
  // The same object back while nothing changed, as the store contract needs.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const lock = raw ? (JSON.parse(raw) as AiFillLock) : null;
      cachedLock = typeof lock?.until === "number" ? lock : null;
    } catch {
      cachedLock = null;
    }
  }
  return cachedLock;
}

function writeStored(lock: AiFillLock | null) {
  const raw = lock ? JSON.stringify(lock) : null;
  memoryLock = raw;
  try {
    if (raw) localStorage.setItem(STORAGE_KEY, raw);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Kept in memory instead (see readStored).
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function useAiFillLock() {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  // The clock the lock is compared with. Moved on by timers, so "in 12 min"
  // counts down and the button unlocks by itself when the time is up.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!stored) return;
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    const unlock = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, stored.until - Date.now()) + 50,
    );
    return () => {
      clearInterval(tick);
      clearTimeout(unlock);
    };
  }, [stored]);

  const setLock = useCallback((next: AiFillLock | null) => {
    setNow(Date.now());
    writeStored(next);
  }, []);

  const lock = stored && stored.until > now ? stored : null;
  return { lock, setLock };
}
