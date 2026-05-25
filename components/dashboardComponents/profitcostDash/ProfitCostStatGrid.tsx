import StatBox, {
  StatBoxProps,
} from "../StatBox";

export default function StatBoxGrid({
  stats,
}: {
  stats: StatBoxProps[];
}) {
  return (
    <>
      {stats.map(({ key, ...stat }) => (
        <StatBox key={key} {...stat} />
      ))}
    </>
  );
}
