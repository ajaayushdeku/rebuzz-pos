"use client";

import { CalendarDateFilter } from "@/components/dashboardComponents/staffDash/CalendarDateFilter";

export default function CustomerHeader() {
  return (
    <div className="flex items-center gap-2">
      <CalendarDateFilter />
    </div>
  );
}
