"use client";

import { Search } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

// Audience segments (UI). `count` is an indicative reach used by the preview /
// estimated-cost panels.
export const AUDIENCE_SEGMENTS: {
  id: string;
  icon: string;
  label: string;
  count: number;
  badge?: string;
}[] = [
  { id: "all", icon: "🌐", label: "All customers", count: 1420 },
  { id: "new", icon: "🐣", label: "New customers", count: 74 },
  { id: "lapsed", icon: "😴", label: "Lapsed customers", count: 38, badge: "Win back" },
  { id: "loyal", icon: "❤️", label: "Loyal regulars", count: 210 },
  { id: "birthdays", icon: "🎂", label: "Upcoming birthdays", count: 42 },
  { id: "vip", icon: "👑", label: "VIP top spenders", count: 30 },
  { id: "referred", icon: "🎗️", label: "Referred by friends", count: 96 },
  { id: "high-ticket", icon: "💎", label: "High ticket average", count: 85 },
];

const TRIGGERS: { id: string; label: string }[] = [
  { id: "first-order", label: "First order" },
  { id: "hasnt-ordered", label: "Hasn't ordered in a while" },
  { id: "every-nth", label: "Every Nth order" },
  { id: "birthday", label: "On their birthday" },
];

export default function OfferAudience() {
  const { form, updateField } = useOfferForm();

  const toggleTrigger = (id: string) => {
    const exists = form.sendTriggers.includes(id);
    updateField(
      "sendTriggers",
      exists
        ? form.sendTriggers.filter((t) => t !== id)
        : [...form.sendTriggers, id],
    );
  };

  return (
    <div className="space-y-5">
      {/* Segment cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AUDIENCE_SEGMENTS.map((s) => {
          const active = form.segment === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => updateField("segment", s.id)}
              className={`relative text-left rounded-xl border p-3 transition-all ${
                active
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-lg mb-1.5">{s.icon}</div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {s.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {s.count.toLocaleString()} people
              </p>
              {s.badge && (
                <span className="absolute top-2 right-2 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Automatic send triggers */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Send automatically when...
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRIGGERS.map((t) => {
            const checked = form.sendTriggers.includes(t.id);
            return (
              <label
                key={t.id}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTrigger(t.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Specific customer → payload hasValueFor */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Find a specific customer
        </p>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={form.hasValueFor}
            onChange={(e) => updateField("hasValueFor", e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
