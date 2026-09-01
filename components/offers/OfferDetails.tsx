"use client";

import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferDetails() {
  const { form, updateField } = useOfferForm();

  return (
    <div className="space-y-5">
      {/* Offer name → payload cardName */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Offer name
        </label>
        <input
          type="text"
          value={form.cardName}
          onChange={(e) => updateField("cardName", e.target.value)}
          placeholder="e.g. Dashain 20% Off"
          className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Customers won&apos;t see this
        </p>
      </div>

      {/* Promo code → payload hasKey */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">
            Promo code
          </label>
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(["auto", "custom"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateField("promoMode", mode)}
                className={`px-3 py-1 capitalize transition-colors ${
                  form.promoMode === mode
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={form.hasKey}
          readOnly={form.promoMode === "auto"}
          onChange={(e) => updateField("hasKey", e.target.value.toUpperCase())}
          placeholder="REBUZZ"
          className={`w-full h-11 rounded-xl border border-gray-200 px-4 text-sm tracking-wider outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            form.promoMode === "auto" ? "bg-gray-50 text-gray-500" : ""
          }`}
        />
      </div>
    </div>
  );
}
