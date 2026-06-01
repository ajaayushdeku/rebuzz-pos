import { StatBoxProps } from "../StatBox";
import ProfitCostStatBox from "./ProfitCostStatBox";

export default function ProfitCostStatBoxGrid({
  stats,
}: {
  stats: StatBoxProps[];
}) {
  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <ProfitCostStatBox key={key} {...stat} />
      ))}
    </>
  );
}
