import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { askAiService } from "@/lib/ai-insights/askAiService.server";
import { mergeHolidayEvents } from "@/lib/holidayCalendar";
import { fetchHolidayFeed } from "@/lib/holidayFeed.server";
import { nepalToday } from "@/lib/nepalDate";
import {
  currencySymbol,
  fetchDailySales,
  salesDataUnavailable,
} from "@/lib/ai-insights/sections/posData.server";
import { shiftIsoDate } from "@/lib/ai-insights/sections/shared";
import {
  FORECAST_HISTORY_DAYS,
  buildSalesForecast,
  forecastBlocker,
  readSalesHistory,
  type ForecastOk,
  type SalesForecast,
} from "@/lib/salesForecast";
import {
  SALES_FORECAST_PROMPT,
  SALES_FORECAST_SCHEMA,
  SALES_FORECAST_VERSION,
  resolveForecast,
  salesForecastBriefing,
} from "@/lib/salesForecastAi";

/**
 * The "What's coming" forecast for the Sales & Revenue page.
 *
 * The business's AI makes the forecast from its own daily sales (see
 * lib/salesForecastAi), once a day, cached by the AI service like the
 * insights. What the card shows, in order of preference:
 *
 *   1. a new AI forecast;
 *   2. the AI's last saved forecast, when a new one fails — the service
 *      serves it for any AI failure, and `resolveForecast` keeps it as long
 *      as its days have not all passed;
 *   3. the calculated forecast (lib/salesForecast), only when there is no
 *      usable AI forecast of either kind — marked as calculated, with why.
 *
 * The card is hidden without a key, so there is no AI call for a business
 * that has none.
 *
 * `?refresh=1` asks the AI for a new forecast, skipping today's saved one.
 */
export async function GET(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const today = nepalToday();

  let daily;
  let feed;
  try {
    [daily, feed] = await Promise.all([
      // Up to yesterday: today is still being sold, and a half day would read
      // as a bad one.
      fetchDailySales(token, {
        startDate: shiftIsoDate(today, -FORECAST_HISTORY_DAYS),
        endDate: shiftIsoDate(today, -1),
      }),
      // Never fails: without Google it is the official notice alone.
      fetchHolidayFeed(),
    ]);
  } catch (error) {
    return salesDataUnavailable("sales-forecast", error);
  }

  const events = mergeHolidayEvents(feed);
  const history = readSalesHistory(today, daily, events);

  // Too little history, or nothing sold lately: there is nothing for anyone
  // to forecast from, so no AI call is spent saying so.
  const blocked = forecastBlocker(history);
  if (blocked) return NextResponse.json({ data: blocked });

  const calculated = buildSalesForecast(today, daily, events) as ForecastOk;
  const fallback = (aiError: string): SalesForecast => ({
    ...calculated,
    aiError,
  });

  const answer = await askAiService({
    token,
    briefing: salesForecastBriefing(
      today,
      history,
      events,
      await currencySymbol(),
    ),
    systemInstruction: SALES_FORECAST_PROMPT,
    responseSchema: SALES_FORECAST_SCHEMA,
    // One forecast a day. The version retires old ones when the prompt
    // changes.
    cacheKey: `sales-forecast:${SALES_FORECAST_VERSION}:${today}`,
    refresh,
  });

  if (!answer.ok) {
    const body = await answer.response.json().catch(() => ({}));
    return NextResponse.json({
      data: fallback(typeof body?.error === "string" ? body.error : "UNKNOWN"),
    });
  }

  const result = resolveForecast(calculated, answer.data, history, today);
  if (result.source === "calculated") {
    console.warn(
      `[sales-forecast] no usable AI forecast (${result.aiError}); calculated one shown`,
    );
  }
  return NextResponse.json({ data: result });
}
