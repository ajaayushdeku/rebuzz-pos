import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  currencySymbol,
  fetchSalesRows,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  SALES_RECOMMENDATIONS_PROMPT,
  SALES_RECOMMENDATIONS_SCHEMA,
  SALES_RECOMMENDATIONS_VERSION,
  buildSalesFacts,
  parseSalesRecommendations,
  salesBriefing,
  type SalesRecommendationsResult,
} from "@/lib/ai-insights/sections/salesRecommendations";
import {
  salesWindows,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

/**
 * Sales Recommendations for the AI Insights page.
 *
 * Everything the model sees is gathered and calculated here, on the server:
 * the browser only says whether it wants a fresh answer. That keeps the
 * figures honest (they come straight from the report) and keeps the prompt
 * out of the caller's hands.
 *
 * Cost, in order of what is avoided:
 * - no sales in the window → no AI call at all;
 * - already answered today → served from the AI service's cache, no call;
 * - otherwise one call, which is then cached for the rest of the day.
 * `{ refresh: true }` skips the cache on purpose, for the Refresh button.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);

  let current: SalesByItemRow[];
  let previous: SalesByItemRow[];
  try {
    [current, previous] = await Promise.all([
      fetchSalesRows(token, windows.current),
      fetchSalesRows(token, windows.previous),
    ]);
  } catch (error) {
    return salesDataUnavailable("sales-recommendations", error);
  }

  const facts = buildSalesFacts(current, previous, windows);

  if (facts.totals.units === 0) {
    const result: SalesRecommendationsResult = {
      items: [],
      windows,
      reason: "NO_SALES",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: salesBriefing(facts, await currencySymbol()),
    systemInstruction: SALES_RECOMMENDATIONS_PROMPT,
    responseSchema: SALES_RECOMMENDATIONS_SCHEMA,
    // One answer per day. The version retires old answers when the prompt
    // changes.
    cacheKey: `sales-recommendations:${SALES_RECOMMENDATIONS_VERSION}:${today}`,
    refresh,
  });

  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: SalesRecommendationsResult = {
    items: parseSalesRecommendations(insights, `sales-${generatedAt}`),
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
