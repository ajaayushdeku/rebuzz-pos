"use client";

import { useState } from "react";
import { MergedSerializableConfig } from "@/lib/config/dashboard";
import OverviewStatBox from "./OverviewStatBox";
import { STAT_ROW, STAT_ROW_ITEM } from "./statRow";

/**
 * The four stat boxes, and the row they sit in.
 *
 * The row is this component's job rather than the caller's: it used to be a
 * class string in each of the wrapper's two branches, and only one of them was
 * ever updated — the custom-date branch kept a two-column grid while the cards
 * had already grown a carousel's fixed width, which overflowed the page.
 */
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
    <div className="mt-4">
      <div className={STAT_ROW}>
        {stats.map(({ key, ...stat }) => (
          <div key={key} className={STAT_ROW_ITEM}>
            <OverviewStatBox
              {...stat}
              isExpanded={expandedKey === key}
              onToggle={() => handleToggle(key)}
              periodLabel={periodLabel}
              comparisonDateRangeLabel={comparisonDateRangeLabel}
              currentDateRange={currentDateRange}
              isLoading={isLoading}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewStatBoxGrid;
