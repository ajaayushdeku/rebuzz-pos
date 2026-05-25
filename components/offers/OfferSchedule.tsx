"use client";

import { CalendarDays } from "lucide-react";
import { useOfferForm } from "@/providers/OfferFormContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function OfferSchedule() {
  const { form, updateField } = useOfferForm();

  const toggleDay = (day: string) => {
    const exists = form.repeatingDays.includes(day);
    if (exists) {
      updateField(
        "repeatingDays",
        form.repeatingDays.filter((d) => d !== day),
      );
    } else {
      updateField("repeatingDays", [...form.repeatingDays, day]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">Schedule & Duration</h2>
        <p className="text-sm text-gray-500 mt-1">
          When should this offer be active?
        </p>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none"
              />
              <CalendarDays
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none"
              />
              <CalendarDays
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Repeating days */}
        <div className="mt-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Repeat on days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = form.repeatingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-10 w-12 rounded-xl text-sm font-medium transition-colors ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
        <p className="text-sm text-gray-500 italic">
          Scheduled campaigns automatically expire at 11:59 PM on the end date.
        </p>
      </div>
    </div>
  );
}
