"use client";

import { ComponentHeader } from "@/components/ComponentHeader";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { CheckCircle2, AlertTriangle, Info, Package, User } from "lucide-react";

type Insight = {
  type: "success" | "warning" | "info";
  text: string;
};

type AlertCard = {
  type: "danger" | "warning" | "info";
  icon: "alert" | "package" | "user";
  title: string;
  subtitle: string;
};

const INSIGHTS: Insight[] = [
  {
    type: "success",
    text: "Saturday sales are 48% higher than the weekly average.",
  },
  { type: "success", text: "Repeat customer rate went up by 6% this week." },
  {
    type: "warning",
    text: "Milk stock is critically low. Expected to run out in ~2 hours.",
  },
  {
    type: "info",
    text: "Recommend running a promo on Matcha Latte – 5 days with 0 sales.",
  },
];

const ALERT_CARDS: AlertCard[] = [
  {
    type: "danger",
    icon: "alert",
    title: "High Expenses Detected",
    subtitle: "Marketing spend is 20% over budget.",
  },
  {
    type: "warning",
    icon: "package",
    title: "3 Items Low on Stock",
    subtitle: "Coffee beans and milk are running low.",
  },
  {
    type: "info",
    icon: "user",
    title: "5 Inactive VIP Customers",
    subtitle: "Send a win-back offer now.",
  },
];

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
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <LockDimFeactureOverlay component_name="Business Insights & Alerts" />

      {/* Header */}
      <ComponentHeader
        title="Business Insights & Alerts"
        subHeader="  Auto-generated insights based on today's data"
      />

      {/* Insight grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INSIGHTS.map((insight, i) => {
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

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ALERT_CARDS.map((card, i) => {
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
                <p className={`text-xs font-bold ${s.title}`}>{card.title}</p>
                <p className={`text-[11px] mt-0.5 ${s.sub}`}>{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
