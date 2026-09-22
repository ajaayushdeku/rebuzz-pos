import { NextRequest, NextResponse } from "next/server";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import {
  MENU_SUGGESTIONS_PROMPT,
  MENU_SUGGESTIONS_SCHEMA,
  MENU_SUGGESTIONS_VERSION,
  buildMenuFacts,
  menuBriefing,
  parseMenuSuggestions,
  type MenuSuggestionsResult,
} from "@/lib/ai-insights/sections/menuSuggestions";
import {
  alreadyShownBriefing,
  currencySymbol,
  fetchMenu,
  fetchSalesRows,
  moreCacheKey,
  readSectionRequest,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import {
  salesWindows,
  type MenuProduct,
  type SalesByItemRow,
} from "@/lib/ai-insights/sections/shared";

/**
 * AI Menu Suggestions for the AI Insights page.
 *
 * Ideas are built on the last 30 days' best sellers and the real menu, and
 * checked against that menu before they are shown. No AI call is made when
 * nothing sold, since there are no best sellers to build on. Otherwise one
 * call a day, cached by the AI service.
 */
export async function POST(req: NextRequest) {
  const request = await readSectionRequest(req);
  if (!request.ok) return request.response;
  const { token, refresh, today, more } = request;

  const windows = salesWindows(today);

  let menu: MenuProduct[];
  let current: SalesByItemRow[];
  try {
    [menu, current] = await Promise.all([
      fetchMenu(token),
      fetchSalesRows(token, windows.current),
    ]);
  } catch (error) {
    return salesDataUnavailable("menu-suggestions", error);
  }

  const facts = buildMenuFacts(menu, current, windows);

  if (facts.bestSellers.length === 0) {
    const result: MenuSuggestionsResult = {
      items: [],
      windows,
      reason: "NO_SALES",
    };
    return NextResponse.json({ data: result });
  }

  const answer = await askAiService({
    token,
    // For "Generate more", the ideas already on screen, not to be repeated.
    briefing:
      menuBriefing(facts, await currencySymbol()) + alreadyShownBriefing(more),
    systemInstruction: MENU_SUGGESTIONS_PROMPT,
    responseSchema: MENU_SUGGESTIONS_SCHEMA,
    cacheKey: more
      ? moreCacheKey("menu-suggestions", MENU_SUGGESTIONS_VERSION, today, more)
      : `menu-suggestions:${MENU_SUGGESTIONS_VERSION}:${today}`,
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

  const result: MenuSuggestionsResult = {
    items: parseMenuSuggestions(
      insights,
      menu,
      more ? `menu-more${more.batch}-${generatedAt}` : `menu-${generatedAt}`,
      more?.exclude,
    ),
    windows,
    model,
    generatedAt,
    cached: cached === true,
    // Passed through so the card can say the model in use did not answer.
    stale: answer.data.stale === true,
    staleReason: answer.data.staleReason,
    batch: more?.batch,
  };

  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
