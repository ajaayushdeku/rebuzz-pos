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
  | "hour-playbook"
  | "pricing"
  | "retention"
  | "staffing";

export type OverviewActivitySnapshot = {
  salesCount: number;
  totalSales: number;
  latestSaleAt: string | null;
};

export type CachedOverviewInsight = {
  insights: AiInsightsResponse;
  model: string;
  provider: string;
  usage: null;
  generatedAt: string;
  cached: true;
  activitySnapshot: OverviewActivitySnapshot | null;
  currentActivitySnapshot: OverviewActivitySnapshot | null;
};

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
  NOT_CONFIGURED: "Add your AI provider's API key to switch the insights on.",
  AI_DISABLED: "AI insights are switched off. Turn them on in settings.",

  // Storage problems.
  KEY_UNREADABLE:
    "Your saved key can't be read any more. Enter it again in settings.",

  // Upstream provider failures, inherited from the settings vocabulary. The
  // wording names no provider: the same codes now come back from Gemini or
  // OpenRouter, whichever the business chose.
  AI_KEY_INVALID:
    "Your AI provider rejected the saved key. Check it in settings — it may have been deleted.",
  AI_QUOTA_EXCEEDED:
    "Your key has no quota left. Check your usage with your AI provider.",
  AI_RATE_LIMIT:
    "Too many requests to your AI provider just now — try again shortly.",
  AI_MODEL_UNAVAILABLE:
    "The model saved for this business isn't available for your key. Pick another one in settings.",
  AI_UNAVAILABLE:
    "Your AI provider is busy right now — it usually recovers in a minute or two. Try again shortly.",

  // Own rate limits (429, per-business). `retryAfter` carries the wait when
  // the backend sent one — appended here so the user sees "try again in N s"
  // instead of a bare "too many".
  // No "try again" in either: the wait now reaches the client with every 429
  // and is appended, and both together read "try again shortly. Try again in
  // 40 s."
  INSIGHTS_RATE_LIMIT: "Too many insight requests for this business just now.",
  VERIFY_RATE_LIMIT: "Too many key checks just now.",

  // Model output problems — retrying is reasonable, the prompt was fine.
  AI_MALFORMED_RESPONSE:
    "The AI answered in a format we couldn't read. Try again.",
  AI_EMPTY_RESPONSE: "The AI returned nothing. Try again.",
  // Distinct from a malformed answer: nothing was wrong with the format, the
  // reply ran out of room before it finished.
  AI_TRUNCATED: "The AI's answer was cut off before it finished. Try again.",

  // The POS report an AI Insights section is built from did not answer.
  SALES_DATA_UNAVAILABLE: "Your sales report couldn't be loaded just now.",

  // Request problems (should not happen from this client).
  BRIEFING_REQUIRED: "There was no data to analyse.",
  BRIEFING_TOO_LONG: "That's too much data to analyse at once.",

  // Session / transport.
  AUTH_REQUIRED: "Your session has expired — sign in again.",

  FEEDBACK_SERVICE_UNAVAILABLE:
    "Customer retention feedback is temporarily unavailable. Try again shortly.",
};

/**
 * Old `GEMINI_*` codes read as the provider-neutral `AI_*` ones.
 *
 * The service renamed them when a second provider arrived, but a cached page
 * or an older deployment can still send the old spelling, and a code with no
 * message shows the user a bare "GEMINI_RATE_LIMIT".
 */
export function normalizeAiErrorCode(code: string): string {
  return code.replace(/^GEMINI_/, "AI_");
}

/** An error code as the sentence the insights screens show for it. */
export function aiErrorMessage(code: unknown): string {
  return toMessage(code);
}

function toMessage(code: unknown): string {
  if (typeof code !== "string" || !code) return "Something went wrong.";
  return MESSAGES[normalizeAiErrorCode(code)] ?? code;
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
  /**
   * Seconds to wait before retrying.
   *
   * Was only ever set by our own hourly limiter's 429. That limiter is gone, and
   * this now carries the provider's own `Retry-After` instead — so it appears on
   * AI_RATE_LIMIT and AI_QUOTA_EXCEEDED, when the provider says how long.
   */
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
 *
 * `more` asks for the next batch of cards for the answer on screen instead
 * (see `MoreRequest` on the server) — only the sections that offer "Generate
 * more" read it.
 */
export const fetchAiSection = async <T>(
  section: AiSectionName,
  refresh = false,
  more?: { batch: number; after: string; exclude: string[] },
): Promise<AiSectionResult<T>> => {
  let res: Response;
  try {
    res = await fetch(`/api/ai-insights/${section}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(more ? { refresh: false, more } : { refresh }),
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
      "AI_MALFORMED_RESPONSE",
      toMessage("AI_MALFORMED_RESPONSE"),
    );
  }

  return json.data;
};

export const fetchCachedOverviewInsight =
  async (): Promise<CachedOverviewInsight> => {
    let res: Response;

    try {
      res = await fetch("/api/ai-insights", {
        method: "GET",
        cache: "no-store",
      });
    } catch {
      throw new AiInsightsError(
        "NETWORK",
        "Couldn't reach the server. Check your connection and try again.",
      );
    }

    const json = (await res.json().catch(() => ({}))) as {
      data?: CachedOverviewInsight;
      error?: unknown;
      retryAfter?: unknown;
    };

    if (!res.ok) {
      throw errorFromBody(json);
    }

    const data = json.data;

    if (
      !data ||
      !data.insights ||
      typeof data.insights !== "object" ||
      Array.isArray(data.insights)
    ) {
      throw new AiInsightsError(
        "AI_MALFORMED_RESPONSE",
        toMessage("AI_MALFORMED_RESPONSE"),
      );
    }

    const isValidSnapshot = (
      snapshot: OverviewActivitySnapshot | null,
    ): boolean =>
      snapshot === null ||
      (typeof snapshot.salesCount === "number" &&
        Number.isFinite(snapshot.salesCount) &&
        typeof snapshot.totalSales === "number" &&
        Number.isFinite(snapshot.totalSales) &&
        (snapshot.latestSaleAt === null ||
          typeof snapshot.latestSaleAt === "string"));

    if (
      !isValidSnapshot(data.activitySnapshot) ||
      !isValidSnapshot(data.currentActivitySnapshot)
    ) {
      throw new AiInsightsError(
        "AI_MALFORMED_RESPONSE",
        toMessage("AI_MALFORMED_RESPONSE"),
      );
    }

    return data;
  };

/**
 * Generate the Overview insight.
 *
 * The server collects the dashboard briefing and activity snapshot.
 * This request is only made on a cache miss or explicit regeneration.
 */
export const fetchAiInsights = async (): Promise<AiInsightsEnvelope> => {
  let res: Response;

  try {
    res = await fetch("/api/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: true }),
      cache: "no-store",
    });
  } catch {
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
      "AI_MALFORMED_RESPONSE",
      toMessage("AI_MALFORMED_RESPONSE"),
    );
  }

  return {
    ...envelope,
    insights: envelope.insights as AiInsightsResponse,
  };
};

type MenuSuggestionPeriodKind = "month" | "quarter" | "year";

/**
 * Shared request for changing a stored menu suggestion's status.
 */
interface MenuSuggestionStatusRequest {
  kind: MenuSuggestionPeriodKind;
  id: string;
  promptVersion: string;
  suggestionId: string;
}

type MenuSuggestionAssociation =
  | {
      productId: string;
      addonId?: never;
    }
  | {
      addonId: string;
      productId?: never;
    };

/**
 * Shared request for changing a stored menu suggestion's status.
 */
async function patchMenuSuggestion(
  input: MenuSuggestionStatusRequest,
  action: "status" | "dismiss",
  association?: MenuSuggestionAssociation,
): Promise<unknown> {
  const { kind, id, promptVersion, suggestionId } = input;

  const url =
    `/api/period-insights/${encodeURIComponent(kind)}` +
    `/${encodeURIComponent(id)}` +
    `/menu-suggestions/${encodeURIComponent(promptVersion)}` +
    `/items/${encodeURIComponent(suggestionId)}/${action}`;

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      ...(association
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(association),
          }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw errorFromBody(json);
  }

  return json?.data;
}

/**
 * Mark a menu suggestion as added after its POS product or add-on is created.
 */
export async function markMenuSuggestionAdded(
  input: MenuSuggestionStatusRequest & MenuSuggestionAssociation,
): Promise<unknown> {
  const { productId, addonId } = input;

  return patchMenuSuggestion(
    input,
    "status",
    productId ? { productId } : { addonId: addonId! },
  );
}

/**
 * Persist a dismissed menu suggestion.
 */
export async function dismissMenuSuggestion(
  input: MenuSuggestionStatusRequest,
): Promise<unknown> {
  return patchMenuSuggestion(input, "dismiss");
}

// interface MenuSuggestionStatusRequest {
//   kind: MenuSuggestionPeriodKind;
//   id: string;
//   promptVersion: string;
//   suggestionId: string;
// }

// /**
//  * Shared request for changing a stored menu suggestion's status.
//  */
// async function patchMenuSuggestion(
//   input: MenuSuggestionStatusRequest,
//   action: "status" | "dismiss",
//   productId?: string,
// ): Promise<unknown> {
//   const { kind, id, promptVersion, suggestionId } = input;

//   const url =
//     `/api/period-insights/${encodeURIComponent(kind)}` +
//     `/${encodeURIComponent(id)}` +
//     `/menu-suggestions/${encodeURIComponent(promptVersion)}` +
//     `/items/${encodeURIComponent(suggestionId)}/${action}`;

//   let res: Response;

//   try {
//     res = await fetch(url, {
//       method: "PATCH",
//       ...(productId
//         ? {
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ productId }),
//           }
//         : {}),
//       cache: "no-store",
//     });
//   } catch {
//     throw new AiInsightsError(
//       "NETWORK",
//       "Couldn't reach the server. Check your connection and try again.",
//     );
//   }

//   const json = await res.json().catch(() => ({}));

//   if (!res.ok) {
//     throw errorFromBody(json);
//   }

//   return json?.data;
// }

// /**
//  * Mark a menu suggestion as added after its POS product is created.
//  */
// export async function markMenuSuggestionAdded(
//   input: MenuSuggestionStatusRequest & {
//     productId: string;
//   },
// ): Promise<unknown> {
//   return patchMenuSuggestion(input, "status", input.productId);
// }

// /**
//  * Persist a dismissed menu suggestion.
//  */
// export async function dismissMenuSuggestion(
//   input: MenuSuggestionStatusRequest,
// ): Promise<unknown> {
//   return patchMenuSuggestion(input, "dismiss");
// }

type PricingPeriodKind = "month" | "quarter" | "year";

interface PricingActionInput {
  kind: PricingPeriodKind;
  id: string;
  promptVersion: string;
  suggestionId: string;
}

type SlowItemCompletionInput = {
  kind: "month" | "quarter" | "year";
  id: string;
  promptVersion: string;
  suggestionId: string;
  actionType: "discount-applied" | "freebie-created";
  productId: string;
  variantId?: string;
  discountId?: string;
  offerId?: string;
};

/**
 * Shared request for changing a stored pricing suggestion's status.
 */
async function patchPricingSuggestion(
  input: PricingActionInput,
  action: "dismiss" | "apply",
  payload?: {
    actionType: "price-updated" | "discount-removed";
    productId: string;
    variantId?: string;
    previousValue?: number;
    appliedValue?: number;
  },
): Promise<unknown> {
  const { kind, id, promptVersion, suggestionId } = input;

  const url =
    `/api/period-insights/${encodeURIComponent(kind)}` +
    `/${encodeURIComponent(id)}` +
    `/pricing/${encodeURIComponent(promptVersion)}` +
    `/items/${encodeURIComponent(suggestionId)}/${action}`;

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      ...(payload
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw errorFromBody(json);
  }

  return json?.data;
}

/**
 * Persist a dismissed pricing suggestion.
 */
export async function dismissPricingSuggestion(
  input: PricingActionInput,
): Promise<unknown> {
  return patchPricingSuggestion(input, "dismiss");
}

/**
 * Persist an applied pricing action.
 */
export async function applyPricingSuggestion(
  input: PricingActionInput & {
    actionType: "price-updated" | "discount-removed";
    productId: string;
    variantId?: string;
    previousValue?: number;
    appliedValue?: number;
  },
): Promise<unknown> {
  const { kind, id, promptVersion, suggestionId, ...payload } = input;

  return patchPricingSuggestion(
    { kind, id, promptVersion, suggestionId },
    "apply",
    payload,
  );
}

/**
 * Persist a successfully completed Slow-Moving Items action.
 */
export async function completeSlowItemAction(
  input: SlowItemCompletionInput,
): Promise<unknown> {
  const { kind, id, promptVersion, suggestionId, ...payload } = input;

  const url =
    `/api/period-insights/${encodeURIComponent(kind)}` +
    `/${encodeURIComponent(id)}` +
    `/slow-items/${encodeURIComponent(promptVersion)}` +
    `/items/${encodeURIComponent(suggestionId)}/complete`;

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw errorFromBody(json);
  }

  return json?.data;
}

type FestivalPrepActionInput = {
  date: string;
  promptVersion: string;
  recommendationId: string;
};

type FestivalPrepCompletionInput = FestivalPrepActionInput & {
  offerId: string;
};

export type FestivalPrepAction = {
  date: string;
  promptVersion: string;
  recommendationId: string;
  actionType: "offer-created";
  offerId: string;
  completedAt: string;
};

export type FestivalPrepActionResponse = {
  success: boolean;
  completed: boolean;
  action: FestivalPrepAction | null;
};

/**
 * Build the URL shared by Festival Prep completion requests.
 */
function festivalPrepActionUrl(input: FestivalPrepActionInput): string {
  const { date, promptVersion, recommendationId } = input;

  return (
    `/api/ai-insights/festival-prep-actions/${encodeURIComponent(date)}` +
    `/${encodeURIComponent(promptVersion)}` +
    `/${encodeURIComponent(recommendationId)}`
  );
}

/**
 * Retrieve the saved completion status of a Festival Prep recommendation.
 */
export async function getFestivalPrepAction(
  input: FestivalPrepActionInput,
): Promise<FestivalPrepActionResponse> {
  const url = festivalPrepActionUrl(input);

  let res: Response;

  try {
    res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    completed?: boolean;
    action?: FestivalPrepAction | null;
    error?: unknown;
    retryAfter?: unknown;
  };

  if (!res.ok) {
    throw errorFromBody(json);
  }

  if (
    typeof json.completed !== "boolean" ||
    (json.completed &&
      (!json.action ||
        typeof json.action.offerId !== "string" ||
        !json.action.offerId))
  ) {
    throw new AiInsightsError(
      "AI_MALFORMED_RESPONSE",
      "The saved Festival Prep action couldn't be read. Try again.",
    );
  }

  return {
    success: json.success === true,
    completed: json.completed,
    action: json.action ?? null,
  };
}

/**
 * Persist a successfully created offer against a Festival Prep recommendation.
 *
 * This endpoint only records the completion. It does not create the offer.
 */
export async function completeFestivalPrepAction(
  input: FestivalPrepCompletionInput,
): Promise<FestivalPrepActionResponse> {
  const { offerId } = input;
  const url = `${festivalPrepActionUrl(input)}/complete`;

  let res: Response;

  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    alreadyCompleted?: boolean;
    action?: FestivalPrepAction;
    error?: unknown;
    retryAfter?: unknown;
  };

  if (!res.ok) {
    throw errorFromBody(json);
  }

  if (!json.action || typeof json.action.offerId !== "string") {
    throw new AiInsightsError(
      "AI_MALFORMED_RESPONSE",
      "The Festival Prep completion couldn't be confirmed. Try again.",
    );
  }

  return {
    success: json.success === true,
    completed: true,
    action: json.action,
  };
}
