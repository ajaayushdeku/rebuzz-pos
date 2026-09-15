"use client";

import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Package,
  User,
  Settings,
} from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";

const INSIGHT_STYLES = {
  success: {
    bg: "bg-green-50",
    border: "border-green-100",
    icon: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: <Info size={16} className="text-blue-400 shrink-0" />,
  },
};

const ALERT_CARD_STYLES = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-100",
    title: "text-red-700",
    sub: "text-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "text-amber-700",
    sub: "text-amber-600",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "text-blue-700",
    sub: "text-blue-500",
  },
};

const ALERT_ICONS = {
  alert: <AlertTriangle size={22} />,
  package: <Package size={22} />,
  user: <User size={22} />,
};

const ALERT_ICON_BG = {
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

export default function BusinessInsightsAlerts() {
  const { status, data, error } = useAiInsightsResult();
  const insights = data?.insights ?? [];
  const alerts = data?.alerts ?? [];
  const needsSetup =
    error?.code === "NOT_CONFIGURED" || error?.code === "AI_DISABLED";

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <ComponentHeader
        title="Business Insights & Alerts"
        subHeader="Auto-generated insights based on today's data"
      />

      {/* Loading */}
      {status === "loading" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-11 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-600">{error?.message}</p>
          {needsSetup && (
            <a
              href="/settings/api-keys"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-1.5 transition-colors"
            >
              <Settings size={13} /> Open API key settings
            </a>
          )}
        </div>
      )}

      {/* Success */}
      {status === "success" && (
        <>
          {insights.length === 0 && alerts.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No insights for this period yet.
            </p>
          ) : (
            <>
              {insights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {insights.map((insight, i) => {
                    const s = INSIGHT_STYLES[insight.type];
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 border ${s.bg} ${s.border}`}
                      >
                        {s.icon}
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {insight.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {alerts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {alerts.map((card, i) => {
                    const s = ALERT_CARD_STYLES[card.type];
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-2xl px-4 py-4 border ${s.bg} ${s.border}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ALERT_ICON_BG[card.type]}`}
                        >
                          {ALERT_ICONS[card.icon]}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${s.title}`}>
                            {card.title}
                          </p>
                          <p className={`text-[11px] mt-0.5 ${s.sub}`}>
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
