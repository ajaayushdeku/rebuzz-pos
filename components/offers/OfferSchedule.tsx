"use client";

import { useOfferForm, type FestivalTab, type ActiveHours } from "@/providers/OfferFormContext";

const FESTIVAL_TABS: { id: FestivalTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nepali", label: "Nepali BS" },
  { id: "hindu", label: "Hindu" },
  { id: "intl", label: "Intl" },
];

const FESTIVALS: { id: string; icon: string; label: string; tab: FestivalTab }[] = [
  { id: "dashain", icon: "🎉", label: "Dashain", tab: "hindu" },
  { id: "tihar", icon: "🪔", label: "Tihar", tab: "hindu" },
  { id: "teej", icon: "💃", label: "Teej", tab: "hindu" },
  { id: "new-year-bs", icon: "🇳🇵", label: "New Year BS", tab: "nepali" },
  { id: "holi", icon: "🎨", label: "Holi", tab: "hindu" },
  { id: "eid", icon: "🌙", label: "Eid", tab: "intl" },
  { id: "christmas", icon: "🎄", label: "Christmas", tab: "intl" },
  { id: "valentines", icon: "❤️", label: "Valentine's", tab: "intl" },
];

const ACTIVE_HOURS: { id: ActiveHours; label: string }[] = [
  { id: "all-day", label: "All day" },
  { id: "happy", label: "Happy hour (2PM-5PM)" },
  { id: "lunch", label: "Lunch (11AM-2PM)" },
  { id: "evening", label: "Evening (6PM-10PM)" },
];

export default function OfferSchedule() {
  const { form, updateField } = useOfferForm();

  const visibleFestivals =
    form.festivalTab === "all"
      ? FESTIVALS
      : FESTIVALS.filter((f) => f.tab === form.festivalTab);

  return (
    <div className="space-y-5">
      {/* Festival link (UI-only) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Link to a festival</p>
          <div className="flex items-center rounded-lg bg-gray-100 p-0.5">
            {FESTIVAL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => updateField("festivalTab", t.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  form.festivalTab === t.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleFestivals.map((f) => {
            const active = form.festival === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  updateField("festival", active ? "" : f.id)
                }
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dates → payload startDate / endDate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Start date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            End date
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active hours (UI-only) */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Active hours</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_HOURS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => updateField("activeHours", h.id)}
              className={`h-10 px-4 rounded-xl text-sm font-medium transition-colors ${
                form.activeHours === h.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
