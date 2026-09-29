"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { mockFilingCalendarData } from "@/lib/mockData/mock-tax-data";
import type { FilingStatus } from "@/lib/mockData/mock-tax-data";
import LockDimFeactureOverlay from "@/components/LockDimFeactureOverlay";
import { useCurrency } from "@/providers/CurrencyContext";
import { formatCurrencySymbol } from "@/utils/helper";
import { ChartCard } from "../chartCard";

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
    badgeStyle:
      "border border-gray-200 text-gray-500 bg-white dark:border-white/15 dark:text-[#9aa6bd] dark:bg-white/5",
  },
  pending: {
    icon: <AlertCircle size={18} className="text-amber-500" />,
    badge: "Pending",
    badgeStyle:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 dark:text-amber-300",
  },
  overdue: {
    icon: <AlertCircle size={18} className="text-red-500 dark:text-red-400" />,
    badge: "Overdue",
    badgeStyle:
      "bg-red-50 text-red-600 border border-red-200 dark:bg-red-400/10 dark:border-red-400/25 dark:text-red-400",
  },
};

export default function FilingCalendar() {
  const { currency } = useCurrency();
  const d = mockFilingCalendarData;

  return (
    <ChartCard
      icon={CalendarDays}
      title="Filing Calendar"
      subtitle="Tax filing and payment calendar with BS dates"
      // Clipped so the lock overlay follows the card's rounded corners.
      className="h-full overflow-hidden select-none"
    >
      {/* Lock overlay — a direct child of the card, so it covers the header
          as well as the entries. */}
      <LockDimFeactureOverlay component_name="Filing Calendar" />

      {/* Upcoming alert banner */}
      {d.upcomingCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:bg-amber-400/10 dark:border-amber-400/25">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[13px] font-medium text-amber-700 dark:text-amber-300">
              {d.upcomingCount} Filing Upcoming
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
              {d.upcomingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Entries */}
      <div>
        {d.entries.map((entry) => {
          const cfg = STATUS_CONFIG[entry.status];
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 border-b py-3 first:pt-0 last:border-0 border-[#e8eaed] dark:border-white/10"
            >
              <div className="mt-0.5 shrink-0">{cfg.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] text-[#3c4043] dark:text-[#e8ecf4]">
                    {entry.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${cfg.badgeStyle}`}
                  >
                    {cfg.badge}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-[#9aa0a6] dark:text-[#9aa6bd]">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Due: {entry.dueDate}
                  </span>
                  <span className="tabular-nums">
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
    </ChartCard>
  );
}
