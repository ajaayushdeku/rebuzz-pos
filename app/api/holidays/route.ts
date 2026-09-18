import { NextResponse } from "next/server";

import { fetchHolidayFeed } from "@/lib/holidayFeed.server";

/**
 * Nepal's holidays from Google's public calendar, for the browser.
 *
 * Only Google's events are sent; the browser already has the official notice
 * built in and merges the two (`mergeHolidayEvents`). Public data, the same
 * for every business, so it may be cached by the browser for an hour.
 */
export async function GET() {
  const events = await fetchHolidayFeed();
  return NextResponse.json(
    { data: { events } },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
