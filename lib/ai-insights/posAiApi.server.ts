/**
 * Where the AI key and AI insight routes live, and how their failures read.
 *
 * They are part of the POS API (khajaGharBackend), under the same business base
 * URL as every other POS call:
 *
 *   `${NEXT_PUBLIC_API_URL}/business/settings/ai`
 *   `${NEXT_PUBLIC_API_URL}/business/settings/ai/models`
 *   `${NEXT_PUBLIC_API_URL}/business/ai-insights`
 *   `${NEXT_PUBLIC_API_URL}/business/ai-insights/quota`
 *
 * `/business` is not a fixed prefix: it is the business slug in
 * `/api/:business_slug`, and it is how every other POS call in this app is
 * addressed (see `lib/auth/verifyAdmin.ts`). Leaving it out reaches the POS's
 * catch-all, which answers 200 with a "Cannot GET" body rather than an error —
 * so a missing segment reads as success to anything checking `res.ok`.
 */

/** The POS API, which already ends in `/api`. */
export const POS_API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * The absolute URL for one of the AI routes, or null when the POS base URL is
 * unset — which the caller answers with a 503, because a missing base is a
 * deployment mistake rather than a bad request.
 *
 * `path` is the route as the POS spells it: "/settings/ai",
 * "/settings/ai/models", "/ai-insights", "/ai-insights/quota".
 */
export function aiApiUrl(path: string): string | null {
  return POS_API_URL ? `${POS_API_URL}/business${path}` : null;
}

/** The fields the browser reads from a failed AI request. */
export interface AiErrorBody {
  error: string;
  available?: string[];
  detail?: string;
  retryAfter?: number;
  raw?: string;
}

/**
 * Turn the POS API's jsend failure into the body the browser has always read.
 *
 * The POS answers `{ status: "fail" | "error", data: { code, message, ... } }`.
 * The UI picks its sentence by the code (AI_KEY_INVALID, NOT_CONFIGURED, …), so
 * the code becomes `error` and the extras travel beside it unchanged. A failure
 * from outside the AI routes — the POS's own "Login Required" — has a message
 * and no code, and the message is passed on instead.
 */
export function readAiError(json: unknown): AiErrorBody {
  const body = (json ?? {}) as {
    message?: unknown;
    data?: {
      code?: unknown;
      message?: unknown;
      available?: string[];
      detail?: string;
      retryAfter?: number;
      raw?: string;
    };
  };
  const data = body.data ?? {};
  const error =
    (typeof data.code === "string" && data.code) ||
    (typeof data.message === "string" && data.message) ||
    (typeof body.message === "string" && body.message) ||
    "Request failed";

  return {
    error,
    available: data.available ?? undefined,
    detail: data.detail ?? undefined,
    retryAfter: data.retryAfter ?? undefined,
    raw: data.raw ?? undefined,
  };
}
