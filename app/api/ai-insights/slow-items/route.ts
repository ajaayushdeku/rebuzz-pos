import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  currencySymbol,
  fetchMenu,
  fetchSalesRows,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  salesWindows,
  type MenuProduct,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";
import {
  SLOW_ITEMS_PROMPT,
  SLOW_ITEMS_SCHEMA,
  SLOW_ITEMS_VERSION,
  buildSlowItemsFacts,
  parseSlowItems,
  slowItemsBriefing,
  type SlowItemsResult,
} from "@/lib/ai-insights/sections/slowItems";

/**
 * Slow Item Insights for the AI Insights page.
 *
 * The app finds the slow items from the last 30 days against the 30 before
 * and the menu; the model only writes the fix. No AI call is made when there
 * were no sales at all, or when nothing on the menu is slow. Otherwise one
 * call a day, cached by the AI service, as for Sales Recommendations.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  let menu: MenuProduct[];
  let current: SalesByItemRow[];
  let previous: SalesByItemRow[];
  try {
    [menu, current, previous] = await Promise.all([
      fetchMenu(token),
      fetchSalesRows(token, windows.current),
      fetchSalesRows(token, windows.previous),
    ]);
  } catch (error) {
    return salesDataUnavailable("slow-items", error);
  }

  const facts = buildSlowItemsFacts(menu, current, previous, windows);

  // No sales in either window: every item would read as slow, which says
  // nothing about the menu.
  const soldBefore = previous.some((row) => (row.count ?? 0) > 0);
  if (facts.totalUnits === 0 && !soldBefore) {
    const result: SlowItemsResult = { items: [], windows, reason: "NO_SALES" };
    return NextResponse.json({ data: result });
  }
  if (facts.candidates.length === 0) {
    const result: SlowItemsResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: slowItemsBriefing(facts, await currencySymbol()),
    systemInstruction: SLOW_ITEMS_PROMPT,
    responseSchema: SLOW_ITEMS_SCHEMA,
    cacheKey: `slow-items:${SLOW_ITEMS_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: SlowItemsResult = {
    // Joined onto today's facts, not the ones a cached answer was written
    // from. Refs come from product ids, so each still names the same item;
    // one that is no longer slow has no ref today and its card is dropped.
    items: parseSlowItems(insights, facts.candidates, `slow-${generatedAt}`),
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
