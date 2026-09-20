import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  HOUR_PLAYBOOK_PROMPT,
  HOUR_PLAYBOOK_SCHEMA,
  HOUR_PLAYBOOK_VERSION,
  buildHourFacts,
  hourBriefing,
  hourWindow,
  parseHourPlaybook,
  type HourPlaybookResult,
  type ReportBill,
} from "@/lib/ai-insights/sections/hourPlaybook";
import {
  currencySymbol,
  fetchMenu,
  fetchReportBills,
  fetchSalesRows,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  salesWindows,
  type MenuProduct,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

/**
 * Hour-by-Hour Playbook for the AI Insights page.
 *
 * The last four weeks of bills, bucketed by Nepal hour; the app picks the
 * busiest, the quietest and the lowest-spend hours, and the model writes a
 * play for each. No AI call is made without enough orders to show a pattern.
 * Otherwise one call a day, cached by the AI service.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  let bills: ReportBill[];
  let menu: MenuProduct[];
  let salesRows: SalesByItemRow[];
  try {
    [bills, menu, salesRows] = await Promise.all([
      fetchReportBills(token, hourWindow(today)),
      fetchMenu(token),
      fetchSalesRows(token, windows.current),
    ]);
  } catch (error) {
    return salesDataUnavailable("hour-playbook", error);
  }

  const facts = buildHourFacts(today, bills, menu, salesRows, windows);

  if (!facts.enoughData) {
    const result: HourPlaybookResult = {
      items: [],
      windows,
      reason: "NO_SALES",
    };
    return NextResponse.json({ data: result });
  }
  if (facts.slots.length === 0) {
    const result: HourPlaybookResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: hourBriefing(facts, await currencySymbol()),
    systemInstruction: HOUR_PLAYBOOK_PROMPT,
    responseSchema: HOUR_PLAYBOOK_SCHEMA,
    cacheKey: `hour-playbook:${HOUR_PLAYBOOK_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: HourPlaybookResult = {
    items: parseHourPlaybook(insights, facts),
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
