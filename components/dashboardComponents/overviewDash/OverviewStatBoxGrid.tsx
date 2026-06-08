"use client";

import { MergedSerializableConfig } from "@/lib/config/dashboard";
import OverviewStatBox from "./OverviewStatBox";

const OverviewStatBoxGrid = ({
  stats,
  periodLabel = "from previous month",
  isLoading = false,
}: {
  stats: MergedSerializableConfig[];
  periodLabel?: string;
  isLoading?: boolean;
}) => {
  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <OverviewStatBox
          key={key}
          {...stat}
          periodLabel={periodLabel}
          isLoading={isLoading}
        />
      ))}
    </>
  );
};

export default OverviewStatBoxGrid;
