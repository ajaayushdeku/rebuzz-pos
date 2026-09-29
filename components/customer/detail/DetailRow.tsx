import type { ReactNode } from "react";

import { CHART_PALETTE } from "@/components/dashboardComponents/chartCard";

/**
 * Icon, label, value — the row shape used by both the customer information
 * card and the loyalty card's quick stats, which had two identical copies of
 * this markup.
 *
 * Label and value follow the dashboard's type scale: a muted 11px label over
 * a 13px value, split by the same hairline the tables use.
 */
export default function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#e8eaed] py-2.5 last:border-b-0 dark:border-white/10">
      <div className="mt-0.5 shrink-0 text-[#9aa0a6] dark:text-[#9aa6bd]">
        {icon}
      </div>
      <div className="min-w-0 flex-1 ">
        <p className="text-[11px] uppercase mb-0.5 text-[#9aa0a6] dark:text-[#9aa6bd]">
          {label}
        </p>
        <p className="break-words text-[14px] font-medium text-[#3c4043] dark:text-[#e8ecf4]">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}
