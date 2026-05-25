"use client";

import { MergedSerializableConfig } from "@/lib/config/dashboard";
import OverviewStatBox from "./OverviewStatBox";

const OverviewStatBoxGrid = ({
  stats,
  periodLabel = "from previous month",
}: {
  stats: MergedSerializableConfig[];
  periodLabel?: string;
}) => {
  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <OverviewStatBox key={key} {...stat} periodLabel={periodLabel} />
      ))}
    </>
  );
};

export default OverviewStatBoxGrid;
