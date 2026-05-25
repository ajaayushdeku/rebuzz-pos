"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

export default function OfferSummaryStatus() {
  const { form } = useOfferForm();

  const nameValid = form.cardName.trim().length > 0;
  const discountValid = form.discount > 0;
  const audienceSet = form.segment !== "all" || form.hasValueFor.trim() !== "";
  const scheduleSet = form.startDate && form.endDate;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-5">Summary Status</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          {nameValid && discountValid ? (
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          ) : (
            <Circle size={18} className="text-gray-300 shrink-0" />
          )}
          <span
            className={
              nameValid && discountValid ? "text-gray-600" : "text-gray-400"
            }
          >
            Campaign details valid
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {audienceSet ? (
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          ) : (
            <Circle size={18} className="text-gray-300 shrink-0" />
          )}
          <span className={audienceSet ? "text-gray-600" : "text-gray-400"}>
            {audienceSet ? "Audience selected" : "No audience selected"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {scheduleSet ? (
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          ) : (
            <Circle size={18} className="text-gray-300 shrink-0" />
          )}
          <span className={scheduleSet ? "text-gray-600" : "text-gray-400"}>
            {scheduleSet
              ? `Active ${form.startDate} — ${form.endDate}`
              : "Schedule not set"}
          </span>
        </div>
      </div>
    </div>
  );
}
