type ProgressBarProps = {
  percentage: number;
  color: string;
};

export function ProgressBar({
  percentage,
  color,
}: ProgressBarProps) {
  const clamped = Math.min(
    Math.max(percentage, 0),
    100,
  );
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          clamped >= 100
            ? "bg-red-100 text-red-700"
            : clamped >= 90
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
        }`}
      >
        {clamped}%
      </span>
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
