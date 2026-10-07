"use client";

import { useState } from "react";
// `Gift`, matching this page's entry in the settings nav.
import { Gift, Search } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import HeaderActionButton from "@/components/ui/HeaderActionButton";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import OfferTable from "@/components/settingsComponents/offers/OfferTable";
import EditOfferModal, {
  EMPTY_EDIT_FORM,
  toEditForm,
  toUpdatePayload,
  type OfferEditForm,
} from "@/components/settingsComponents/offers/EditOfferModal";
import {
  useDeleteOffer,
  useEnableDisableOffer,
  useOffers,
  useUpdateOffer,
} from "@/hooks/useOffers";
import type { Offer } from "@/services/apiOffers.client";

/**
 * The offers a business has made, with the two things you do to an existing one.
 *
 * Creating is not here. An offer is built over four steps beside a live customer
 * preview, which is a page of its own — this header links to it rather than
 * opening a dialog that could only ask for a fraction of it.
 */
export default function OffersSettingsPage() {
  const { data: offers = [], isLoading } = useOffers();
  const { mutate: updateOffer, isPending: updating } = useUpdateOffer();
  const { mutate: toggleOffer } = useEnableDisableOffer();
  const { mutate: deleteOffer, isPending: deleting } = useDeleteOffer();

  const [search, setSearch] = useState("");

  // Edit modal. One piece of state, not an `open` flag beside a target: the
  // modal is open because something is being edited, and two booleans can
  // disagree.
  const [editTarget, setEditTarget] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferEditForm>(EMPTY_EDIT_FORM);

  // The row whose switch is in flight, so the spinner sits on that row rather
  // than on every switch at once.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  const openEdit = (offer: Offer) => {
    setEditTarget(offer);
    setForm(toEditForm(offer));
  };

  const closeEdit = () => {
    setEditTarget(null);
    setForm(EMPTY_EDIT_FORM);
  };

  const saveEdit = () => {
    if (!editTarget) return;

    updateOffer(
      { offerId: editTarget._id, fields: toUpdatePayload(form) },
      // The hook reports both outcomes and refetches the list, so the only thing
      // left to decide is whether the modal closes — and a failure has to leave
      // it open, or the edit is lost along with the message explaining why.
      { onSuccess: closeEdit },
    );
  };

  const toggle = (offer: Offer) => {
    setTogglingId(offer._id);
    toggleOffer(
      // `enabled` is the state before the click — what the row is showing — so
      // the hook's toast can name what just happened.
      { offerId: offer._id, enabled: offer.enabled },
      { onSettled: () => setTogglingId(null) },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteOffer(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) });
  };

  const liveCount = offers.filter((offer) => offer.enabled).length;

  return (
    <div className="min-h-screen bg-surface-page px-6 py-8 md:px-10 dark:bg-[#0f1420]">
      <div className="mx-auto w-full space-y-6">
        <PageHeader
          title="Offers"
          subtitle={
            <>
              {offers.length} offer{offers.length === 1 ? "" : "s"}
              {offers.length > 0 && ` · ${liveCount} live`}
            </>
          }
          spaceBelow={false}
          actions={
            <HeaderActionButton
              variant="dashed"
              icon={Gift}
              hideLabelOnMobile
              label="New Offer"
              href="/offers"
            />
          }
        />

        <div className="relative mt-6 mb-8">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7b869b]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or promo code..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-[13px] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-white/5 dark:text-[#e8ecf4] dark:placeholder:text-[#7b869b]"
          />
        </div>

        <div className="rounded-xl bg-white px-5 dark:bg-[#0F1420]">
          <OfferTable
            offers={offers}
            search={search}
            onEdit={openEdit}
            onDelete={(id) =>
              setDeleteTarget(offers.find((o) => o._id === id) ?? null)
            }
            onToggle={toggle}
            loading={isLoading}
            togglingId={togglingId}
          />
        </div>
      </div>

      <EditOfferModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
        offer={editTarget}
        form={form}
        onFormChange={setForm}
        onSave={saveEdit}
        isPending={updating}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        icon={Gift}
        title="Delete offer?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed.`
            : "This offer will be permanently removed."
        }
        warning="This action cannot be undone."
        onConfirm={confirmDelete}
        isPending={deleting}
      />
    </div>
  );
}
