"use client"; // only this new shell is client

import { useState } from "react";
import RevenueVsProfitChart, {
  DateRange,
  ProductData,
} from "./RevenueVsProfitChart";

// Client shell — owns range state, passes to chart
export function RevenueVsProfitChartClient({
  initialData,
  todayData,
}: {
  initialData: ProductData[];
  todayData: ProductData[];
}) {
  const [range, setRange] = useState<DateRange>("30d");

  return (
    <RevenueVsProfitChart
      initialData={initialData}
      todayData={todayData}
      initialRange={range}
      onRangeChange={setRange}
    />
  );
}
