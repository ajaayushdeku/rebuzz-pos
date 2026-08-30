"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * The raw `subscriptionType` recorded on the signed-in account.
 *
 * One hook rather than a query in each component: the navbar badge and the
 * sidebar plan card were both keyed on `["profile-subscription"]` but returned
 * different shapes, so whichever mounted first filled the cache and the other
 * misread it — a yearly subscriber saw "Free" in the sidebar.
 *
 * The raw string is deliberately what comes back. Interpreting it belongs to
 * `resolvePlanId` / `planBadge`, so the two consumers cannot drift apart in how
 * they read the same value.
 */
export function useSubscriptionType() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile-subscription"],
    queryFn: async (): Promise<string | null> => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;

      const json = await res.json();
      const value = json?.data?.user?.subscriptionType;
      return typeof value === "string" ? value : null;
    },
    // A plan changes at most once in a session, and always through a flow that
    // reloads the page — so this need not be re-fetched on every mount.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { subscriptionType: data ?? null, isLoading };
}
