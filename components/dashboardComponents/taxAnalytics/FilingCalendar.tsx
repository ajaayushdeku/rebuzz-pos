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
import { CHART_PALETTE, ChartCard } from "../chartCard";

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
    badgeStyle: "border border-gray-200 text-gray-500 bg-white",
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
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[13px] font-medium text-amber-700">
              {d.upcomingCount} Filing Upcoming
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-600">
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
              className="flex items-start gap-3 border-b py-3 first:pt-0 last:border-0"
              style={{ borderColor: CHART_PALETTE.grid }}
            >
              <div className="mt-0.5 shrink-0">{cfg.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="truncate text-[13px]"
                    style={{ color: CHART_PALETTE.title }}
                  >
                    {entry.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${cfg.badgeStyle}`}
                  >
                    {cfg.badge}
                  </span>
                </div>
                <div
                  className="mt-1 flex items-center gap-3 text-[11px]"
                  style={{ color: CHART_PALETTE.subtitle }}
                >
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
