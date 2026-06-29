"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/components/dashboardComponents/staffDash/DateRangeFilter";
import { resolveRange } from "./profitCostRange";

/**
 * Global date-range filter for the Profit & Cost page.
 * The selected range is stored in the URL (startDate/endDate) so it acts as
 * the single source of truth shared by every child component on the page.
 */
export default function ProfitCostHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value: DateRangeValue = resolveRange({
    range: searchParams.get("range") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });

  const handleChange = ({ startDate, endDate }: DateRangeValue) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("range");
    sp.set("startDate", startDate);
    sp.set("endDate", endDate);
    router.push(`?${sp.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <DateRangeFilter value={value} onChange={handleChange} showPresets />
    </div>
  );
}
