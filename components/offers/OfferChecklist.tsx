"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

// Derived completion state shared with the page (drives section check marks).
export function useOfferChecklist() {
  const { form } = useOfferForm();

  const discount = !!form.discountKind && form.discount > 0;
  const details = form.cardName.trim().length > 0 && !!form.hasKey;
  const items =
    form.itemScope === "all" ||
    (form.itemScope === "category" && !!form.category) ||
    (form.itemScope === "specific" && !!form.productId);
  const audience = !!form.segment;
  const schedule = !!form.startDate && !!form.endDate;
  const channels = form.channels.length > 0;

  const steps = { discount, details, items, audience, schedule, channels };
  const done = Object.values(steps).filter(Boolean).length;

  return { steps, done, total: 6 };
}

const LABELS: { key: keyof ReturnType<typeof useOfferChecklist>["steps"]; label: string }[] = [
  { key: "discount", label: "Choose discount type" },
  { key: "details", label: "Offer details & code" },
  { key: "items", label: "Select items" },
  { key: "audience", label: "Target audience" },
  { key: "schedule", label: "Set schedule" },
  { key: "channels", label: "Delivery channels" },
];

export default function OfferChecklist() {
  const { steps, done, total } = useOfferChecklist();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Setup checklist</h3>
        <span className="text-xs text-gray-400 font-medium">
          {done}/{total}
        </span>
      </div>

      <div className="space-y-3">
        {LABELS.map(({ key, label }) => {
          const complete = steps[key];
          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              {complete ? (
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              ) : (
                <Circle size={18} className="text-gray-300 shrink-0" />
              )}
              <span className={complete ? "text-gray-700" : "text-gray-400"}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
