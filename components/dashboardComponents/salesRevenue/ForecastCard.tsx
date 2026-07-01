"use client";

import { TrendingUp, MapPin, Sun, Calendar } from "lucide-react";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import type {
  ForecastData,
  ConfidenceLevel,
} from "@/lib/mockData/mock-forecast-data";

const DRIVER_ICONS: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp size={14} className="text-green-600" />,
  Sun: <Sun size={14} className="text-amber-500" />,
  MapPin: <MapPin size={14} className="text-red-500" />,
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  High: "bg-green-50 text-green-700 border-green-200",
  Likely: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-red-50 text-red-600 border-red-200",
};

interface ForecastCardProps {
  data: ForecastData;
}

export default function ForecastCard({ data }: ForecastCardProps) {
  const { currency } = useCurrency();

  const fmt = (v: number) =>
    formatCurrencySymbol(v, currency.symbol, currency.locale);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full relative select-none">
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
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp size={15} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              What&lsquo;s coming forecast
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              AI-driven predictive demand metrics
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Confidence
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              CONFIDENCE_STYLES[data.confidence]
            }`}
          >
            {data.confidence}
          </span>
        </div>
      </div>

      {/* Forecast numbers */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
            Tomorrow&lsquo;s forecast
          </p>
          <p className="text-xl font-bold text-gray-900">
            {fmt(data.tomorrowForecast)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Base baseline: {fmt(data.tomorrowBaseline)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
            Weekly projection
          </p>
          <p className="text-xl font-bold text-gray-900">
            {fmt(data.weeklyProjection)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Base baseline: {fmt(data.weeklyBaseline)}
          </p>
        </div>
      </div>

      {/* Drivers */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
          Key forecast drivers
        </p>
        <div className="space-y-2">
          {data.drivers.map((driver) => (
            <div
              key={driver.label}
              className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                  {DRIVER_ICONS[driver.icon]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {driver.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {driver.description}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold shrink-0 ${
                  driver.impact >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {driver.impact >= 0 ? "+" : ""}
                {driver.impact}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer outlook */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Calendar size={13} />
          <span className="text-xs">Weekly outlook:</span>
        </div>
        <p className="text-xs font-semibold text-indigo-600">
          {data.weeklyOutlook}
        </p>
      </div>
    </div>
  );
}
