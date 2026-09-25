"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * The business's hourly AI insight allowance.
 *
 * Enforced in the service (see `aiRateLimit`): a sliding hour per business,
 * counted only when a request actually reaches the provider — a cached insight
 * costs nothing. These are the service's own numbers rather than a tally kept
 * here, because this browser cannot see generations from another device, from
 * another tab, or a service restart that clears the buckets.
 */
export interface AiQuota {
  limit: number;
  used: number;
  remaining: number;
  /** Epoch ms at which the window next frees a slot. */
  resetAt: number;
  windowMs: number;
}

export const AI_QUOTA_KEY = ["ai-quota"] as const;

async function fetchAiQuota(): Promise<AiQuota | null> {
  const res = await fetch("/api/ai-insights/quota", { cache: "no-store" });
  // A missing or unreachable service is not an error worth showing here: the
  // meter simply does not appear.
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  return typeof data?.limit === "number" ? (data as AiQuota) : null;
}

export function useAiQuota() {
  return useQuery({
    queryKey: AI_QUOTA_KEY,
    queryFn: fetchAiQuota,
    // The window is an hour long, so it moves slowly — but a generation
    // elsewhere should show up without a reload.
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Feeds the meter from an insights response's own headers.
 *
 * Every insights answer carries the allowance, so a generation updates the
 * meter immediately rather than waiting for the next poll.
 */
export function useAiQuotaFromHeaders() {
  const queryClient = useQueryClient();

  return useCallback(
    (headers: Headers) => {
      const limit = Number(headers.get("X-RateLimit-Limit"));
      const remaining = Number(headers.get("X-RateLimit-Remaining"));
      const resetSec = Number(headers.get("X-RateLimit-Reset"));
      if (!Number.isFinite(limit) || !Number.isFinite(remaining)) return;

      queryClient.setQueryData<AiQuota | null>(AI_QUOTA_KEY, (prev) => ({
        limit,
        remaining,
        used: Math.max(0, limit - remaining),
        resetAt: Number.isFinite(resetSec)
          ? resetSec * 1000
          : (prev?.resetAt ?? Date.now()),
        windowMs: prev?.windowMs ?? 60 * 60 * 1000,
      }));
    },
    [queryClient],
  );
}
