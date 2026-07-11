"use client";

import { useOfferForm, type DiscountType } from "@/providers/OfferFormContext";

// The full discount grid (UI). Each option maps to a payload discountType
// (percent / amount / bogo) so the API payload stays valid.
const DISCOUNTS: {
  id: string;
  icon: string;
  title: string;
  discountType: DiscountType;
}[] = [
  { id: "percentage", icon: "🏷️", title: "Percentage discount", discountType: "percentage" },
  { id: "rupee", icon: "💰", title: "Rupee discount", discountType: "fixed" },
  { id: "bogo", icon: "🛍️", title: "Buy 1 Get 1 Free", discountType: "bogo" },
  { id: "combo", icon: "🍔", title: "Combo deal", discountType: "fixed" },
  { id: "free-item", icon: "🎁", title: "Free item", discountType: "fixed" },
  { id: "bonus", icon: "⭐", title: "Bonus points", discountType: "fixed" },
  { id: "happy-hour", icon: "⏰", title: "Happy hour", discountType: "percentage" },
  { id: "stamp", icon: "☕", title: "Digital stamp card", discountType: "fixed" },
  { id: "eod", icon: "🌙", title: "End of day clearance", discountType: "percentage" },
];

export default function OfferDiscount() {
  const { form, updateField } = useOfferForm();

  const selected = DISCOUNTS.find((d) => d.id === form.discountKind);
  const valueUnit =
    selected?.discountType === "percentage"
      ? "%"
      : selected?.discountType === "fixed"
        ? "Rs"
        : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DISCOUNTS.map((d) => {
          const active = form.discountKind === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                updateField("discountKind", d.id);
                updateField("discountType", d.discountType);
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                active
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <span className="text-2xl">{d.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center">
                {d.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Value — needed for a valid save (discount > 0) */}
      {selected && (
        <div className="max-w-xs">
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Discount value {valueUnit && `(${valueUnit})`}
          </label>
          <input
            type="number"
            min={0}
            value={form.discount || ""}
            onChange={(e) => updateField("discount", Number(e.target.value))}
            placeholder="0"
            className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}
