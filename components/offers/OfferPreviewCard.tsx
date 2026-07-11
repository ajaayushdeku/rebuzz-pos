"use client";

import { Eye, Tag } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";
import { AUDIENCE_SEGMENTS } from "./OfferAudience";

export default function OfferPreviewCard() {
  const { form } = useOfferForm();

  const discountLabel = () => {
    if (form.discountType === "bogo" || form.discountKind === "bogo")
      return "B1G1";
    if (!form.discount || form.discount <= 0) return "—";
    return form.discountType === "percentage"
      ? `${form.discount}%`
      : `Rs ${form.discount}`;
  };

  const reach = AUDIENCE_SEGMENTS.find((s) => s.id === form.segment)?.count;
  const channelCount = form.channels.length;

  const stats = [
    { label: "Discount", value: discountLabel() },
    { label: "Reach", value: reach ? reach.toLocaleString() : "—" },
    { label: "Channels", value: channelCount > 0 ? String(channelCount) : "—" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-1.5 text-gray-400 mb-3">
        <Eye size={13} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          Customer Preview
        </span>
      </div>

      {/* Gradient offer card */}
      <div className="rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-6 text-center text-white relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-white/40" />
            ))}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <Tag size={18} />
          </div>
          <h3 className="text-lg font-bold leading-tight">
            {form.cardName || "Your Offer Name"}
          </h3>
        </div>

        <div className="px-5 py-4">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wide text-center mb-2">
            USE PROMO CODE
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-center">
            <span className="font-bold tracking-[4px] text-gray-700">
              {form.hasKey || "REBUZZ"}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[9px] uppercase tracking-wide text-gray-400 font-semibold">
                  {s.label}
                </p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center">
            Claim Offer
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            preview only — not a button
          </p>
        </div>
      </div>
    </div>
  );
}
