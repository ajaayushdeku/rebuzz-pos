/* ── Error State ── */
export const ComponentHeader = ({
  title,
  subHeader,
}: {
  title: string;
  subHeader: string;
}) => {
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{subHeader}</p>
    </div>
  );
};
