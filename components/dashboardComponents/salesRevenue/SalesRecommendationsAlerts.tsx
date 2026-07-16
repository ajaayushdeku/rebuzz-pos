"use client";

import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

type Recommendation = {
  type: "warning" | "info" | "success";
  text: string;
};

const RECOMMENDATIONS: Recommendation[] = [
  {
    type: "warning",
    text: `"Latte" sells well but contributes only 12% profit due to high discounting. Review promo frequency.`,
  },
  {
    type: "info",
    text: `Adding a bundle deal for "Espresso + Croissant" could boost morning revenue by est. 8%.`,
  },
  {
    type: "success",
    text: `"Cappuccino" has the best margin ratio. Consider featuring it more prominently.`,
  },
];

const STYLES = {
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    icon: <AlertTriangle size={15} className="text-amber-500" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    icon: <Info size={15} className="text-blue-500" />,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    icon: <CheckCircle2 size={15} className="text-emerald-500" />,
  },
};

export default function SalesRecommendationsAlerts() {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <LockDimFeactureOverlay component_name="Recommendations & Alerts" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <CheckCircle2 size={15} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Recommendations & Alerts
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-generated insights from sales performance analysis
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation List */}
      <div className="space-y-2.5">
        {RECOMMENDATIONS.map((recommendation, index) => {
          const style = STYLES[recommendation.type];

          return (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${style.bg} ${style.border}`}
            >
              {/* Icon */}
              <div
                className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
              >
                {style.icon}
              </div>

              {/* Text */}
              <p className="text-xs text-gray-700 leading-relaxed">
                {recommendation.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-[11px] text-gray-400">
          Recommendations are generated automatically using sales trends,
          product profitability, customer purchasing behavior, and inventory
          performance.
        </p>
      </div>
    </div>
  );
}
