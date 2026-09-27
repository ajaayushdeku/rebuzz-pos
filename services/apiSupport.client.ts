"use client";

/**
 * The two ways a merchant writes to us: a question they need answered, and
 * feedback they do not.
 *
 * Both post to this app's own routes rather than upstream, so the session
 * token stays in the cookie. Both throw on failure with the server's own
 * message where there is one, so a form can say what actually went wrong
 * instead of "something went wrong".
 */

export interface SupportQuestionPayload {
  /** Who is asking. */
  name: string;
  /** Where the answer goes. */
  email: string;
  /** A phone or WhatsApp number, when they would rather be called. */
  contact?: string;
  subject?: string;
  /** The question itself. */
  message: string;
  /** How they rate the app, if the form asked. 1–5. */
  rating?: number;
}

export interface FeedbackPayload {
  /** 1–5. The one field that is required. */
  rating: number;
  likeMost?: string;
  improvement?: string;
  featureRequest?: string;
}

/** The server's message for a failure, or a sentence of our own. */
async function failureMessage(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  const message = (data as { message?: string } | null)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function post(path: string, payload: unknown, fallback: string) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // Read once: a body cannot be consumed twice, so the failure path reads it
  // from its own clone.
  if (!res.ok) throw new Error(await failureMessage(res.clone(), fallback));

  const data = await res.json().catch(() => ({}));
  if ((data as { status?: string })?.status === "error") {
    throw new Error((data as { message?: string })?.message || fallback);
  }
  return data;
}

/** Send a question to support. */
export async function submitSupportQuestion(payload: SupportQuestionPayload) {
  return post(
    "/api/support-question",
    payload,
    "Your question couldn't be sent. Please try again.",
  );
}

/** Send feedback about the app. */
export async function submitFeedback(payload: FeedbackPayload) {
  return post(
    "/api/feedback",
    payload,
    "Your feedback couldn't be sent. Please try again.",
  );
}
