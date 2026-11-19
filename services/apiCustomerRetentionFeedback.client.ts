import {
  AiInsightsError,
  aiErrorMessage,
} from "@/services/apiAiInsights.client";
import type { PeriodKind } from "@/services/apiPeriodInsights.client";

export type RetentionFeedbackDecision = "approved" | "disapproved";

export interface CustomerRetentionFeedback {
  _id: string;
  messageId: string;
  retentionItemId: string;
  styleId: string;
  styleTitle: string;
  optionIndex: number;
  message: string;
  decision: RetentionFeedbackDecision;
  rejectionReason: string | null;
  style: {
    tone?: string;
    length?: string;
    personalization?: string;
    approach?: string;
  } | null;
  periodKind: PeriodKind;
  periodId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRetentionFeedbackInput {
  kind: PeriodKind;
  periodId: string;
  messageId: string;
  retentionItemId: string;
  styleId: string;
  styleTitle: string;
  optionIndex: number;
  message: string;
  decision: RetentionFeedbackDecision;
  rejectionReason?: string | null;
  style?: CustomerRetentionFeedback["style"];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
    });
  } catch {
    throw new AiInsightsError(
      "NETWORK",
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = typeof json?.error === "string" ? json.error : "UNKNOWN";

    throw new AiInsightsError(code, aiErrorMessage(code));
  }

  return json as T;
}

function periodUrl(kind: PeriodKind, periodId: string) {
  return (
    `/api/customer-retention-feedback/` +
    `${encodeURIComponent(kind)}/${encodeURIComponent(periodId)}`
  );
}

/** Read saved message decisions for one completed period. */
export async function fetchCustomerRetentionFeedback(
  kind: PeriodKind,
  periodId: string,
): Promise<CustomerRetentionFeedback[]> {
  const json = await request<{
    success?: boolean;
    feedback?: CustomerRetentionFeedback[];
  }>(periodUrl(kind, periodId));

  if (!Array.isArray(json.feedback)) {
    throw new AiInsightsError(
      "AI_MALFORMED_RESPONSE",
      aiErrorMessage("AI_MALFORMED_RESPONSE"),
    );
  }

  return json.feedback;
}

/** Create or update one message decision. */
export async function saveCustomerRetentionFeedback(
  input: SaveRetentionFeedbackInput,
): Promise<CustomerRetentionFeedback> {
  const { kind, periodId, messageId, ...body } = input;

  const json = await request<{
    success?: boolean;
    feedback?: CustomerRetentionFeedback;
  }>(`${periodUrl(kind, periodId)}/${encodeURIComponent(messageId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[Retention Feedback] Save response:", {
    submittedMessageId: messageId,
    response: json,
    returnedMessageId: json.feedback?.messageId,
  });
  if (!json.feedback || json.feedback.messageId !== messageId) {
    throw new AiInsightsError(
      "AI_MALFORMED_RESPONSE",
      aiErrorMessage("AI_MALFORMED_RESPONSE"),
    );
  }
  return json.feedback;
}

/** Remove the saved decision for one message. */
export async function deleteCustomerRetentionFeedback(input: {
  kind: PeriodKind;
  periodId: string;
  messageId: string;
}): Promise<void> {
  const { kind, periodId, messageId } = input;

  await request(
    `${periodUrl(kind, periodId)}/${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );
}
