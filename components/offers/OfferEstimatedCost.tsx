"use client";

import { useOfferForm } from "@/providers/OfferFormContext";
import { AUDIENCE_SEGMENTS } from "./OfferAudience";

export default function OfferEstimatedCost() {
  const { form } = useOfferForm();

  const reach = AUDIENCE_SEGMENTS.find((s) => s.id === form.segment)?.count ?? 0;
  const channels = form.channels.length;
  const ready = reach > 0 && channels > 0;

  // Indicative send cost: ~Rs 1.5 per recipient per channel.
  const estimate = ready ? Math.round(reach * channels * 1.5) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Estimated campaign cost
      </h3>
      {ready ? (
        <>
          <p className="text-2xl font-bold text-gray-900">
            Rs {estimate.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ~{reach.toLocaleString()} people · {channels}{" "}
            {channels === 1 ? "channel" : "channels"}
          </p>
        </>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Pick an offer &amp; audience to estimate cost.
        </p>
      )}
    </div>
  );
}
