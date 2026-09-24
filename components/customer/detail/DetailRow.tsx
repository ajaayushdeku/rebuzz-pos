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
    <div className="flex items-start gap-3 border-b border-[#e8eaed] py-2.5 last:border-b-0">
      <div
        className="mt-0.5 shrink-0"
        style={{ color: CHART_PALETTE.subtitle }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 ">
        <p
          className="text-[11px] uppercase mb-0.5"
          style={{ color: CHART_PALETTE.subtitle }}
        >
          {label}
        </p>
        <p
          className="break-words text-[14px] font-medium"
          style={{ color: CHART_PALETTE.title }}
        >
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}
