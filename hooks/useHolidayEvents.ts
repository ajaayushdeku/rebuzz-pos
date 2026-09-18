"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  HOLIDAY_EVENTS,
  mergeHolidayEvents,
  type HolidayEvent,
} from "@/lib/holidayCalendar";

const DAY_MS = 24 * 60 * 60 * 1000;

async function fetchFeed(): Promise<HolidayEvent[]> {
  const res = await fetch("/api/holidays");
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  return Array.isArray(json?.data?.events) ? json.data.events : [];
}

/**
 * Nepal's holidays: the official notice, with Google's calendar filling the
 * years and short-notice holidays the notice does not have.
 *
 * The notice is available at once; Google's part arrives a moment later and
 * is kept for a day. Until then — or if it never arrives — this is the notice
 * alone, so nothing waits on Google or breaks without it.
 */
export function useHolidayEvents(): HolidayEvent[] {
  const { data } = useQuery({
    queryKey: ["holiday-feed"],
    queryFn: fetchFeed,
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return useMemo(
    () => (data ? mergeHolidayEvents(data) : HOLIDAY_EVENTS),
    [data],
  );
}
