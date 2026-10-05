export const POS_API_URL = process.env.NEXT_PUBLIC_API_URL;

const AI_SERVICE_URL = process.env.AI_SERVICE_URL?.replace(/\/+$/, "");

/* Choose a backend service under the condition if AI_SERVICE_URL is set or not */
export function aiApiUrl(path: string): string | null {
  if (AI_SERVICE_URL) return `${AI_SERVICE_URL}${path}`;
  return POS_API_URL ? `${POS_API_URL}/business${path}` : null;
}

/* The absolute URL for a period-insights route, or null when no standalone service is configured. `path` is the route as the service spells it: "/periods", "/month/2026-09", "/month/2026-09/pricing" */
export function periodApiUrl(path: string): string | null {
  return AI_SERVICE_URL ? `${AI_SERVICE_URL}/period-insights${path}` : null;
}

/** Whether this deployment can serve period insights at all. */
export const periodInsightsAvailable = () => Boolean(AI_SERVICE_URL);

/** The fields the browser reads from a failed AI request. */
export interface AiErrorBody {
  error: string;
  available?: string[];
  detail?: string;
  retryAfter?: number;
  raw?: string;
}

/* Turn the POS API's jsend failure into the body the browser has always read. The POS answers `{ status: "fail" | "error", data: { code, message, ... } }` */
export function readAiError(json: unknown): AiErrorBody {
  const body = (json ?? {}) as {
    message?: unknown;
    // The standalone service answers flat — `{ error, detail, available }` —
    // where the POS nests the same fields under `data`. Both shapes are read
    // here, so the UI's error messages work against either service unchanged,
    // and switching between them needs no change anywhere else.
    error?: unknown;
    detail?: string;
    available?: string[];
    retryAfter?: number;
    raw?: string;
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
    // The standalone service's code, which is the same vocabulary the POS puts
    // in `data.code` (AI_KEY_INVALID, NOT_CONFIGURED, …).
    (typeof body.error === "string" && body.error) ||
    (typeof data.message === "string" && data.message) ||
    (typeof body.message === "string" && body.message) ||
    "Request failed";

  return {
    error,
    available: data.available ?? body.available ?? undefined,
    detail: data.detail ?? body.detail ?? undefined,
    retryAfter: data.retryAfter ?? body.retryAfter ?? undefined,
    raw: data.raw ?? body.raw ?? undefined,
  };
}
