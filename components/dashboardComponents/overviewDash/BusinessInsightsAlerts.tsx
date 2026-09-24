"use client";

import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Package,
  User,
  Lightbulb,
  BellRing,
} from "lucide-react";
import { ChartCard } from "@/components/dashboardComponents/chartCard";
import { useAiInsightsResult } from "@/components/aiInsights/AiInsightsProvider";
import AiInsightsErrorState from "@/components/aiInsights/AiInsightsErrorState";

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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
        {children}
      </p>
      <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#5f6368]">
        {count}
      </span>
    </div>
  );
}

export default function BusinessInsightsAlerts() {
  const { status, data, error, regenerate } = useAiInsightsResult();
  const insights = data?.insights ?? [];
  const alerts = data?.alerts ?? [];

  // Severity tally drives the header chips, so the card tells you how the day
  // is going before you read a single row.
  const concerns =
    insights.filter((i) => i.type === "warning").length +
    alerts.filter((a) => a.type !== "info").length;
  const wins = insights.filter((i) => i.type === "success").length;
  const hasContent = insights.length > 0 || alerts.length > 0;
  return (
    <ChartCard
      icon={Lightbulb}
      // Violet, the AI cards' colour: violet-600 / violet-200 / violet-50.
      iconColor="#7c3aed"
      iconBorder="#ddd6fe"
      iconBg="#f5f3ff"
      title="Business Insights & Alerts"
      info={{
        heading: "Reading this card",
        // Model output, grouped by how urgent it is.
        body: "What the AI read in today's numbers. The first group is observations, grouped as on track, needs attention or for your info. Action needed lists the things worth doing something about now.",
      }}
      subtitle="Auto-generated insights based on today's data"
      controls={
        status === "success" && hasContent ? (
          <>
            {wins > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {wins} going well
              </span>
            )}
            {concerns > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {concerns} to check
              </span>
            )}
          </>
        ) : undefined
      }
      // `flex` is what makes `flex-col gap-5` do anything. Without it the
      // card was a plain block, the gap never applied, and "What the numbers
      // say" sat directly against the header.
      className="flex flex-col gap-5"
    >
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
        <AiInsightsErrorState error={error} onRetry={regenerate} />
      )}

      {/* Success */}
      {status === "success" &&
        (!hasContent ? (
          <div className="rounded-xl border border-[#e3e3e3] py-12 text-center">
            <p className="text-sm text-[#3c4043]">
              No insights for this period yet
            </p>
            <p className="mt-1 text-xs text-[#9aa0a6]">
              They appear once the AI has a full day to read
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
                          <p className="mt-0.5 text-xs leading-relaxed tracking-wide text-[#5f6368]">
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
                          <p className={`text-xs font-semibold ${s.title}`}>
                            {card.title}
                          </p>
                          <p
                            className={`mt-1 text-[11px] tracking-wide leading-snug ${s.sub}`}
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
    </ChartCard>
  );
}
