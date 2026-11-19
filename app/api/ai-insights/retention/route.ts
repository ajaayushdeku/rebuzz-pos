import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  currencySymbol,
  fetchCustomerHistory,
  fetchCustomers,
  fetchReportBills,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  RETENTION_PROMPT,
  RETENTION_SCHEMA,
  RETENTION_VERSION,
  buildRetentionFacts,
  parseRetention,
  retentionBriefing,
  retentionWindow,
  usualOrderFrom,
  type CustomerBill,
  type CustomerRecord,
  type RetentionResult,
} from "@/lib/ai-insights/sections/retention";
import { salesWindows } from "@/lib/ai-insights/sections/shared";
import { customerRetentionFeedbackApiUrl } from "@/lib/ai-insights/posAiApi.server";

/**
 * Customer Retention Radar for the AI Insights page.
 *
 * Four months of bills show each regular's habit; the ones overdue against
 * their own habit are flagged, and their purchase history gives what they
 * usually order. The model writes a tip and a message for each. It is sent a
 * code for each customer, never a name or a phone number. No AI call when
 * nobody is overdue. Otherwise one call a day, cached by the AI service.
 */
type RetentionStyleFeedback = {
  styleId: string;
  approved: number;
  disapproved: number;
};

type RetentionFeedbackPreferences = {
  preferredStyles: RetentionStyleFeedback[];
  avoidStyles: RetentionStyleFeedback[];
  totalFeedback: {
    approved: number;
    disapproved: number;
    total: number;
  };
};

function readStyleFeedback(value: unknown): RetentionStyleFeedback[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const entry = item as Record<string, unknown>;

    if (
      typeof entry.styleId !== "string" ||
      !/^[a-z0-9_-]{1,60}$/i.test(entry.styleId)
    ) {
      return [];
    }

    return [
      {
        styleId: entry.styleId,
        approved:
          typeof entry.approved === "number" && Number.isFinite(entry.approved)
            ? Math.max(0, Math.floor(entry.approved))
            : 0,
        disapproved:
          typeof entry.disapproved === "number" &&
          Number.isFinite(entry.disapproved)
            ? Math.max(0, Math.floor(entry.disapproved))
            : 0,
      },
    ];
  });
}

async function fetchRetentionFeedbackPreferences(
  token: string,
): Promise<RetentionFeedbackPreferences | null> {
  const url = customerRetentionFeedbackApiUrl("/preferences");

  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Preferences request failed: ${response.status}`);
    }

    const json: unknown = await response.json();

    if (!json || typeof json !== "object") return null;

    const data = json as Record<string, unknown>;
    if (
      !Array.isArray(data.preferredStyles) ||
      !Array.isArray(data.avoidStyles) ||
      !data.totalFeedback ||
      typeof data.totalFeedback !== "object"
    ) {
      throw new Error("Invalid feedback preferences response");
    }

    const totals =
      data.totalFeedback && typeof data.totalFeedback === "object"
        ? (data.totalFeedback as Record<string, unknown>)
        : {};

    const readCount = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.floor(value))
        : 0;

    return {
      preferredStyles: readStyleFeedback(data.preferredStyles),
      avoidStyles: readStyleFeedback(data.avoidStyles),
      totalFeedback: {
        approved: readCount(totals.approved),
        disapproved: readCount(totals.disapproved),
        total: readCount(totals.total),
      },
    };
  } catch (error) {
    console.warn(
      "[Customer Retention] Could not load feedback preferences:",
      error instanceof Error ? error.message : error,
    );

    // Feedback is optional. Do not prevent retention insights from generating.
    return null;
  }
}

export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  let customers: CustomerRecord[];
  let bills: CustomerBill[];
  try {
    [customers, bills] = await Promise.all([
      fetchCustomers(token),
      fetchReportBills<CustomerBill>(token, retentionWindow(today)),
    ]);
  } catch (error) {
    return salesDataUnavailable("retention", error);
  }

  if (!bills.some((b) => b.customerId)) {
    const result: RetentionResult = { items: [], windows, reason: "NO_SALES" };
    return NextResponse.json({ data: result });
  }

  const candidates = buildRetentionFacts(today, customers, bills);
  if (candidates.length === 0) {
    const result: RetentionResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  // What each flagged customer usually orders: one small request each, only
  // for the handful on the page.
  // const histories = await Promise.all(
  //   candidates.map((c) => fetchCustomerHistory(token, c.customerId)),
  // );
  const [histories, feedbackPreferences] = await Promise.all([
    Promise.all(
      candidates.map((c) => fetchCustomerHistory(token, c.customerId)),
    ),
    fetchRetentionFeedbackPreferences(token),
  ]);
  candidates.forEach((c, i) => {
    c.usualOrder = usualOrderFrom(histories[i]);
  });

  const answer = await askAiService({
    token,
    briefing: retentionBriefing(
      candidates,
      today,
      await currencySymbol(),
      feedbackPreferences,
    ),
    systemInstruction: RETENTION_PROMPT,
    responseSchema: RETENTION_SCHEMA,
    cacheKey: `retention:${RETENTION_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: RetentionResult = {
    items: parseRetention(insights, candidates),
    windows,
    model,
    generatedAt,
    cached: cached === true,
    // Passed through so the card can say the model in use did not answer.
    stale: answer.data.stale === true,
    staleReason: answer.data.staleReason,
  };

  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
