"use client";

import { AlertCircle, Calendar, CheckCircle2, Clock } from "lucide-react";
import { mockFilingCalendarData } from "@/lib/mockData/mock-tax-data";
import type { FilingStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";

const STATUS_CONFIG: Record<
  FilingStatus,
  {
    icon: React.ReactNode;
    badge: string;
    badgeStyle: string;
  }
> = {
  filed: {
    icon: <CheckCircle2 size={18} className="text-green-500" />,
    badge: "Filed",
    badgeStyle: "border border-gray-300 text-gray-500 bg-white",
  },
  pending: {
    icon: <AlertCircle size={18} className="text-amber-500" />,
    badge: "Pending",
    badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  overdue: {
    icon: <AlertCircle size={18} className="text-red-500" />,
    badge: "Overdue",
    badgeStyle: "bg-red-50 text-red-600 border border-red-200",
  },
};

export default function FilingCalendar() {
  const { currency } = useCurrency();
  const d = mockFilingCalendarData;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 h-full">
      <LockDimFeactureOverlay component_name="Filing Calendar" />

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-gray-900">Filing Calendar</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Tax filing and payment calendar with BS dates
        </p>
      </div>

      {/* Upcoming alert banner */}
      {d.upcomingCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700">
              {d.upcomingCount} Filing Upcoming
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
              {d.upcomingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {d.entries.map((entry) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div key={entry.id} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {entry.title}
                  </p>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${cfg.badgeStyle}`}
                  >
                    {cfg.badge}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar size={11} />
                    <span className="text-[11px]">Due: {entry.dueDate}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Est:{" "}
                    {formatCurrencySymbol(
                      entry.estimatedAmount,
                      currency.symbol,
                      currency.locale,
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
