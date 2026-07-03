"use client";

import { heatmapMock } from "@/lib/mockData/mock-heatmap";

interface HeatmapData {
  day: string;
  time: string;
  profit: number;
}

const getColor = (profit: number): string => {
  if (profit >= 150) return "bg-emerald-600";
  if (profit >= 120) return "bg-emerald-500";
  if (profit >= 90) return "bg-emerald-400";
  if (profit >= 60) return "bg-emerald-300";
  if (profit >= 30) return "bg-emerald-200";
  return "bg-emerald-100";
};

export default function DayTimeProfitHeatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const times = ["7a", "9a", "11a", "1p", "3p", "5p", "7p"];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 w-full relative select-none mt-4">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-black/10 p-3">
            <svg
              className="w-8 h-8 text-gray-800"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-gray-700 tracking-wide">
            Feature locked
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 tracking-tight">
          Day × Time Profit Heatmap
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Average profit generation by hour and day of week
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Time headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="w-12"></div>
            {times.map((time) => (
              <div
                key={time}
                className="text-center text-xs text-gray-500 font-medium"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {days.map((day) => (
            <div key={day} className="grid grid-cols-8 gap-1 mb-1">
              {/* Day label */}
              <div className="w-12 flex items-center">
                <span className="text-xs text-gray-600 font-medium">{day}</span>
              </div>

              {/* Time slots */}
              {times.map((time) => {
                const dataPoint = heatmapMock.find(
                  (d) => d.day === day && d.time === time,
                );
                const profit = dataPoint?.profit || 0;

                return (
                  <div
                    key={`${day}-${time}`}
                    className={`h-10 rounded ${getColor(profit)}`}
                    title={`${day} ${time}: $${profit}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-500">Low</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-emerald-100"></div>
          <div className="w-4 h-4 rounded bg-emerald-200"></div>
          <div className="w-4 h-4 rounded bg-emerald-300"></div>
          <div className="w-4 h-4 rounded bg-emerald-400"></div>
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <div className="w-4 h-4 rounded bg-emerald-600"></div>
        </div>
        <span className="text-xs text-gray-500">High Profit</span>
      </div>
    </div>
  );
}
