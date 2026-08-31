"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { LoyaltyStatus } from "@/components/settingsComponents/loyaltyPoints/loyaltyStatusConfig";
import {
  createLoyaltyTier,
  deleteLoyaltyTier,
  fetchLoyaltyTiers,
  updateLoyaltyTier,
  type LoyaltyTierPayload,
} from "@/services/apiLoyaltyTier.client";

export const LOYALTY_TIERS_KEY = ["loyalty-tiers"];

/**
 * A stable stand-in while the ladder loads.
 *
 * A fresh `[]` default would be a new reference on every render, which would
 * make the memo below rebuild its map each time for no gain.
 */
const NO_TIERS: LoyaltyStatus[] = [];

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: LOYALTY_TIERS_KEY,
    queryFn: fetchLoyaltyTiers,
  });
}

/** The colours the loyalty settings assigned to one tier. */
export interface TierStyle {
  /** Text colour class, e.g. "text-yellow-700". */
  color: string;
  /** Background class, e.g. "bg-yellow-100 border-yellow-200". */
  bgColor: string;
}

/**
 * Look a tier's colours up by name.
 *
 * Tier names and their colours are configured per business, so every screen
 * showing a badge — the customers table, the detail header, the loyalty card —
 * has to read the same ladder or the same tier comes out a different colour on
 * each. Matching is case- and whitespace-insensitive because the name is typed
 * by hand in settings.
 *
 * Returns undefined for a name the ladder does not have: an unconfigured
 * business, "No tier", or simply the render before the fetch lands. Callers
 * fall back to their own palette rather than leaving the badge unstyled.
 */
export function useTierStyle(): (name: string) => TierStyle | undefined {
  const { data: tiers = NO_TIERS } = useLoyaltyTiers();

  return useMemo(() => {
    const byName = new Map<string, TierStyle>();
    for (const tier of tiers) {
      byName.set(tier.name.trim().toLowerCase(), {
        color: tier.color,
        bgColor: tier.bgColor,
      });
    }
    return (name: string) => byName.get(name.trim().toLowerCase());
  }, [tiers]);
}

/**
 * Create, update and delete, each re-reading the list on success.
 *
 * The server owns the ordering and the ids, so the list is re-fetched rather
 * than patched in place — a tier's position in the ladder depends on every
 * other tier's threshold, which makes a local edit easy to get subtly wrong.
 */
export function useLoyaltyTierMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: LOYALTY_TIERS_KEY });

  const create = useMutation({
    mutationFn: (payload: LoyaltyTierPayload) => createLoyaltyTier(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: LoyaltyTierPayload;
    }) => updateLoyaltyTier(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLoyaltyTier(id),
    onSuccess: invalidate,
  });

  return {
    create,
    update,
    remove,
    isSaving: create.isPending || update.isPending,
    isDeleting: remove.isPending,
  };
}
