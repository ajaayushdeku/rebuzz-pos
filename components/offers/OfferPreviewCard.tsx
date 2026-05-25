"use client";

import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferPreviewCard() {
  const { form } = useOfferForm();

  const discountLabel = () => {
    if (!form.discount || form.discount <= 0) return "";
    switch (form.discountType) {
      case "percentage":
        return `${form.discount}% OFF`;
      case "fixed":
        return `$${form.discount} OFF`;
      case "bogo":
        return "Buy One Get One";
      default:
        return "";
    }
  };

  const campaignName = form.cardName || "Untitled Offer";
  const discountText = discountLabel();
  const showSchedule = form.startDate || form.endDate;

  return (
    <div className="bg-[#2563eb] rounded-3xl p-5 shadow-xl sticky top-6">
      <div className="mb-5">
        <h3 className="text-white text-xl font-bold">Offer Preview</h3>
        <p className="text-blue-100 text-sm mt-1">
          This is how it looks for customers
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
            Exclusive
          </span>
          <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
            REBUZZ REWARDS
          </span>
        </div>

        <h2 className="text-4xl font-bold text-gray-900 leading-tight">
          {campaignName || "Untitled Offer"}
        </h2>

        <p className="text-gray-500 mt-4 text-lg leading-relaxed">
          {discountText
            ? `Enjoy ${discountText} on your next visit!`
            : "Set a discount value to preview"}
        </p>

        {/* Coupon */}
        <div className="mt-6 border-2 border-dashed border-gray-300 rounded-2xl h-16 flex items-center justify-center">
          <p className="font-bold tracking-[4px] text-gray-400">
            CODE: {form.hasKey || "REBUZZ24"}
          </p>
        </div>

        <button className="w-full h-14 bg-[#0f172a] text-white rounded-2xl font-semibold mt-6 hover:opacity-90 transition">
          Claim Offer Now
        </button>
      </div>

      {/* Schedule info */}
      {showSchedule && (
        <div className="mt-4 text-center text-blue-100 text-xs">
          {form.startDate && <span>From {form.startDate} </span>}
          {form.endDate && <span>until {form.endDate}</span>}
        </div>
      )}
    </div>
  );
}
