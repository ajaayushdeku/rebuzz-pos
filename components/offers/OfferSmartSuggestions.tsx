"use client";

import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

const SUGGESTIONS: {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  segment?: string;
}[] = [
  {
    id: "dashain",
    icon: "🎉",
    title: "Dashain is in 12 days",
    subtitle: "Boost sales with a holiday promo",
  },
  {
    id: "winback",
    icon: "👥",
    title: "38 regulars slipping away",
    subtitle: "Send a win-back offer",
    segment: "lapsed",
  },
];

export default function OfferSmartSuggestions() {
  const { updateField } = useOfferForm();

  const apply = (s: (typeof SUGGESTIONS)[number]) => {
    if (s.id === "dashain") {
      updateField("festivalTab", "hindu");
      updateField("festival", "dashain");
    }
    if (s.segment) updateField("segment", s.segment);
    toast.success("Suggestion applied");
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles size={14} className="text-violet-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          Smart suggestions
        </h3>
      </div>

      <div className="space-y-2.5">
        {SUGGESTIONS.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl bg-white border border-violet-100 px-3 py-2.5"
          >
            <span className="text-lg">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {s.title}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {s.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => apply(s)}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg shrink-0"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
