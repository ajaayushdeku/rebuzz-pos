import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  currencySymbol,
  fetchMenu,
  fetchSalesRowsByWindow,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  PRICING_PROMPT,
  PRICING_SCHEMA,
  PRICING_VERSION,
  buildPricingFacts,
  parsePricing,
  pricingBriefing,
  pricingWeeks,
  type PricingResult,
} from "@/lib/ai-insights/sections/pricing";
import {
  salesWindows,
  type MenuProduct,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

/**
 * Pricing Opportunities for the AI Insights page.
 *
 * Thirteen weekly sales reports, read in parallel, give each item's prices
 * week by week: what happened after a price change, how much of an item sells
 * discounted, and what sells below cost. The model explains each finding and
 * proposes a price or discount, which is checked against cost. No AI call
 * without sales, or when nothing stands out. Otherwise one call a day,
 * cached by the AI service.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today } = request;

  const windows = salesWindows(today);
  const weeks = pricingWeeks(today);

  let weekly: SalesByItemRow[][];
  let menu: MenuProduct[];
  try {
    [weekly, menu] = await Promise.all([
      fetchSalesRowsByWindow(token, weeks),
      fetchMenu(token),
    ]);
  } catch (error) {
    return salesDataUnavailable("pricing", error);
  }

  const facts = buildPricingFacts(weekly, menu, weeks);

  if (facts.itemsSold === 0) {
    const result: PricingResult = { items: [], windows, reason: "NO_SALES" };
    return NextResponse.json({ data: result });
  }
  if (facts.candidates.length === 0) {
    const result: PricingResult = {
      items: [],
      windows,
      reason: "NOTHING_FLAGGED",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    briefing: pricingBriefing(facts, await currencySymbol()),
    systemInstruction: PRICING_PROMPT,
    responseSchema: PRICING_SCHEMA,
    cacheKey: `pricing:${PRICING_VERSION}:${today}`,
    refresh,
  });
  if (!answer.ok) return answer.response;

  const { insights, model, generatedAt, cached } = answer.data;

  const result: PricingResult = {
    // Joined onto today's facts; refs come from item names, so a cached
    // answer still lands on the right item.
    items: parsePricing(insights, facts, `pricing-${generatedAt}`),
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
