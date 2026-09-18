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

/**
 * Customer Retention Radar for the AI Insights page.
 *
 * Four months of bills show each regular's habit; the ones overdue against
 * their own habit are flagged, and their purchase history gives what they
 * usually order. The model writes a tip and a message for each. It is sent a
 * code for each customer, never a name or a phone number. No AI call when
 * nobody is overdue. Otherwise one call a day, cached by the AI service.
 */
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
  const histories = await Promise.all(
    candidates.map((c) => fetchCustomerHistory(token, c.customerId)),
  );
  candidates.forEach((c, i) => {
    c.usualOrder = usualOrderFrom(histories[i]);
  });

  const answer = await askAiService({
    token,
    briefing: retentionBriefing(candidates, today, await currencySymbol()),
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
  };

  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
