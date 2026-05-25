"use client";

import { Search } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferAudience() {
  const { form, updateField } = useOfferForm();

  const segments = [
    { value: "all", label: "All Customers" },
    { value: "at-risk", label: "At Risk Customers (Inactive for 10+ days)" },
    { value: "top-spenders", label: "Top 10% Spenders" },
    { value: "first-time", label: "First Time Visitors" },
  ] as const;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Target Audience</h2>

      <p className="text-sm text-gray-500 mt-1">
        Select which customers will receive this offer.
      </p>

      <div className="mt-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Segment
        </label>

        <select
          value={form.segment}
          onChange={(e) =>
            updateField(
              "segment",
              e.target.value as
                | "all"
                | "at-risk"
                | "top-spenders"
                | "first-time",
            )
          }
          className="h-11 rounded-xl border border-gray-200 px-4 outline-none"
        >
          {segments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 border border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          value={form.hasValueFor}
          onChange={(e) => updateField("hasValueFor", e.target.value)}
          placeholder="Search for specific individual customers..."
          className="flex-1 outline-none text-sm"
        />
        <button
          type="button"
          className="h-10 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium transition"
        >
          Add Manually
        </button>
      </div>
    </div>
  );
}
