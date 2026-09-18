import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  currencySymbol,
  fetchEmployees,
  fetchReportBills,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import { salesWindows } from "@/lib/ai-insights/sections/shared";
import {
  STAFFING_PROMPT,
  STAFFING_SCHEMA,
  STAFFING_VERSION,
  buildStaffingFacts,
  parseStaffing,
  staffingBriefing,
  staffingWindow,
  type EmployeeRecord,
  type StaffBill,
  type StaffingResult,
} from "@/lib/ai-insights/sections/staffing";

/**
 * Staffing Recommendations for the AI Insights page.
 *
 * Built from who rang up each bill over the last four weeks — the one
 * staffing fact the POS records reliably. The model writes the advice; it is
 * sent codes for people, never names. No AI call without enough orders to
 * read a pattern. Otherwise one call a day, cached by the AI service.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  let bills: StaffBill[];
  let employees: EmployeeRecord[];
  try {
    [bills, employees] = await Promise.all([
      fetchReportBills<StaffBill>(token, staffingWindow(today)),
      // The staff list only adds context; a failure leaves it empty.
      fetchEmployees(token).catch(() => []),
    ]);
  } catch (error) {
    return salesDataUnavailable("staffing", error);
  }

  const facts = buildStaffingFacts(today, bills, employees);

  if (!facts.enoughData) {
    const result: StaffingResult = { items: [], windows, reason: "NO_SALES" };
    return NextResponse.json({ data: result });
  }
  if (facts.candidates.length === 0) {
    const result: StaffingResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: staffingBriefing(facts, await currencySymbol()),
    systemInstruction: STAFFING_PROMPT,
    responseSchema: STAFFING_SCHEMA,
    cacheKey: `staffing:${STAFFING_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: StaffingResult = {
    items: parseStaffing(insights, facts),
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
