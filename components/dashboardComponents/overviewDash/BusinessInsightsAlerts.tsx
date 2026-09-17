﻿"use client";

import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Package,
  User,
  Settings,
  Lightbulb,
  BellRing,
} from "lucide-react";
import { ComponentHeader } from "@/components/ComponentHeader";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";

/**
 * One entry per insight severity. `dot` colours the numbered bullet, `label`
 * names the severity so the list reads as a categorised feed instead of a pile
 * of tinted boxes the merchant has to decode by colour alone.
 */
const INSIGHT_STYLES = {
  success: {
    dot: "bg-green-500",
    label: "On track",
    labelColor: "text-green-700",
    ring: "border-green-100 hover:border-green-200",
    icon: <CheckCircle2 size={15} className="text-green-500 shrink-0" />,
  },
  warning: {
    dot: "bg-amber-500",
    label: "Needs attention",
    labelColor: "text-amber-700",
    ring: "border-amber-100 hover:border-amber-200",
    icon: <AlertTriangle size={15} className="text-amber-500 shrink-0" />,
  },
  info: {
    dot: "bg-blue-500",
    label: "For your info",
    labelColor: "text-blue-700",
    ring: "border-blue-100 hover:border-blue-200",
    icon: <Info size={15} className="text-blue-500 shrink-0" />,
  },
} as const;

const ALERT_CARD_STYLES = {
  danger: {
    shell: "bg-red-50/70 border-red-100",
    title: "text-red-700",
    sub: "text-red-600/80",
  },
  warning: {
    shell: "bg-amber-50/70 border-amber-100",
    title: "text-amber-700",
    sub: "text-amber-700/80",
  },
  info: {
    shell: "bg-blue-50/70 border-blue-100",
    title: "text-blue-700",
    sub: "text-blue-600/80",
  },
} as const;

const ALERT_ICONS = {
  alert: <AlertTriangle size={18} />,
  package: <Package size={18} />,
  user: <User size={18} />,
};

const ALERT_ICON_BG = {
  danger: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};
/** Section heading used to separate the feed from the alert cards. */
function SectionLabel({
  icon,
  children,
  count,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {children}
      </p>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
        {count}
      </span>
    </div>
  );
}

export default function BusinessInsightsAlerts() {
  const { status, data, error } = useAiInsightsResult();
  const insights = data?.insights ?? [];
  const alerts = data?.alerts ?? [];
  const needsSetup =
    error?.code === "NOT_CONFIGURED" || error?.code === "AI_DISABLED";

  // Severity tally drives the header chips, so the card tells you how the day
  // is going before you read a single row.
  const concerns =
    insights.filter((i) => i.type === "warning").length +
    alerts.filter((a) => a.type !== "info").length;
  const wins = insights.filter((i) => i.type === "success").length;
  const hasContent = insights.length > 0 || alerts.length > 0;
  return (
    <div className="relative bg-white rounded-2xl border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex-col gap-5">
      {/* Header — title on the left, live severity tally on the right */}
      <div className="flex items-start justify-between gap-4">
        <ComponentHeader
          title="Business Insights & Alerts"
          subHeader="Auto-generated insights based on today's data"
        />
        {status === "success" && hasContent && (
          <div className="flex items-center gap-1.5 shrink-0">
            {wins > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {wins} going well
              </span>
            )}
            {concerns > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {concerns} to check
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div className="flex flex-col gap-5" aria-busy>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}
      {/* Error */}
      {status === "error" && (
        <div className="rounded-xl border-gray-100 bg-gray-50/70 px-5 py-6 text-center">
          <p className="text-sm text-gray-600">{error?.message}</p>
          {needsSetup && (
            <a
              href="/settings/api-keys"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4 py-2 transition-colors"
            >
              <Settings size={13} /> Open API key settings
            </a>
          )}
        </div>
      )}

      {/* Success */}
      {status === "success" &&
        (!hasContent ? (
          <div className="rounded-xl border-gray-100 bg-gray-50/70 py-8 text-center">
            <p className="text-sm text-gray-500">
              No insights for this period yet.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              They appear once the AI has a full day to read.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {insights.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionLabel
                  icon={<Lightbulb size={13} />}
                  count={insights.length}
                >
                  What the numbers say
                </SectionLabel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {insights.map((insight, i) => {
                    const s = INSIGHT_STYLES[insight.type];
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-xl border bg-white px-3.5 py-3 transition-colors ${s.ring}`}
                      >
                        <span className="mt-0.5">{s.icon}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${s.labelColor}`}
                          >
                            {s.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-700">
                            {insight.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {alerts.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionLabel
                  icon={<BellRing size={13} />}
                  count={alerts.length}
                >
                  Action needed
                </SectionLabel>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.map((card, i) => {
                    const s = ALERT_CARD_STYLES[card.type];
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-xl px-4 py-4 border ${s.shell}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ALERT_ICON_BG[card.type]}`}
                        >
                          {ALERT_ICONS[card.icon]}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${s.title}`}>
                            {card.title}
                          </p>
                          <p
                            className={`mt-1 text-[11px] leading-snug ${s.sub}`}
                          >
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
