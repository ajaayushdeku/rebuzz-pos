"use client";

import { Trash2 } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferFooterActions() {
  const { resetForm, handleSave, isSaving } = useOfferForm();

  return (
    <div className="flex items-center justify-end gap-4 pt-6">
      <button
        type="button"
        onClick={resetForm}
        className="h-12 px-5 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition"
      >
        <Trash2 size={16} />
        Discard
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="h-12 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save & Exit"}
      </button>
    </div>
  );
}
