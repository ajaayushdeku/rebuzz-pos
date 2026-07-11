"use client";

import toast from "react-hot-toast";
import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferFooterActions() {
  const { handleSave, isSaving } = useOfferForm();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isSaving ? "Publishing..." : "Publish offer"}
      </button>
      <button
        type="button"
        onClick={() => toast.success("Saved as draft")}
        className="w-full h-10 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition"
      >
        Save as draft
      </button>
    </div>
  );
}
