export type AiDesignErrorPayload = {
  error?: unknown;
  detail?: unknown;
  message?: unknown;
  requestId?: unknown;
  providerCode?: unknown;
  status?: unknown;
};

export type AiDesignErrorInfo = {
  category:
    | "safety"
    | "authentication"
    | "permission"
    | "rate_limit"
    | "server"
    | "network"
    | "general";
  title: string;
  message: string;
  advice: string;
  requestId?: string;
};

const OPENAI_ERROR_MESSAGES: Record<string, string> = {
  OPENAI_INVALID_API_KEY: "OpenAI rejected the API key.",
  OPENAI_PERMISSION_DENIED:
    "The OpenAI key or its project does not have permission for this request.",
  OPENAI_QUOTA_EXCEEDED:
    "OpenAI reports an API credit, quota, or spending limit.",
  OPENAI_RATE_LIMITED: "OpenAI rate-limited this request.",
  OPENAI_REQUEST_LIMIT_REACHED: "OpenAI returned a request limit.",
  OPENAI_RATE_OR_QUOTA_LIMIT: "OpenAI reports a rate or quota limit.",
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getAiDesignErrorInfo(
  payload: AiDesignErrorPayload,
  fallback = "Unable to complete the AI design request.",
): AiDesignErrorInfo {
  const code = asText(payload.error).toUpperCase();
  const detail = asText(payload.detail);
  const message = asText(payload.message);
  const providerCode = String(payload.providerCode ?? "");
  const combined = `${code} ${providerCode} ${detail} ${message}`.toUpperCase();

  const requestId = asText(payload.requestId).slice(0, 200);

  // Cloudflare Workers AI safety filter.
  if (
    providerCode === "3030" ||
    /\b3030\b/.test(combined) ||
    combined.includes("OUTPUT HAS BEEN FLAGGED") ||
    combined.includes("PROMPT VIOLATION")
  ) {
    return {
      category: "safety",
      title: "The image generation was blocked",
      message:
        "The image provider's safety system flagged this prompt or reference-image combination. This can occasionally happen even when your request seems harmless.",
      advice:
        "You can try generating another variation with the same brief. If it happens again, simplify the prompt or remove/replace the reference image. Avoid instructions or reference images that could be interpreted as unsafe.",
      requestId: requestId || undefined,
    };
  }

  if (
    code.includes("INVALID_API_KEY") ||
    code.includes("UNAUTHORIZED") ||
    code.includes("AUTHENTICATION") ||
    /\b401\b/.test(combined)
  ) {
    return {
      category: "authentication",
      title: "AI provider authentication failed",
      message:
        OPENAI_ERROR_MESSAGES[code] ||
        "The AI provider rejected the configured credentials.",
      advice:
        "Open AI Settings and verify the provider credentials. Replace the token only if it is invalid or has been revoked.",
      requestId: requestId || undefined,
    };
  }

  if (
    code.includes("PERMISSION_DENIED") ||
    code.includes("FORBIDDEN") ||
    /\b403\b/.test(combined)
  ) {
    return {
      category: "permission",
      title: "The AI provider denied this request",
      message:
        OPENAI_ERROR_MESSAGES[code] ||
        "The configured account may not have permission to use this model or service.",
      advice:
        "Check the provider account, model access, and token permissions in AI Settings.",
      requestId: requestId || undefined,
    };
  }

  if (
    code.includes("RATE_LIMIT") ||
    code.includes("QUOTA") ||
    /\b429\b/.test(combined)
  ) {
    return {
      category: "rate_limit",
      title: "The AI provider limit was reached",
      message:
        OPENAI_ERROR_MESSAGES[code] ||
        "The provider temporarily limited this request or the account has reached a usage limit.",
      advice:
        "Wait a little and try again. If the problem continues, check the provider's usage limits, credits, and account restrictions.",
      requestId: requestId || undefined,
    };
  }

  if (
    code.includes("TIMEOUT") ||
    code.includes("ECONN") ||
    code.includes("NETWORK") ||
    code.includes("FETCH_FAILED")
  ) {
    return {
      category: "network",
      title: "Connection problem",
      message:
        "The application could not complete the request because of a connection or timeout issue.",
      advice:
        "Check your internet connection and try again. If it keeps happening, wait briefly before retrying.",
      requestId: requestId || undefined,
    };
  }

  const status = Number(payload.status);

  if (
    (Number.isFinite(status) && status >= 500) ||
    /\b5\d\d\b/.test(combined)
  ) {
    return {
      category: "server",
      title: "The AI service is temporarily unavailable",
      message: "The provider or generation service encountered a server error.",
      advice:
        "Wait briefly and try again. If the problem persists, check the service logs using the request ID.",
      requestId: requestId || undefined,
    };
  }

  return {
    category: "general",
    title: "We couldn't complete your design",
    message:
      detail || message || OPENAI_ERROR_MESSAGES[code] || code || fallback,
    advice:
      "Try again. If the same error continues, review your prompt and uploaded images, then check AI Settings. Include the request ID when investigating the issue.",
    requestId: requestId || undefined,
  };
}

export function formatAiDesignError(
  payload: AiDesignErrorPayload,
  fallback = "Unable to complete the AI design request.",
) {
  const info = getAiDesignErrorInfo(payload, fallback);

  return info.requestId
    ? `${info.message} (Request ID: ${info.requestId})`
    : info.message;
}
