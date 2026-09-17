/**
 * AI Insights, from the browser's side.
 *
 * The browser builds the briefing (so the payload is inspectable in devtools)
 * and posts it to this app's own route handler, which attaches the session
 * token, the system instruction and the response schema before forwarding to
 * the BYOK AI service. Nothing here ever sees a Gemini key.
 */

import type {
  AiInsightsEnvelope,
  AiInsightsErrorCode,
  AiInsightsResponse,
  AiInsightsApiResponse,
} from "@/lib/ai-insights/contract";
import type { AiSectionResult } from "@/lib/ai-insights/sections/shared";

/** The AI Insights page sections that have a route under /api/ai-insights. */
export type AiSectionName =
  | "sales-recommendations"
  | "slow-items"
  | "menu-suggestions"
  | "festival-prep"
  | "hour-playbook";

/**
 * The service's error codes, as sentences.
 *
 * These are the same codes the settings screen already translates, extended
 * with the two the insights route adds. Kept local rather than shared because
 * the settings client deliberately answers some of them differently ("Enter
 * your API key first" only makes sense while typing one).
 */
const MESSAGES: Record<AiInsightsErrorCode | string, string> = {
  // Merchant-side preconditions — the fix is in the settings screen.
  NOT_CONFIGURED: "Add your Gemini API key to switch the AI insights on.",
  AI_DISABLED: "AI insights are switched off. Turn them on in settings.",

  // Storage problems.
  KEY_UNREADABLE:
    "Your saved key can't be read any more. Enter it again in settings.",

  // Upstream Gemini failures, inherited from the settings vocabulary.
  GEMINI_KEY_INVALID:
    "Google rejected your saved key. Check it in settings — it may have been deleted.",
  GEMINI_QUOTA_EXCEEDED:
    "Your Gemini key has no quota left. Check your usage in Google AI Studio.",
  GEMINI_RATE_LIMIT:
    "Too many requests to Google just now — try again shortly.",
  GEMINI_MODEL_UNAVAILABLE:
    "The model saved for this business isn't available for your key. Pick another one in settings.",
  GEMINI_UNAVAILABLE:
    "Google's AI model is busy right now — it usually recovers in a minute or two. Try again shortly.",

  // Own rate limits (429, per-business). `retryAfter` carries the wait when
  // the backend sent one — appended here so the user sees "try again in N s"
  // instead of a bare "too many".
  // No "try again" in either: the wait now reaches the client with every 429
  // and is appended, and both together read "try again shortly. Try again in
  // 40 s."
  INSIGHTS_RATE_LIMIT: "Too many insight requests for this business just now.",
  VERIFY_RATE_LIMIT: "Too many key checks just now.",

  // Model output problems — retrying is reasonable, the prompt was fine.
  GEMINI_MALFORMED_RESPONSE:
    "The AI answered in a format we couldn't read. Try again.",
  GEMINI_EMPTY_RESPONSE: "The AI returned nothing. Try again.",
  // Distinct from a malformed answer: nothing was wrong with the format, the
  // reply ran out of room before it finished.
  GEMINI_TRUNCATED:
    "The AI's answer was cut off before it finished. Try again.",

  // The POS report an AI Insights section is built from did not answer.
  SALES_DATA_UNAVAILABLE: "Your sales report couldn't be loaded just now.",

  // Request problems (should not happen from this client).
  BRIEFING_REQUIRED: "There was no data to analyse.",
  BRIEFING_TOO_LONG: "That's too much data to analyse at once.",

  // Session / transport.
  AUTH_REQUIRED: "Your session has expired — sign in again.",
};

function toMessage(code: unknown): string {
  if (typeof code !== "string" || !code) return "Something went wrong.";
  return MESSAGES[code] ?? code;
}

/**
 * The model's answer, or a typed reason it didn't come back.
 *
 * `needsSetup` exists so the caller can route the user to settings without
 * re-deriving which status codes mean that. It is true only for the two
 * preconditions the merchant controls.
 */
export class AiInsightsError extends Error {
  readonly code: string;
  readonly needsSetup: boolean;
  /** Seconds to wait before retrying. Only set on our own 429 answers. */
  readonly retryAfter?: number;

  constructor(code: string, message: string, retryAfter?: number) {
    super(message);
    this.name = "AiInsightsError";
    this.code = code;
    this.needsSetup = code === "NOT_CONFIGURED" || code === "AI_DISABLED";
    this.retryAfter = retryAfter;
  }
}

/** A failed response's body as a typed error, shared by every AI request. */
function errorFromBody(json: {
  error?: unknown;
  retryAfter?: unknown;
}): AiInsightsError {
  const code = typeof json?.error === "string" ? json.error : "UNKNOWN";
  // The backend mirrors Retry-After in the body on 429s; surface the wait as
  // part of the sentence so the user sees "try again in 40 s", not just
  // "too many". Ignored unless it is a finite positive number.
  const retryAfter =
    typeof json?.retryAfter === "number" &&
    Number.isFinite(json.retryAfter) &&
    json.retryAfter > 0
      ? Math.ceil(json.retryAfter)
      : undefined;
  const base = toMessage(code);
  return new AiInsightsError(
    code,
    retryAfter !== undefined ? `${base} Try again in ${retryAfter} s.` : base,
    retryAfter,
  );
}

/**
 * One section of the AI Insights page, e.g. "slow-items".
 *
 * Posts nothing but `refresh`: the section's route gathers the figures and
 * writes the briefing itself. Without `refresh` the route may answer from the
 * day's cache at no cost; with it, a new answer is generated and paid for.
 */
export const fetchAiSection = async <T>(
  section: AiSectionName,
  refresh = false,
): Promise<AiSectionResult<T>> => {
  let res: Response;
  try {
    res = await fetch(`/api/ai-insights/${section}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: AiSectionResult<T>;
    error?: unknown;
    retryAfter?: unknown;
  };

  if (!res.ok) throw errorFromBody(json);
  if (!json.data || !Array.isArray(json.data.items)) {
    throw new AiInsightsError(
      "GEMINI_MALFORMED_RESPONSE",
      toMessage("GEMINI_MALFORMED_RESPONSE"),
    );
  }
  return json.data;
};

/**
 * Ask for insights on a briefing already built by `buildBriefing`.
 *
 * `responseSchema` is always sent by the route handler, so the service always
 * parses the model's answer and `insights` is the structured object. The string
 * case in the envelope's type is unreachable from here; it is narrowed below
 * and guarded rather than asserted, so a future change that stops sending the
 * schema fails loudly instead of rendering a paragraph into a card.
 */
export const fetchAiInsights = async (
  briefing: string,
): Promise<AiInsightsEnvelope> => {
  let res: Response;
  try {
    res = await fetch("/api/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefing }),
    });
  } catch {
    // Only a network failure reaches here — a refused connection, or the tab
    // going offline. Distinct message because the fix is "try again", not
    // "change something in settings".
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = (await res.json().catch(() => ({}))) as Partial<
    AiInsightsApiResponse & { error?: string; retryAfter?: unknown }
  >;

  if (!res.ok) throw errorFromBody(json);

  const envelope = json?.data;
  if (!envelope?.insights || typeof envelope.insights === "string") {
    throw new AiInsightsError(
      "GEMINI_MALFORMED_RESPONSE",
      toMessage("GEMINI_MALFORMED_RESPONSE"),
    );
  }

  return { ...envelope, insights: envelope.insights as AiInsightsResponse };
};
