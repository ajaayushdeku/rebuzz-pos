"use client";

import { MergedSerializableConfig } from "@/lib/config/dashboard";
import OverviewStatBox from "./OverviewStatBox";

const OverviewStatBoxGrid = ({
  stats,
  periodLabel = "from previous month",
  comparisonDateRangeLabel,
  currentDateRange,
  isLoading = false,
}: {
  stats: MergedSerializableConfig[];
  periodLabel?: string;
  comparisonDateRangeLabel?: string;
  currentDateRange?: string;
  isLoading?: boolean;
}) => {
  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <OverviewStatBox
          key={key}
          {...stat}
          periodLabel={periodLabel}
          comparisonDateRangeLabel={comparisonDateRangeLabel}
          currentDateRange={currentDateRange}
          isLoading={isLoading}
        />
      ))}
    </>
  );
};

export default OverviewStatBoxGrid;
