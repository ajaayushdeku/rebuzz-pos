/**
 * The business's AI provider key, from the browser's side.
 *
 * `saveAiKey` is the only function that ever carries the plaintext key, and it
 * only sends it. There is deliberately no counterpart that reads one back:
 * `fetchAiKeyStatus` returns a mask, which is all the settings screen needs.
 */

/** A provider the service can call. Names and links only, never credentials. */
export interface AiProvider {
  id: string;
  label: string;
  defaultModel: string;
  /** Where to create a key for this provider. */
  keysUrl: string;
}

export interface AiKeyStatus {
  /** Which provider this business uses; "gemini" until one is chosen. */
  provider: string;
  configured: boolean;
  enabled: boolean;
  model: string | null;
  /** e.g. "AIza••••4f2c" — for display only, never a usable credential. */
  maskedKey: string | null;
  lastVerifiedAt?: string | null;
  updatedAt?: string | null;
  /** The choices, sent with the status so the form needs no second request. */
  providers?: AiProvider[];
  /** The providers that already hold a key, so switching can say what it needs. */
  configuredProviders?: string[];
}

/**
 * The service's error codes, as sentences.
 *
 * It is the user's own key and quota, so an invalid key, an exhausted quota
 * and a rate limit each need a different action — collapsing them into
 * "something went wrong" leaves nothing to do about it.
 */
const MESSAGES: Record<string, string> = {
  AI_KEY_INVALID:
    "That key was rejected. Check you copied all of it, and that it hasn't been deleted.",
  AI_QUOTA_EXCEEDED:
    "That key has no quota left. Check your usage with your provider.",
  AI_RATE_LIMIT:
    "Too many requests to your AI provider just now — try again shortly.",
  AI_MODEL_UNAVAILABLE:
    "That model isn't available for this key. Try a different one.",
  AI_UNAVAILABLE: "Couldn't reach your AI provider. Try again in a moment.",
  PROVIDER_NOT_CONFIGURED:
    "Add a key for that provider before switching to it.",
  API_KEY_REQUIRED: "Enter your API key first.",
  AUTH_REQUIRED: "Your session has expired — sign in again.",
  AUTH_INVALID: "Your session has expired — sign in again.",
  AUTH_UPSTREAM_UNAVAILABLE:
    "Couldn't verify your account just now. Try again in a moment.",
  // Codes the service sends that had no sentence, so the form printed the
  // code itself — "VERIFY_RATE_LIMIT" in red under a dropdown.
  // No "try again" here: the wait arrives with every 429 and is appended.
  VERIFY_RATE_LIMIT: "Too many key checks just now.",
  KEY_UNREADABLE:
    "Your saved key can't be read any more. Enter it again to replace it.",
  NOT_CONFIGURED: "Save an API key first.",
  NOTHING_TO_UPDATE: "Nothing changed.",
};

function toMessage(
  rawCode: unknown,
  available?: unknown,
  retryAfter?: unknown,
  detail?: unknown,
): string {
  if (typeof rawCode !== "string") return "Something went wrong.";
  // A service from before the second provider still answers GEMINI_*; the
  // messages are keyed by the neutral spelling.
  const code = rawCode.replace(/^GEMINI_/, "AI_");

  // A model failure is only actionable if the alternatives are named.
  if (
    code === "AI_MODEL_UNAVAILABLE" &&
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

  /**
   * The provider's own words, when it gave any.
   *
   * Our sentence says what kind of problem it is; theirs says which plan,
   * which model or when the limit resets — and without it, "that key has no
   * quota left" on a key created a minute ago is a dead end.
   */
  if (typeof detail === "string" && detail.trim()) {
    return `${base} ${providerLabelPrefix(detail.trim())}`;
  }

  return base;
}

/** The provider's message, quoted so it is clearly not ours. */
const providerLabelPrefix = (detail: string) =>
  `Your provider said: “${detail.replace(/\s+/g, " ")}”`;

const EMPTY: AiKeyStatus = {
  provider: "gemini",
  configured: false,
  enabled: false,
  model: null,
  maskedKey: null,
};

export const fetchAiKeyStatus = async (): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      toMessage(json?.error, json?.available, json?.retryAfter, json?.detail),
    );
  return json?.data ?? EMPTY;
};

/**
 * Save a key. Saving also selects that provider — nobody adds a key for a
 * provider they did not mean to start using.
 */
export const saveAiKey = async (
  apiKey: string,
  provider?: string,
): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, ...(provider ? { provider } : {}) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      toMessage(json?.error, json?.available, json?.retryAfter, json?.detail),
    );
  return json?.data ?? EMPTY;
};

export const removeAiKey = async (): Promise<void> => {
  const res = await fetch("/api/settings/ai", { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(toMessage(json?.error));
  }
};

/**
 * Switch to a provider whose key is already saved.
 *
 * The service refuses a switch to one with no key (PROVIDER_NOT_CONFIGURED),
 * because that would leave the business configured with nothing to call.
 */
export const switchAiProvider = async (
  provider: string,
): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      toMessage(json?.error, json?.available, json?.retryAfter, json?.detail),
    );
  return json?.data ?? EMPTY;
};

export interface AiModelList {
  provider?: string;
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
export const fetchAiModels = async (
  provider?: string,
): Promise<AiModelList> => {
  const res = await fetch(
    provider
      ? `/api/settings/ai/models?provider=${encodeURIComponent(provider)}`
      : "/api/settings/ai/models",
    { cache: "no-store" },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      toMessage(json?.error, json?.available, json?.retryAfter, json?.detail),
    );
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
 * stored, only the model recorded for the provider in use changes.
 */
export const updateAiModel = async (model: string): Promise<AiKeyStatus> => {
  const res = await fetch("/api/settings/ai", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      toMessage(json?.error, json?.available, json?.retryAfter, json?.detail),
    );
  return json?.data ?? EMPTY;
};
