import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  alreadyShownBriefing,
  currencySymbol,
  fetchSalesRows,
  moreCacheKey,
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
 * - no sales in the window â†’ no AI call at all;
 * - already answered today â†’ served from the AI service's cache, no call;
 * - otherwise one call, which is then cached for the rest of the day.
 * `{ refresh: true }` skips the cache on purpose, for the Refresh button.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today, more } = request;

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
    // For "Generate more", the recommendations already on screen, not to be
    // repeated.
    briefing:
      salesBriefing(facts, await currencySymbol()) + alreadyShownBriefing(more),
    systemInstruction: SALES_RECOMMENDATIONS_PROMPT,
    responseSchema: SALES_RECOMMENDATIONS_SCHEMA,
    // One answer per day. The version retires old answers when the prompt
    // changes. Each extra batch is saved under its own key.
    cacheKey: more
      ? moreCacheKey(
          "sales-recommendations",
          SALES_RECOMMENDATIONS_VERSION,
          today,
          more,
        )
      : `sales-recommendations:${SALES_RECOMMENDATIONS_VERSION}:${today}`,
    // A batch is saved once and reused; only the main answer is refreshed.
    refresh: more ? false : refresh,
  });

  if (!answer.ok) return answer.response;

  // An extra batch never falls back to an older saved answer: that would only
  // repeat cards already on screen. The failure is reported instead.
  if (more && answer.data.stale) {
    return NextResponse.json(
      { error: answer.data.staleReason ?? "AI_UNAVAILABLE" },
      { status: 502 },
    );
  }

  const { insights, model, generatedAt, cached } = answer.data;

  const result: SalesRecommendationsResult = {
    batch: more?.batch,
    items: parseSalesRecommendations(
      insights,
      more ? `sales-more${more.batch}-${generatedAt}` : `sales-${generatedAt}`,
      more?.exclude,
    ),
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
