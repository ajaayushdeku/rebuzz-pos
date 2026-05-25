"use client";

import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferBasicInfo() {
  const { form, updateField } = useOfferForm();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>

      <p className="text-sm text-gray-500 mt-1">
        Give your campaign a name and select the type of offer.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Campaign Name
          </label>

          <input
            type="text"
            value={form.cardName}
            onChange={(e) => updateField("cardName", e.target.value)}
            placeholder="e.g. Summer Coffee Blast"
            className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Discount Type
            </label>

            <select
              value={form.discountType}
              onChange={(e) =>
                updateField(
                  "discountType",
                  e.target.value as "percentage" | "fixed" | "bogo",
                )
              }
              className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fix Discount ($)</option>
              <option value="bogo">Buy One Get One</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Value
            </label>

            <input
              type="number"
              value={form.discount || ""}
              onChange={(e) => updateField("discount", Number(e.target.value))}
              className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
