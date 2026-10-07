"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createOffer,
  deleteOffer,
  enableDisableOffer,
  fetchOffers,
  updateOffer,
  type Offer,
  type OfferFormData,
} from "@/services/apiOffers.client";

/**
 * The offers a business has, and making a new one.
 *
 * Both routes proxy to the POS API (`/business/offers/getall` and
 * `/business/offers/create`); this only decides when the browser asks and what
 * happens to the list afterwards.
 *
 * Creation is a mutation rather than a plain call so the list cannot go stale
 * behind it: an offer saved on one screen has to appear on the offers page, and
 * the page should not have to know that something elsewhere created one.
 *
 * Two conventions hold across all of them, so a caller can guess the next one:
 *
 * - **One argument is passed bare, more than one as an object.** `deleteOffer`
 *   needs only an id and takes it directly; update and enable/disable each need
 *   a second thing, so they take `{ offerId, … }`.
 * - **Every mutation reports itself with a toast** and invalidates the list.
 *   Callers do not add their own, or the same action announces itself twice.
 */

/** One key for the list, so anything creating an offer can invalidate it. */
export const OFFERS_QUERY = ["offers"] as const;

/**
 * Fresh for a minute.
 *
 * An offer list changes when someone on this device changes it — which goes
 * through the mutations below and invalidates immediately — so refetching on
 * every mount would be a round trip for an answer that has not moved. A minute
 * still covers the case of a second admin editing from another device.
 */
const REUSE_MS = 60 * 1000;

/** Every offer this business has, newest first as the POS returns them. */
export function useOffers() {
  return useQuery<Offer[]>({
    queryKey: OFFERS_QUERY,
    queryFn: fetchOffers,
    staleTime: REUSE_MS,
  });
}

/**
 * Create one offer.
 *
 * The caller gets the mutation whole — `mutate`, `mutateAsync`, `isPending`,
 * `error` — rather than a wrapped `isSaving` flag, because a form needs to
 * disable its button, show the failure next to the field, and sometimes await
 * the result before closing a modal.
 *
 * On success the list is invalidated rather than patched. The POS fills in
 * fields the client never sent — `_id`, `createdAt`, whatever it normalises —
 * so refetching is what guarantees the row on screen is the row that was
 * actually stored.
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation<Offer, Error, OfferFormData>({
    mutationFn: createOffer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OFFERS_QUERY });
      toast.success("Offer created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create offer: ${error.message}`);
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OFFERS_QUERY,
      });
      toast.success("Offer deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete offer: ${error.message}`);
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      offerId,
      fields,
    }: {
      offerId: string;
      fields: Parameters<typeof updateOffer>[1];
    }) => updateOffer(offerId, fields),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OFFERS_QUERY,
      });
      toast.success("Offer updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update offer: ${error.message}`);
    },
  });
}

/**
 * Turn one offer on or off.
 *
 * The route toggles whatever the POS currently holds, so the only thing this
 * needs is the id — but it takes `enabled` as well, meaning the offer's state
 * *before* the click. Without it the toast can only say "updated", which is both
 * vague and indistinguishable from an edit; with it, the message can name what
 * just happened, which is the whole point of confirming a switch.
 *
 * It is the current state rather than the wanted one because that is what the
 * row already has on screen, and because the POS decides the new value — this
 * only reports it.
 */
export function useEnableDisableOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId }: { offerId: string; enabled?: boolean }) =>
      enableDisableOffer(offerId),
    onSuccess: (_data, { enabled }) => {
      void queryClient.invalidateQueries({
        queryKey: OFFERS_QUERY,
      });
      toast.success(
        enabled === undefined
          ? "Offer updated successfully"
          : enabled
            ? "Offer disabled"
            : "Offer enabled",
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to update offer: ${error.message}`);
    },
  });
}
