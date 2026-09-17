import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  FESTIVAL_HISTORY_DAYS,
  FESTIVAL_PREP_PROMPT,
  FESTIVAL_PREP_SCHEMA,
  FESTIVAL_PREP_VERSION,
  buildFestivalFacts,
  festivalBriefing,
  parseFestivalPrep,
  upcomingEvents,
  type DailySalesRow,
  type FestivalPrepResult,
} from "@/lib/ai-insights/sections/festivalPrep";
import {
  currencySymbol,
  fetchDailySales,
  fetchMenu,
  fetchSalesRows,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  salesWindows,
  shiftIsoDate,
  type MenuProduct,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

/**
 * Upcoming Festival Prep for the AI Insights page.
 *
 * Dates come from the official holiday calendar; how the business trades on
 * holidays and what it sells come from its own sales. The model writes the
 * preparation notes. No AI call is made when nothing is coming up in the next
 * 60 days — including when that runs past the year the calendar covers — or
 * when there were no sales to base advice on. Otherwise one call a day,
 * cached by the AI service.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  // Checked before any POS request: with nothing on the calendar there is
  // nothing to prepare for, and no reason to read the reports at all.
  if (upcomingEvents(today).length === 0) {
    const result: FestivalPrepResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  let menu: MenuProduct[];
  let salesRows: SalesByItemRow[];
  let daily: DailySalesRow[];
  try {
    [menu, salesRows, daily] = await Promise.all([
      fetchMenu(token),
      fetchSalesRows(token, windows.current),
      fetchDailySales(token, {
        startDate: shiftIsoDate(today, -FESTIVAL_HISTORY_DAYS),
        endDate: shiftIsoDate(today, -1),
      }),
    ]);
  } catch (error) {
    return salesDataUnavailable("festival-prep", error);
  }

  const facts = buildFestivalFacts(today, menu, salesRows, daily, windows);

  if (facts.bestSellers.length === 0 && facts.weekdays.length === 0) {
    const result: FestivalPrepResult = {
      items: [],
      windows,
      reason: "NO_SALES",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: festivalBriefing(facts, await currencySymbol()),
    systemInstruction: FESTIVAL_PREP_PROMPT,
    responseSchema: FESTIVAL_PREP_SCHEMA,
    cacheKey: `festival-prep:${FESTIVAL_PREP_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: FestivalPrepResult = {
    items: parseFestivalPrep(insights, facts.upcoming, menu),
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
