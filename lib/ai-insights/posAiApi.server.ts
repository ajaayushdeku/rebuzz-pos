/**
 * Where the AI key and AI insight routes live, and how their failures read.
 *
 * Not used yet: the proxies still call backend/ (AI_SERVICE_URL) for testing.
 * Switching them over means turning on the lines marked [POS backend] in
 * app/api/settings/ai/route.ts, app/api/settings/ai/models/route.ts,
 * app/api/ai-insights/route.ts, lib/ai-insights/askAiService.server.ts and
 * lib/ai-insights/hasSavedAiKey.server.ts.
 *
 * They are part of the POS API (khajaGharBackend), under the same business
 * base URL as every other POS call: `${NEXT_PUBLIC_API_URL}/settings/ai`,
 * `/settings/ai/models` and `/ai-insights`.
 */

export const POS_API_URL = process.env.NEXT_PUBLIC_API_URL;

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
