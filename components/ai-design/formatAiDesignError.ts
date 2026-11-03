type AiDesignErrorPayload = {
  error?: unknown;
  detail?: unknown;
  message?: unknown;
  requestId?: unknown;
};

const OPENAI_ERROR_MESSAGES: Record<string, string> = {
  OPENAI_INVALID_API_KEY:
    "OpenAI rejected the API key. Check the key in AI Settings and replace it if needed.",
  OPENAI_PERMISSION_DENIED:
    "The OpenAI key or its project does not have permission for this request.",
  OPENAI_QUOTA_EXCEEDED:
    "OpenAI reports an API credit, quota, or spending limit. Check billing and limits for the key’s organization and project.",
  OPENAI_RATE_LIMITED:
    "OpenAI rate-limited this request. Wait briefly before trying again.",
  OPENAI_REQUEST_LIMIT_REACHED:
    "OpenAI returned an unclassified 429 limit. Check the API account’s billing, usage, and model limits.",
  OPENAI_RATE_OR_QUOTA_LIMIT:
    "OpenAI reports a rate or quota limit. Check API billing, credits, and usage limits.",
};

export function formatAiDesignError(
  payload: AiDesignErrorPayload,
  fallback = "Unable to complete the AI design request.",
) {
  const code = typeof payload.error === "string" ? payload.error : "";
  const message =
    OPENAI_ERROR_MESSAGES[code] ??
    (typeof payload.detail === "string" && payload.detail
      ? payload.detail
      : undefined) ??
    (typeof payload.message === "string" && payload.message
      ? payload.message
      : undefined) ??
    (code || fallback);
  const requestId =
    typeof payload.requestId === "string" && payload.requestId.trim()
      ? payload.requestId.trim().slice(0, 200)
      : "";

  return requestId ? `${message} (OpenAI request ID: ${requestId})` : message;
}
