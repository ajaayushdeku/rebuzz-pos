/* ── Error State ── */
export const ComponentHeader = ({
  title,
  subHeader,
  titleColor = "text-gray-900",
}: {
  title: string;
  subHeader: string;
  titleColor?: string;
}) => {
  return (
    <div>
      <h2 className={`text-sm font-bold ${titleColor}`}>{title}</h2>
      <p className="text-[11px] text-gray-400 mt-0.5">{subHeader}</p>
    </div>
  );
};
