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

  // Stacked and full-width on a phone, with Create lowest — it is the action
  // being reached for, and the nearest the thumb.
  return (
    <div className="flex flex-col gap-2.5 sm:ml-12 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
      <button
        type="button"
        onClick={() => toast.success("Saved as draft")}
        disabled={isSaving}
        className="h-10 w-full cursor-pointer rounded-xl bg-gray-100 px-6 sm:w-auto text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#c3ccdc] dark:bg-white/10"
      >
        Save as draft
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="h-10 w-full cursor-pointer rounded-xl bg-emerald-600 px-6 sm:w-auto text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Creating..." : "Create offer"}
      </button>
    </div>
  );
}
