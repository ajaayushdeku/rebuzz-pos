"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLoyaltyTier,
  deleteLoyaltyTier,
  fetchLoyaltyTiers,
  updateLoyaltyTier,
  type LoyaltyTierPayload,
} from "@/services/apiLoyaltyTier.client";

export const LOYALTY_TIERS_KEY = ["loyalty-tiers"];

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: LOYALTY_TIERS_KEY,
    queryFn: fetchLoyaltyTiers,
  });
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
