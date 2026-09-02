"use client";

import toast from "react-hot-toast";
import { useOfferForm } from "@/providers/OfferFormContext";

/**
 * The two ways out of the builder.
 *
 * Right-aligned under the last step rather than beside the preview: the
 * preview is something to read, and a Create button parked in it invites a
 * click before the steps have been filled in.
 */
export default function OfferFooterActions() {
  const { handleSave, isSaving } = useOfferForm();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-12">
      <button
        type="button"
        onClick={() => toast.success("Saved as draft")}
        disabled={isSaving}
        className="h-12 cursor-pointer rounded-xl bg-gray-100 px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save as draft
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="h-12 cursor-pointer rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Creating..." : "Create offer"}
      </button>
    </div>
  );
}
