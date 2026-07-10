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
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  },
};

export default function SalesRecommendationsAlerts() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <LockDimFeactureOverlay component_name="Recommendations & Alerts" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Recommendations & Alerts
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Auto-generated insights from sales performance analysis
          </p>
        </div>

        {/* Recommendation List */}
        <div className="space-y-4">
          {RECOMMENDATIONS.map((recommendation, index) => {
            const style = STYLES[recommendation.type];

            return (
              <div
                key={index}
                className={`
                  flex items-center gap-4
                  rounded-2xl
                  border
                  px-6
                  py-5
                  transition-all
                  duration-200
                  hover:shadow-sm
                  ${style.bg}
                  ${style.border}
                `}
              >
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
                >
                  {style.icon}
                </div>

                {/* Text */}
                <p className="text-lg leading-8 text-slate-700">
                  {recommendation.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-400">
            Recommendations are generated automatically using sales trends,
            product profitability, customer purchasing behavior, and inventory
            performance.
          </p>
        </div>
      </div>
    </div>
  );
}
