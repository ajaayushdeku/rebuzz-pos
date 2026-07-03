"use client";

import { useState } from "react";
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
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <OverviewStatBox
          key={key}
          {...stat}
          isExpanded={expandedKey === key}
          onToggle={() => handleToggle(key)}
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
