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
  // Codes the service sends that had no sentence, so the form printed the
  // code itself — "VERIFY_RATE_LIMIT" in red under a dropdown.
  // No "try again" here: the wait arrives with every 429 and is appended.
  VERIFY_RATE_LIMIT: "Too many checks with Google just now.",
  KEY_UNREADABLE:
    "Your saved key can't be read any more. Enter it again to replace it.",
  NOT_CONFIGURED: "Save an API key first.",
  NOTHING_TO_UPDATE: "Nothing changed.",
};

function toMessage(
  code: unknown,
  available?: unknown,
  retryAfter?: unknown,
): string {
  if (typeof code !== "string") return "Something went wrong.";

  // A model failure is only actionable if the alternatives are named.
  if (
    code === "GEMINI_MODEL_UNAVAILABLE" &&
    Array.isArray(available) &&
    available.length > 0
  ) {
    return `${MESSAGES[code]} Available to your key: ${available.join(", ")}.`;
  }

  const base = MESSAGES[code] ?? code;

  // A rate limit is only actionable if it says how long. The service sends the
  // wait in seconds; anything that is not a positive finite number is ignored.
  if (
    typeof retryAfter === "number" &&
    Number.isFinite(retryAfter) &&
    retryAfter > 0
  ) {
    return `${base} Try again in ${Math.ceil(retryAfter)} s.`;
  }

  return base;
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
  if (!res.ok) throw new Error(toMessage(json?.error, json?.available, json?.retryAfter));
  return json?.data ?? EMPTY;
};

export const saveAiKey = async (apiKey: string): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toMessage(json?.error, json?.available, json?.retryAfter));
  return json?.data ?? EMPTY;
};

export const removeAiKey = async (): Promise<void> => {
  const res = await fetch("/api/settings/ai", { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(toMessage(json?.error));
  }
};

export interface AiModelList {
  models: string[];
  current: string | null;
}

/**
 * The models the stored key can actually call.
 *
 * The backend answers 404 NOT_CONFIGURED when no key is saved, so this throws
 * the same sentence the status screen shows — and the UI simply never calls it
 * unless a key is configured.
 */
export const fetchAiModels = async (): Promise<AiModelList> => {
  const res = await fetch("/api/settings/ai/models", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toMessage(json?.error, json?.available, json?.retryAfter));
  return (
    json?.data ?? {
      models: [],
      current: null,
    }
  );
};

/**
 * Switch the model the business's stored key runs against.
 *
 * Uses the existing PATCH on /api/settings/ai: the key stays exactly as
 * stored, only the `gemini.model` attribute it points at changes.
 */
export const updateAiModel = async (model: string): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toMessage(json?.error, json?.available, json?.retryAfter));
  return json?.data ?? EMPTY;
};
