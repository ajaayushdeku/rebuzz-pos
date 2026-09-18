/**
 * Google's Nepal holiday calendar, fetched on the server.
 *
 * On the server because the browser cannot read it (Google sends no CORS
 * headers for it), and because one copy a day serves every user: Next keeps
 * the response for a day, so Google is asked about once a day, not once per
 * visit.
 *
 * Never throws. Offline, blocked or changed, the app falls back to the notice
 * written into lib/holidayCalendar.ts, as it worked before this existed.
 */

import type { HolidayEvent } from "./holidayCalendar";
import { NEPAL_HOLIDAY_FEED_URL, parseHolidayFeed } from "./holidayFeed";

const ONE_DAY_SECONDS = 24 * 60 * 60;
const TIMEOUT_MS = 8_000;

export async function fetchHolidayFeed(): Promise<HolidayEvent[]> {
  try {
    const res = await fetch(NEPAL_HOLIDAY_FEED_URL, {
      next: { revalidate: ONE_DAY_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[holidays] Google calendar answered ${res.status}`);
      return [];
    }
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) {
      console.warn("[holidays] Google calendar returned something else");
      return [];
    }
    return parseHolidayFeed(text);
  } catch (error) {
    console.warn(
      "[holidays] could not read Google calendar:",
      (error as Error)?.message,
    );
    return [];
  }
}
