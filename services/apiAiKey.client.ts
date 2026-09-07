/**
 * The business's Gemini API key, from the browser's side.
 *
 * `saveAiKey` is the only function that ever carries the plaintext key, and it
 * only sends it. There is deliberately no counterpart that reads one back:
 * `fetchAiKeyStatus` returns a mask, which is all the settings screen needs.
 */

export interface AiKeyStatus {
  configured: boolean;
  enabled: boolean;
  model: string | null;
  /** e.g. "AIza••••4f2c" — for display only, never a usable credential. */
  maskedKey: string | null;
  lastVerifiedAt?: string | null;
  updatedAt?: string | null;
}

/**
 * The service's error codes, as sentences.
 *
 * It is the user's own key and quota, so an invalid key, an exhausted quota
 * and a rate limit each need a different action — collapsing them into
 * "something went wrong" leaves nothing to do about it.
 */
const MESSAGES: Record<string, string> = {
  GEMINI_KEY_INVALID:
    "Google rejected that key. Check you copied all of it, and that it hasn't been deleted.",
  GEMINI_QUOTA_EXCEEDED:
    "That key has no quota left. Check your usage in Google AI Studio.",
  GEMINI_RATE_LIMIT:
    "Too many requests to Google just now — try again shortly.",
  GEMINI_MODEL_UNAVAILABLE:
    "That model isn't available for this key. Try a different one.",
  GEMINI_UNAVAILABLE: "Couldn't reach Google. Try again in a moment.",
  API_KEY_REQUIRED: "Enter your API key first.",
  AUTH_REQUIRED: "Your session has expired — sign in again.",
  AUTH_INVALID: "Your session has expired — sign in again.",
  AUTH_UPSTREAM_UNAVAILABLE:
    "Couldn't verify your account just now. Try again in a moment.",
};

function toMessage(code: unknown): string {
  if (typeof code !== "string") return "Something went wrong.";
  return MESSAGES[code] ?? code;
}

const EMPTY: AiKeyStatus = {
  configured: false,
  enabled: false,
  model: null,
  maskedKey: null,
};

export const fetchAiKeyStatus = async (): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toMessage(json?.error));
  return json?.data ?? EMPTY;
};

export const saveAiKey = async (apiKey: string): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toMessage(json?.error));
  return json?.data ?? EMPTY;
};

export const removeAiKey = async (): Promise<void> => {
  const res = await fetch("/api/settings/ai", { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(toMessage(json?.error));
  }
};
